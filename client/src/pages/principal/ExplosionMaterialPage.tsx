import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, BarChart3, Loader2, Edit, Trash2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// INTERFAZ DE PLANEACIÓN CONTRATO
interface PlaneacionContrato {
  id: number;
  no_req: number;
  id_contrato: number;
  id_sede: number;
  id_detalle_zona: number;
  fecha_inicial: string;
  fecha_final: string;
  num_ciclos: number;
  estado: 'ENPROCESO' | 'CERRADO';
  id_usuario: number;
  fecha_creacion: string;
  // Campos de relación
  numero_contrato?: string;
  nombre_sede?: string;
  nombre_zona?: string;
  no_rqp?: string;
  entidad_contratante?: string;
  numero_menu_inicial?: number;
  numero_menu_final?: number;
  fecha_contrato_inicial?: string;
  fecha_contrato_final?: string;
  fecha_contrato_ejecucion?: string;
  no_servicios?: number;
  valor_total?: number;
}

// INTERFAZ DE CONTRATO
interface Contrato {
  id: number;
  numero_contrato: string;
  cliente: string;
  objeto: string;
  nit_cliente: string;
  fecha_inicial: string;
  fecha_final: string;
  sede: string;
  zona: string;
  n_ppl: string;
  n_servicios: number;
  servicios_dia: number;
  raciones_dia: number;
}

// INTERFAZ DE ZONA
interface Zona {
  id: number;
  nombre: string;
  codigo: string;
}

const ExplosionMaterialPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "activo" | "inactivo" | "pendiente" | "ejecutado">("activo");
  const [activeTab, setActiveTab] = useState("materiales");
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const queryClient = useQueryClient();

  // Función para asignar colores diferentes a cada estado
  const getEstadoColor = (estado: string) => {
    const colors = {
      activo: "bg-green-50 text-green-700 border-green-200",
      inactivo: "bg-gray-50 text-gray-700 border-gray-200",
      pendiente: "bg-yellow-50 text-yellow-700 border-yellow-200",
      ejecutado: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return colors[estado as keyof typeof colors] || colors.inactivo;
  };

  // Query para obtener planeaciones de contratos desde la base de datos
  const { data: planeaciones = [], isLoading } = useQuery({
    queryKey: ["planeaciones-contratos"],
    queryFn: async () => {
      // Importar el servicio dinámicamente para evitar problemas de importación
      const { planeacionesService } = await import('@/services/planeacionesService');
      return planeacionesService.getAll();
    },
  });

  // Query para obtener materiales (mantener para compatibilidad)
  const materiales = planeaciones.map((planeacion: PlaneacionContrato, index: number) => ({
    id: planeacion.id,
    item: planeacion.no_req,
    no_rqp: planeacion.no_rqp || `RQ-00-${String(planeacion.no_req).padStart(4, '0')}`,
    no_contrato: planeacion.numero_contrato || `CT-${planeacion.id_contrato}`,
    entidad_contratante: planeacion.entidad_contratante || 'Sin especificar',
    fecha_planeacion_inicial: planeacion.fecha_inicial,
    fecha_planeacion_final: planeacion.fecha_final,
    fecha_planeacion_dias: planeacion.num_ciclos,
    numero_menu_inicial: planeacion.numero_menu_inicial || 1,
    numero_menu_final: planeacion.numero_menu_final || 28,
    fecha_contrato_inicial: planeacion.fecha_contrato_inicial || planeacion.fecha_inicial,
    fecha_contrato_final: planeacion.fecha_contrato_final || planeacion.fecha_final,
    fecha_contrato_ejecucion: planeacion.fecha_contrato_ejecucion || planeacion.fecha_inicial,
    cantidad_servicios: planeacion.no_servicios || 0,
    valor_total: planeacion.valor_total || 0,
    estado: planeacion.estado === 'ENPROCESO' ? 'activo' : 'ejecutado',
    created_at: planeacion.fecha_creacion,
    updated_at: planeacion.fecha_creacion,
  }));

  // Consulta para obtener zonas
  const { data: zonas = [] } = useQuery({
    queryKey: ["zonas"],
    queryFn: async () => {
      return [
        { id: 1, nombre: "Zona Norte", codigo: "ZN" },
        { id: 2, nombre: "Zona Sur", codigo: "ZS" },
        { id: 3, nombre: "Zona Centro", codigo: "ZC" },
        { id: 4, nombre: "Zona Oriente", codigo: "ZO" },
        { id: 5, nombre: "Zona Occidente", codigo: "ZW" }
      ] as Zona[];
    },
  });

  // Funciones de manejo
  const handleEditarMaterial = (material: any) => {
    console.log('Editar material:', material);
    setEditingMaterial(material);
    setActiveTab("registro");
  };

  const handleEliminarMaterial = async (id: number) => {
    console.log('Eliminar material:', id);
    try {
      // Importar el servicio dinámicamente para evitar problemas de importación
      const { planeacionesService } = await import('@/services/planeacionesService');
      await planeacionesService.delete(id);
      
      // Recargar los datos usando React Query
      queryClient.invalidateQueries({ queryKey: ["planeaciones-contratos"] });
    } catch (error) {
      console.error('Error al eliminar material:', error);
    }
  };

  // Filtrado de materiales
  const materialesFiltrados = materiales.filter(material => {
    const term = (searchTerm || "").toLowerCase();
    const matchesSearch =
      (material.item?.toString() || "").toLowerCase().includes(term) ||
      (material.no_rqp || "").toLowerCase().includes(term) ||
      (material.no_contrato || "").toLowerCase().includes(term) ||
      (material.entidad_contratante || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ? true : material.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Explosión de materiales por menús
        </h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="materiales"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Explosión de Materiales
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            disabled={!editingMaterial}
            className={`data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 ${
              !editingMaterial ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Editar Explosión
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materiales" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">EXPLOSIÓN DE MATERIALES POR MENÚS</span>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-cyan-50 rounded-lg mb-4 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por item, RQP, contrato, entidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="min-w-[180px]">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "activo" | "inactivo" | "pendiente" | "ejecutado")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="ejecutado">Ejecutado</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabla de ciclos */}
            <div className="relative overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[1200px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-1 py-1 text-teal-600 w-16">Acciones</TableHead>
                    <TableHead className="px-2 py-2 w-24">No RQP</TableHead>
                    <TableHead className="px-2 py-2 w-28">No Contrato</TableHead>
                    <TableHead className="px-2 py-2 w-48">Entidad Contratante</TableHead>
                    <TableHead className="px-2 py-2 w-36">Fechas de Planeación</TableHead>
                    <TableHead className="px-2 py-2 w-24">Menús</TableHead>
                    <TableHead className="px-2 py-2 w-40">Fechas del Contrato</TableHead>
                    <TableHead className="px-2 py-2 w-32">Cantidades x Día</TableHead>
                    <TableHead className="px-2 py-2 w-32">Valores</TableHead>
                    <TableHead className="px-2 py-2 w-24">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        No hay materiales disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    materialesFiltrados.map((material) => (
                      <TableRow key={material.id} className="hover:bg-gray-50">
                        <TableCell className="px-1 py-1 w-16">
                          <div className="flex flex-row gap-1 items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditarMaterial(material)}
                                    aria-label="Editar material"
                                  >
                                    <Edit className="h-5 w-5 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-24">
                          {material.no_rqp}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-28">
                          {material.no_contrato}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-48">
                          {material.entidad_contratante}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-36">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(material.fecha_planeacion_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(material.fecha_planeacion_final).toLocaleDateString()}</div>
                            <div><strong>Días:</strong> {material.fecha_planeacion_dias}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-24">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {material.numero_menu_inicial}</div>
                            <div><strong>Final:</strong> {material.numero_menu_final}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-40">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(material.fecha_contrato_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(material.fecha_contrato_final).toLocaleDateString()}</div>
                            <div><strong>Ejecución:</strong> {new Date(material.fecha_contrato_ejecucion).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-32">
                          <div className="space-y-0.5">
                            <div><strong>Servicios:</strong> {material.cantidad_servicios}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-right w-32">
                          <div className="space-y-0.5">
                            <div><strong>Total:</strong> ${material.valor_total.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-left w-24">
                          <Badge
                            variant="outline"
                            className={getEstadoColor(material.estado)}
                          >
                            {material.estado.charAt(0).toUpperCase() + material.estado.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          {/* Formulario compacto de Datos del Contrato */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-600" />
              Datos del Contrato
            </h3>
            
            {/* Primera fila - 6 campos */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">N°.Contrato</label>
                <Input 
                  placeholder="Número de contrato" 
                  className="bg-yellow-50 border-blue-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Cliente</label>
                <Input placeholder="Nombre del cliente" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Objeto</label>
                <Input placeholder="Objeto del contrato" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nit Cliente</label>
                <Input placeholder="NIT del cliente" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Fecha Inicial</label>
                <Input placeholder="dd/mm/aaaa" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Fecha Final</label>
                <Input placeholder="dd/mm/aaaa" />
              </div>
            </div>

            {/* Segunda fila - 6 campos */}
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Sede</label>
                <Select>
                  <SelectTrigger className="bg-yellow-50 border-blue-300">
                    <SelectValue placeholder="Seleccione una sede" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Sede Principal</SelectItem>
                    <SelectItem value="sur">Sede Sur</SelectItem>
                    <SelectItem value="centro">Sede Centro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Zona</label>
                <Select>
                  <SelectTrigger className="bg-yellow-50 border-blue-300">
                    <SelectValue placeholder="Seleccione una Grupo/zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas.map((zona) => (
                      <SelectItem key={zona.id} value={zona.codigo}>
                        {zona.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">N° PPL</label>
                <Input placeholder="Número PPL" className="bg-yellow-50 border-blue-300" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nº Servicios</label>
                <Input placeholder="Número de servicios" className="bg-yellow-50 border-blue-300" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Servicios/Dia</label>
                <Input placeholder="Servicios por día" className="bg-yellow-50 border-blue-300" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Raciones/Dia</label>
                <Input placeholder="Raciones por día" className="bg-yellow-50 border-blue-300" />
              </div>
            </div>

            {/* Periodo a Analizar */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Periodo a Analizar:</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="bg-gray-100 text-gray-700">
                    Fecha Inicial
                  </Button>
                  <Input placeholder="dd/mm/aaaa" className="w-32 bg-yellow-50 border-blue-300" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">N° Dias</label>
                  <Input placeholder="Días" className="w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" className="bg-gray-100 text-gray-700">
                    Fecha Final
                  </Button>
                  <Input placeholder="dd/mm/aaaa" className="w-32 bg-yellow-50 border-blue-300" />
                </div>
                <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Editar Material</h3>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingMaterial(null);
                  setActiveTab("materiales");
                }}
              >
                Cancelar
              </Button>
            </div>
            <p className="text-gray-600">
              {editingMaterial ? `Editando material con ID: ${editingMaterial.id}` : 'No hay material seleccionado'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExplosionMaterialPage;