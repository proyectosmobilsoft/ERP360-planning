import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, BarChart3, Edit, Trash2, Loader2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// INTERFAZ DE PLANEACIÓN DE CONTRATOS
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
  nombre_usuario?: string;
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

const PlaneacionCompraPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "activo" | "inactivo" | "pendiente" | "ejecutado">("activo");
  const [activeTab, setActiveTab] = useState("planeaciones");
  const [showContratosModal, setShowContratosModal] = useState(false);
  const [editingPlaneacion, setEditingPlaneacion] = useState<PlaneacionContrato | null>(null);
  const queryClient = useQueryClient();

  // Función para generar el título dinámico
  const getPageTitle = () => {
    if (editingPlaneacion) {
      const noReq = editingPlaneacion.no_req;
      const formattedReq = `RQ-${String(noReq).padStart(2, '0')}-${String(noReq).padStart(4, '0')}`;
      return `Editar Análisis de Compra (N° REQ: ${formattedReq})`;
    }
    return "Planeación de la Compra";
  };

  // Schema de validación
  const planeacionSchema = z.object({
    item: z.number().min(1, "El item es requerido"),
    no_rqp: z.string().min(1, "El número RQP es requerido"),
    no_contrato: z.string().min(1, "El número de contrato es requerido"),
    entidad_contratante: z.string().min(1, "La entidad contratante es requerida"),
    fecha_planeacion_inicial: z.string().min(1, "La fecha inicial es requerida"),
    fecha_planeacion_final: z.string().min(1, "La fecha final es requerida"),
    fecha_planeacion_dias: z.number().min(1, "Los días son requeridos"),
    numero_menu_inicial: z.number().min(1, "El número inicial de menú es requerido"),
    numero_menu_final: z.number().min(1, "El número final de menú es requerido"),
    fecha_contrato_inicial: z.string().min(1, "La fecha inicial del contrato es requerida"),
    fecha_contrato_final: z.string().min(1, "La fecha final del contrato es requerida"),
    fecha_contrato_ejecucion: z.string().min(1, "La fecha de ejecución es requerida"),
    cantidad_servicios: z.number().min(1, "La cantidad de servicios es requerida"),
    valor_total: z.number().min(1, "El valor total es requerido"),
    estado: z.string().min(1, "El estado es requerido"),
  });

  const form = useForm<z.infer<typeof planeacionSchema>>({
    resolver: zodResolver(planeacionSchema),
    defaultValues: {
      item: 1,
      no_rqp: "",
      no_contrato: "",
      entidad_contratante: "",
      fecha_planeacion_inicial: "",
      fecha_planeacion_final: "",
      fecha_planeacion_dias: 0,
      numero_menu_inicial: 0,
      numero_menu_final: 0,
      fecha_contrato_inicial: "",
      fecha_contrato_final: "",
      fecha_contrato_ejecucion: "",
      cantidad_servicios: 0,
      valor_total: 0,
      estado: "pendiente",
    },
  });

  // Funciones de manejo
  const handleEditarPlaneacion = (planeacion: PlaneacionContrato) => {
    setEditingPlaneacion(planeacion);
    form.reset(planeacion);
    setActiveTab("registro");
  };

  const handleEliminarPlaneacion = async (id: number) => {
    console.log('Eliminar planeación:', id);
    try {
      // Importar el servicio dinámicamente
      const { planeacionesService } = await import('@/services/planeacionesService');
      await planeacionesService.delete(id);
      
      // Recargar los datos usando React Query
      queryClient.invalidateQueries({ queryKey: ["planeaciones-contratos"] });
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleCrearPlaneacion = (data: z.infer<typeof planeacionSchema>) => {
    console.log("Crear/Actualizar planeación:", data);
    // Implementar lógica de creación/actualización
  };

  const handleSelectContrato = (contrato: Contrato) => {
    form.setValue("no_contrato", contrato.numero_contrato);
    form.setValue("entidad_contratante", contrato.cliente);
    setShowContratosModal(false);
  };

  // Función para asignar colores diferentes a cada estado
  const getEstadoColor = (estado: string) => {
    const colors = {
      ENPROCESO: "bg-yellow-50 text-yellow-700 border-yellow-200",
      CERRADO: "bg-green-50 text-green-700 border-green-200",
    };
    return colors[estado as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200";
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

  const nextItemNumber = planeaciones.length > 0 ? Math.max(...planeaciones.map(p => p.no_req)) + 1 : 1;

  // Query para obtener ciclos (mantener para compatibilidad)
  const ciclos = planeaciones.map((planeacion: PlaneacionContrato, index: number) => ({
    id: planeacion.id,
    item: planeacion.no_req,
    no_rqp: `RQP-${planeacion.no_req}`,
    no_contrato: planeacion.numero_contrato || `CT-${planeacion.id_contrato}`,
    entidad_contratante: "Empresa Cliente", // Se puede obtener de la relación con contratos
    fecha_planeacion_inicial: planeacion.fecha_inicial,
    fecha_planeacion_final: planeacion.fecha_final,
    fecha_planeacion_dias: planeacion.num_ciclos,
    numero_menu_inicial: 1,
    numero_menu_final: 28,
    fecha_contrato_inicial: planeacion.fecha_inicial,
    fecha_contrato_final: planeacion.fecha_final,
    fecha_contrato_ejecucion: planeacion.fecha_inicial,
    cantidad_servicios: 500,
    valor_total: 25000000,
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

  // Filtrado de planeaciones
  const planeacionesFiltradas = planeaciones.filter(planeacion => {
    const term = (searchTerm || "").toLowerCase();
    const matchesSearch =
      (planeacion.no_req?.toString() || "").toLowerCase().includes(term) ||
      (`RQP-${planeacion.no_req}` || "").toLowerCase().includes(term) ||
      (planeacion.numero_contrato || "").toLowerCase().includes(term) ||
      ("Empresa Cliente" || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ? true : (planeacion.estado === 'ENPROCESO' ? 'activo' : 'ejecutado') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtrado de ciclos (mantener para compatibilidad)
  const ciclosFiltrados = ciclos.filter(ciclo => {
    const term = (searchTerm || "").toLowerCase();
    const matchesSearch =
      (ciclo.item?.toString() || "").toLowerCase().includes(term) ||
      (ciclo.no_rqp || "").toLowerCase().includes(term) ||
      (ciclo.no_contrato || "").toLowerCase().includes(term) ||
      (ciclo.entidad_contratante || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ? true : ciclo.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          {getPageTitle()}
        </h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="planeaciones"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Análisis de Compra
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            disabled={!editingPlaneacion}
            className={`data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300 ${
              !editingPlaneacion ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Editar Análisis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planeaciones" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">ANÁLISIS DE COMPRA</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setEditingPlaneacion(null);
                    form.reset({
                      item: nextItemNumber,
                      no_rqp: "",
                      no_contrato: "",
                      entidad_contratante: "",
                      fecha_planeacion_inicial: "",
                      fecha_planeacion_final: "",
                      fecha_planeacion_dias: 0,
                      numero_menu_inicial: 0,
                      numero_menu_final: 0,
                      fecha_contrato_inicial: "",
                      fecha_contrato_final: "",
                      fecha_contrato_ejecucion: "",
                      cantidad_servicios: 0,
                      valor_total: 0,
                      estado: "pendiente",
                    });
                    setActiveTab("registro");
                  }}
                  className="bg-brand-lime hover:bg-brand-lime/90"
                  size="sm"
                >
                  Nueva Planeación
                </Button>
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

            {/* Tabla de planeaciones */}
            <div className="relative overflow-x-auto rounded-lg shadow-sm">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin h-10 w-10 text-cyan-600" />
                    <span className="text-cyan-700 font-semibold">Cargando planeaciones...</span>
                  </div>
                </div>
              )}
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
                  {planeacionesFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        No hay planeaciones disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    planeacionesFiltradas.map((planeacion) => (
                      <TableRow key={planeacion.id} className="hover:bg-gray-50">
                        <TableCell className="px-1 py-1 w-16">
                          <div className="flex flex-row gap-1 items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditarPlaneacion(planeacion)}
                                    aria-label="Editar planeación"
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
                          {planeacion.no_rqp}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-28">
                          {planeacion.no_contrato}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-48">
                          {planeacion.entidad_contratante}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-36">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(planeacion.fecha_planeacion_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(planeacion.fecha_planeacion_final).toLocaleDateString()}</div>
                            <div><strong>Días:</strong> {planeacion.fecha_planeacion_dias}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-24">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {planeacion.numero_menu_inicial}</div>
                            <div><strong>Final:</strong> {planeacion.numero_menu_final}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-40">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(planeacion.fecha_contrato_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(planeacion.fecha_contrato_final).toLocaleDateString()}</div>
                            <div><strong>Ejecución:</strong> {new Date(planeacion.fecha_contrato_ejecucion).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-32">
                          <div className="space-y-0.5">
                            <div><strong>Servicios:</strong> {planeacion.cantidad_servicios}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-right w-32">
                          <div className="space-y-0.5">
                            <div><strong>Total:</strong> ${planeacion.valor_total.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-left w-24">
                          <Badge
                            variant="outline"
                            className={getEstadoColor(planeacion.estado)}
                          >
                            {planeacion.estado.charAt(0).toUpperCase() + planeacion.estado.slice(1)}
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
      </Tabs>
    </div>
  );
};

export default PlaneacionCompraPage;