import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, BarChart3, Edit, Trash2, Loader2, Filter, X } from "lucide-react";
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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactSelect from "react-select";
import ContratosModal from "@/components/ContratosModal";

// Estilos personalizados para react-select
const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '36px',
    backgroundColor: state.isFocused ? '#fefce8' : '#fefce8',
    borderColor: state.isFocused ? '#3b82f6' : '#93c5fd',
    boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
    '&:hover': {
      borderColor: '#3b82f6'
    }
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#0ea5e9' : state.isFocused ? '#e0f2fe' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    '&:hover': {
      backgroundColor: state.isSelected ? '#0ea5e9' : '#e0f2fe'
    }
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#9ca3af'
  })
};

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
  // Campos calculados según la vista SQL
  no_rqp?: string;
  numero_contrato?: string;
  entidad_contratante?: string;
  fecha_contrato_inicial?: string;
  fecha_contrato_final?: string;
  fecha_contrato_ejecucion?: string;
  no_ppl?: number;
  no_servicios?: number;
  raciones?: number;
  valor_racion?: number;
  valor_total?: number;
  nombre_sede?: string;
  codigo_sede?: string;
  numero_menu_inicial?: number;
  numero_menu_final?: number;
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

// Importar la interfaz del servicio
import { ContratoDetallado } from '@/services/contratosService';

const AnalisisCompraPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "activo" | "inactivo" | "pendiente" | "ejecutado">("activo");
  const [activeTab, setActiveTab] = useState("ciclos");
  const queryClient = useQueryClient();

  // Estados para el formulario
  const [showContratosModal, setShowContratosModal] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoDetallado | null>(null);
  const [fechaInicial, setFechaInicial] = useState<Date | null>(null);
  const [fechaFinal, setFechaFinal] = useState<Date | null>(null);
  const [fechaInicialAnalisis, setFechaInicialAnalisis] = useState<Date | null>(null);
  const [fechaFinalAnalisis, setFechaFinalAnalisis] = useState<Date | null>(null);
  const [filtrosActivos, setFiltrosActivos] = useState<string[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<any>(null);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<any>(null);

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

  // Query para obtener ciclos (mantener para compatibilidad)
  const ciclos = planeaciones.map((planeacion: PlaneacionContrato, index: number) => ({
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


  // Query para obtener sedes de la base de datos
  const { data: sedes = [] } = useQuery({
    queryKey: ["sedes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gen_sucursales')
        .select('id, nombre, codigo')
        .eq('estado', 1)
        .order('nombre');

      if (error) throw error;
      return data || [];
    },
  });

  // Query para obtener zonas relacionadas al contrato seleccionado
  const { data: zonasData = [] } = useQuery({
    queryKey: ["zonas", contratoSeleccionado?.id],
    queryFn: async () => {
      if (!contratoSeleccionado?.id) return [];

      const { data, error } = await supabase
        .from('prod_zonas_by_contrato')
        .select(`
                 prod_zonas_contrato!id_zona (
                   id,
                   nombre,
                   codigo
                 )
               `)
        .eq('id_contrato', contratoSeleccionado.id);

      if (error) throw error;

      // Extraer las zonas de la relación
      const zonas = (data || [])
        .map((item: any) => item.prod_zonas_contrato)
        .filter(Boolean)
        .map((zona: any) => ({
          id: zona.id,
          nombre: zona.nombre,
          codigo: zona.codigo
        }));

      return zonas;
    },
    enabled: !!contratoSeleccionado?.id,
  });

  // Opciones para los selects mejorados
  const opcionesSedes = sedes.map((sede: any) => ({
    value: sede.id,
    label: sede.nombre
  }));

  const opcionesZonas = zonasData.map((zona: any) => ({
    value: zona.id,
    label: zona.nombre
  }));

  // Función para manejar la selección de contrato
  const handleSelectContrato = (contrato: any) => {
    setContratoSeleccionado(contrato);
    setFechaInicial(new Date(contrato.fecha_inicial));
    setFechaFinal(new Date(contrato.fecha_final));

    // Establecer solo la sede seleccionada
    if (contrato.sede) {
      setSedeSeleccionada({
        value: contrato.sede.id,
        label: contrato.sede.nombre
      });
    }

    // Limpiar la zona seleccionada para que el usuario la elija
    setZonaSeleccionada(null);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltrosActivos([]);
    setFechaInicialAnalisis(null);
    setFechaFinalAnalisis(null);
  };

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    const nuevosFiltros = [];
    if (fechaInicialAnalisis) nuevosFiltros.push(`Desde: ${fechaInicialAnalisis.toLocaleDateString()}`);
    if (fechaFinalAnalisis) nuevosFiltros.push(`Hasta: ${fechaFinalAnalisis.toLocaleDateString()}`);
    setFiltrosActivos(nuevosFiltros);
  };

  // Filtrado de ciclos
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

  // Funciones para manejar acciones
  const handleEditarPlaneacion = (planeacion: PlaneacionContrato) => {
    console.log('Editar planeación:', planeacion);
    // Aquí se puede abrir un modal o cambiar a la pestaña de edición
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

  return (
    <div className="p-4 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2">
          <FileText className="w-8 h-8 text-cyan-600" />
          Análisis de la Compra
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="ciclos"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Ciclos
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Nuevo Ciclo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ciclos" className="mt-6">
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">ANÁLISIS DE COMPRA</span>
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
                    <TableHead className="px-2 py-2 w-16">Item</TableHead>
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
                  {ciclosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="h-24 text-center">
                        No hay ciclos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ciclosFiltrados.map((ciclo) => (
                      <TableRow key={ciclo.id} className="hover:bg-gray-50">
                        <TableCell className="px-1 py-1 w-16">
                          <div className="flex flex-row gap-1 items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditarPlaneacion(planeaciones.find(p => p.id === ciclo.id)!)}
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

                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Eliminar planeación"
                                      >
                                        <Trash2 className="h-5 w-5 text-rose-600 hover:text-rose-800 transition-colors" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar planeación?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que deseas eliminar permanentemente la planeación{" "}
                                    <strong>{ciclo.item}</strong>?
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleEliminarPlaneacion(ciclo.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-16">
                          {ciclo.item}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-24">
                          {ciclo.no_rqp}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-28">
                          {ciclo.no_contrato}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-48">
                          {ciclo.entidad_contratante}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-36">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(ciclo.fecha_planeacion_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(ciclo.fecha_planeacion_final).toLocaleDateString()}</div>
                            <div><strong>Días:</strong> {ciclo.fecha_planeacion_dias}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-24">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {ciclo.numero_menu_inicial}</div>
                            <div><strong>Final:</strong> {ciclo.numero_menu_final}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-40">
                          <div className="space-y-0.5">
                            <div><strong>Inicial:</strong> {new Date(ciclo.fecha_contrato_inicial).toLocaleDateString()}</div>
                            <div><strong>Final:</strong> {new Date(ciclo.fecha_contrato_final).toLocaleDateString()}</div>
                            <div><strong>Ejecución:</strong> {new Date(ciclo.fecha_contrato_ejecucion).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-left w-32">
                          <div className="space-y-0.5">
                            <div><strong>Servicios:</strong> {ciclo.cantidad_servicios}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-sm text-gray-900 text-right w-32">
                          <div className="space-y-0.5">
                            <div><strong>Total:</strong> ${ciclo.valor_total.toLocaleString()}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-left w-24">
                          <Badge
                            variant="outline"
                            className={getEstadoColor(ciclo.estado)}
                          >
                            {ciclo.estado.charAt(0).toUpperCase() + ciclo.estado.slice(1)}
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

            {/* Primera fila - 8 campos readonly */}
            <div className="grid grid-cols-8 gap-3 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">N°.Contrato</label>
                <div className="relative">
                  <Input
                    value={contratoSeleccionado?.numero_contrato || ""}
                    onFocus={() => setShowContratosModal(true)}
                    className="bg-yellow-50 border-blue-300 cursor-pointer h-8 text-xs"
                    readOnly
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-gray-700">Cliente</label>
                <Input
                  value={contratoSeleccionado?.cliente || ""}
                  className="h-8 text-xs"
                  readOnly
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-gray-700">Objeto</label>
                <Input
                  value={contratoSeleccionado?.objeto || ""}
                  className="h-8 text-xs"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nit Cliente</label>
                <Input
                  value={contratoSeleccionado?.nit_cliente || ""}
                  className="h-8 text-xs"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Fecha Inicial</label>
                <Input
                  value={contratoSeleccionado?.fecha_inicial ? new Date(contratoSeleccionado.fecha_inicial).toLocaleDateString() : ""}
                  className="h-8 text-xs"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Fecha Final</label>
                <Input
                  value={contratoSeleccionado?.fecha_final ? new Date(contratoSeleccionado.fecha_final).toLocaleDateString() : ""}
                  className="h-8 text-xs"
                  readOnly
                />
              </div>
            </div>

            {/* Segunda fila - selects y campos adicionales */}
            <div className="grid grid-cols-8 gap-3 mb-4">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-gray-700">Sede</label>
                <ReactSelect
                  options={opcionesSedes}
                  value={sedeSeleccionada}
                  onChange={setSedeSeleccionada}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    ...customSelectStyles,
                    control: (provided: any, state: any) => ({
                      ...provided,
                      minHeight: '32px',
                      height: '32px',
                      fontSize: '10px',
                      textAlign: 'left',
                      padding: '0 6px',
                    }),
                    valueContainer: (provided: any) => ({
                      ...provided,
                      padding: '0',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                    }),
                    input: (provided: any) => ({
                      ...provided,
                      margin: '0',
                      padding: '0',
                      fontSize: '10px',
                    }),
                    option: (provided: any, state: any) => ({
                      ...provided,
                      fontSize: '10px',
                      textAlign: 'left',
                      padding: '4px 8px',
                    }),
                    singleValue: (provided: any) => ({
                      ...provided,
                      textAlign: 'left',
                      margin: '0',
                      fontSize: '10px',
                    }),
                    indicatorsContainer: (provided: any) => ({
                      ...provided,
                      padding: '0 4px',
                    }),
                    dropdownIndicator: (provided: any) => ({
                      ...provided,
                      padding: '0',
                      svg: {
                        width: '12px',
                        height: '12px',
                      }
                    }),
                    clearIndicator: (provided: any) => ({
                      ...provided,
                      padding: '0',
                      svg: {
                        width: '12px',
                        height: '12px',
                      }
                    }),
                    indicatorSeparator: (provided: any) => ({
                      ...provided,
                      display: 'none',
                    })
                  }}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-gray-700">Zona</label>
                <ReactSelect
                  options={opcionesZonas}
                  value={zonaSeleccionada}
                  onChange={setZonaSeleccionada}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    ...customSelectStyles,
                    control: (provided: any, state: any) => ({
                      ...provided,
                      minHeight: '32px',
                      height: '32px',
                      fontSize: '10px',
                      textAlign: 'left',
                      padding: '0 6px',
                    }),
                    valueContainer: (provided: any) => ({
                      ...provided,
                      padding: '0',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                    }),
                    input: (provided: any) => ({
                      ...provided,
                      margin: '0',
                      padding: '0',
                      fontSize: '10px',
                    }),
                    option: (provided: any, state: any) => ({
                      ...provided,
                      fontSize: '10px',
                      textAlign: 'left',
                      padding: '4px 8px',
                    }),
                    singleValue: (provided: any) => ({
                      ...provided,
                      textAlign: 'left',
                      margin: '0',
                      fontSize: '10px',
                    }),
                    indicatorsContainer: (provided: any) => ({
                      ...provided,
                      padding: '0 4px',
                    }),
                    dropdownIndicator: (provided: any) => ({
                      ...provided,
                      padding: '0',
                      svg: {
                        width: '12px',
                        height: '12px',
                      }
                    }),
                    clearIndicator: (provided: any) => ({
                      ...provided,
                      padding: '0',
                      svg: {
                        width: '12px',
                        height: '12px',
                      }
                    }),
                    indicatorSeparator: (provided: any) => ({
                      ...provided,
                      display: 'none',
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">PPL</label>
                <Input
                  value={contratoSeleccionado?.n_ppl || ""}
                  className="h-8 text-xs bg-yellow-50 border-blue-300"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Servicio</label>
                <Input
                  value={contratoSeleccionado?.n_servicios || ""}
                  className="h-8 text-xs bg-yellow-50 border-blue-300"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Serv/Día</label>
                <Input
                  value={contratoSeleccionado?.servicios_dia || ""}
                  className="h-8 text-xs bg-yellow-50 border-blue-300"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Raciones</label>
                <Input
                  value={contratoSeleccionado?.raciones_dia || ""}
                  className="h-8 text-xs bg-yellow-50 border-blue-300"
                  readOnly
                />
              </div>
            </div>

            {/* Periodo a Analizar - Tipo Filtro */}
            <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros de Análisis
                </h4>
                {filtrosActivos.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={limpiarFiltros}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>

              {/* Filtros activos */}
              {filtrosActivos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filtrosActivos.map((filtro, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {filtro}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Fecha Inicial</label>
                  <DatePicker
                    selected={fechaInicialAnalisis}
                    onChange={(date) => setFechaInicialAnalisis(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-40 h-8 px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 border-blue-300 text-xs"
                    placeholderText="dd/mm/aaaa"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Fecha Final</label>
                  <DatePicker
                    selected={fechaFinalAnalisis}
                    onChange={(date) => setFechaFinalAnalisis(date)}
                    dateFormat="dd/MM/yyyy"
                    className="w-40 h-8 px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 border-blue-300 text-xs"
                    placeholderText="dd/mm/aaaa"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">N° Dias</label>
                  <Input
                    placeholder="Días"
                    className="w-20 h-8 text-xs"
                    type="number"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={aplicarFiltros}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white h-8 w-8 p-0 shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Buscar"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de Contratos */}
          <ContratosModal
            isOpen={showContratosModal}
            onClose={() => setShowContratosModal(false)}
            onSelectContrato={handleSelectContrato}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalisisCompraPage;