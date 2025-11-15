import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, Calendar, BarChart3, Edit, Trash2, Loader2, Filter, X, UtensilsCrossed, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLoading } from "@/contexts/LoadingContext";
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
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { startLoading, stopLoading } = useLoading();

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

  // Estados para el nuevo ciclo (en el tab)
  const [contratoSeleccionadoCiclo, setContratoSeleccionadoCiclo] = useState<any>(null);
  const [sedeSeleccionadaCiclo, setSedeSeleccionadaCiclo] = useState<any>(null);
  const [fechaInicialCiclo, setFechaInicialCiclo] = useState<Date | null>(null);
  const [fechaFinalCiclo, setFechaFinalCiclo] = useState<Date | null>(null);
  const [menusPorFecha, setMenusPorFecha] = useState<any[]>([]);
  const [diasCalculados, setDiasCalculados] = useState<number>(0);
  const [mesActual, setMesActual] = useState<Date>(new Date());
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [detalleCicloNutricional, setDetalleCicloNutricional] = useState<any>(null);
  const [showConfirmGuardarCiclo, setShowConfirmGuardarCiclo] = useState(false);
  
  // Estados para campos editables del formulario
  const [ppl, setPpl] = useState<number>(0);
  const [servicio, setServicio] = useState<number>(0);
  const [servicioDia, setServicioDia] = useState<number>(0);
  const [raciones, setRaciones] = useState<number>(0);
  
  // Estados para unidad de servicio y detalles del menú
  const [unidadServicioSeleccionada, setUnidadServicioSeleccionada] = useState<any>(null);
  const [productosDetalleZona, setProductosDetalleZona] = useState<any[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [showMenuDetailModal, setShowMenuDetailModal] = useState(false);
  const [fechaMenuSeleccionado, setFechaMenuSeleccionado] = useState<Date | null>(null);
  const [mostrarCostos, setMostrarCostos] = useState(false);
  const [menuNumeroSeleccionado, setMenuNumeroSeleccionado] = useState<number | null>(null);

  // Función para asignar colores diferentes a cada estado
  const getEstadoColor = (estado: string) => {
    const colors = {
      ENPROCESO: "bg-yellow-50 text-yellow-700 border-yellow-200",
      CERRADO: "bg-green-50 text-green-700 border-green-200",
    };
    return colors[estado as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Función para formatear fecha a YYYY-MM-DD sin conversión UTC
  const formatearFechaLocal = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Función para parsear fecha en formato YYYY-MM-DD a Date en hora local (sin conversión UTC)
  const parsearFechaLocal = (fechaString: string): Date => {
    const [año, mes, dia] = fechaString.split('-').map(Number);
    return new Date(año, mes - 1, dia); // mes - 1 porque Date usa índice 0 para enero
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

  // Query para obtener zonas relacionadas al contrato del nuevo ciclo
  const { data: zonasCicloData = [] } = useQuery({
    queryKey: ["zonas-ciclo", contratoSeleccionadoCiclo?.id],
    queryFn: async () => {
      if (!contratoSeleccionadoCiclo?.id) return [];

      // Primero obtener las zonas del contrato
      const { data: zonasData, error: zonasError } = await supabase
        .from('prod_zonas_by_contrato')
        .select(`
          id_zona,
          prod_zonas_contrato!id_zona (
            id,
            nombre,
            codigo
          )
        `)
        .eq('id_contrato', contratoSeleccionadoCiclo.id);

      if (zonasError) throw zonasError;

      // Para cada zona, obtener el PPL total desde prod_zonas_detalle_contratos
      const zonasConPpl = await Promise.all(
        (zonasData || []).map(async (item: any) => {
          const zona = item.prod_zonas_contrato;
          if (!zona) return null;

          // Consultar el detalle de la zona para obtener el PPL total de sus unidades
          const { data: detalleData, error: detalleError } = await supabase
            .from('prod_zonas_detalle_contratos')
            .select('no_ppl')
            .eq('id_zona', zona.id);

          if (detalleError) {
            console.error('Error al obtener detalle de zona:', detalleError);
            return {
              id: zona.id,
              nombre: zona.nombre,
              codigo: zona.codigo,
              ppl_total: 0
            };
          }

          // Sumar el PPL de todas las unidades de la zona
          const pplTotal = (detalleData || [])
            .reduce((sum: number, detalle: any) => sum + (Number(detalle.no_ppl) || 0), 0);

          return {
            id: zona.id,
            nombre: zona.nombre,
            codigo: zona.codigo,
            ppl_total: pplTotal
          };
        })
      );

      // Filtrar valores nulos y retornar
      return zonasConPpl.filter(Boolean);
    },
    enabled: !!contratoSeleccionadoCiclo?.id,
  });

  // Query para obtener unidades de servicio relacionadas a una zona
  const { data: unidadesServicioData = [] } = useQuery({
    queryKey: ["unidades-servicio", zonaSeleccionada?.value, contratoSeleccionadoCiclo?.id],
    queryFn: async () => {
      if (!zonaSeleccionada?.value || !contratoSeleccionadoCiclo?.id) return [];

      try {
        // Paso 1: Obtener los IDs únicos de unidades de servicio desde prod_zonas_detalle_contratos
        const { data: detalleData, error: detalleError } = await supabase
          .from('prod_zonas_detalle_contratos')
          .select('id_unidad_servicio')
          .eq('id_zona', zonaSeleccionada.value)
          .not('id_unidad_servicio', 'is', null);

        if (detalleError) {
          console.error('Error al obtener IDs de unidades de servicio:', detalleError);
          return [];
        }

        // Extraer IDs únicos
        const idsUnicos = [...new Set((detalleData || []).map((item: any) => item.id_unidad_servicio).filter(Boolean))];
        
        if (idsUnicos.length === 0) {
          return [];
        }

        // Paso 2: Consultar directamente la tabla prod_unidad_servicios con los IDs obtenidos
        const { data: unidadesData, error: unidadesError } = await supabase
          .from('prod_unidad_servicios')
          .select('id, nombre_servicio, codigo')
          .in('id', idsUnicos);

        if (unidadesError) {
          console.error('Error al obtener unidades de servicio:', unidadesError);
          return [];
        }

        return (unidadesData || []).map((unidad: any) => ({
          id: unidad.id,
          nombre: unidad.nombre_servicio,
          codigo: unidad.codigo
        }));
      } catch (error) {
        console.error('Error al obtener unidades de servicio:', error);
        return [];
      }
    },
    enabled: !!zonaSeleccionada?.value && !!contratoSeleccionadoCiclo?.id,
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

  const opcionesZonasCiclo = zonasCicloData.map((zona: any) => ({
    value: zona.id,
    label: `${zona.nombre} (PPL: ${zona.ppl_total})`,
    ppl_total: zona.ppl_total
  }));

  const opcionesUnidadesServicio = unidadesServicioData.map((unidad: any) => ({
    value: unidad.id,
    label: unidad.nombre || unidad.codigo?.toString() || `Unidad ${unidad.id}`
  }));

  // Función para manejar la selección de contrato
  const handleSelectContrato = (contrato: any) => {
    // Si estamos en el tab de registro (nuevo ciclo), usar esa función
    if (activeTab === "registro") {
      handleSelectContratoCiclo(contrato);
      setShowContratosModal(false);
      return;
    }

    // Lógica original para el formulario principal
    setContratoSeleccionado(contrato);
    setFechaInicial(parsearFechaLocal(contrato.fecha_inicial));
    setFechaFinal(parsearFechaLocal(contrato.fecha_final));

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

  // Función para manejar la selección de contrato en el nuevo ciclo
  const handleSelectContratoCiclo = async (contrato: any) => {
    setContratoSeleccionadoCiclo(contrato);
    
    // Limpiar la zona seleccionada para que el usuario elija una nueva
    setZonaSeleccionada(null);
    
    // Inicializar los campos editables con los valores del contrato (excepto PPL)
    const servicioValue = Number(contrato?.n_servicios) || 0;
    const servicioDiaValue = Number(contrato?.servicios_dia) || 0;
    
    // NO inicializar PPL y Raciones aquí - se actualizarán cuando se seleccione la zona
    setPpl(0);
    setServicio(servicioValue);
    setServicioDia(servicioDiaValue);
    setRaciones(0);

    // Ejecutar automáticamente el procedimiento al seleccionar el contrato
    if (contrato?.id) {
      await ejecutarProcedimientoMenus(contrato.id);
    }
  };
  
  // Función para sincronizar PPL y Raciones
  const handlePplChange = (value: number) => {
    setPpl(value);
    setRaciones(value); // Sincronizar con raciones
  };
  
  const handleRacionesChange = (value: number) => {
    setRaciones(value);
    setPpl(value); // Sincronizar con PPL
  };

  // Función para ejecutar el procedimiento almacenado (inicial - al seleccionar contrato)
  const ejecutarProcedimientoMenus = async (contratoId?: number) => {
    const idContrato = contratoId || contratoSeleccionadoCiclo?.id;
    if (!idContrato) return;

    startLoading();
    try {
      // Ejecutar el procedimiento principal que retorna fechas y ciclos
      const { data: menusData, error: menusError } = await supabase.rpc('sp_calcular_menus_semana', {
        p_idcontrato: idContrato
      });

      if (menusError) throw menusError;

      // Ejecutar la función auxiliar que retorna las fechas de inicio y fin
      const { data: fechasData, error: fechasError } = await supabase.rpc('sp_calcular_menus_semana_fechas', {
        p_idcontrato: idContrato
      });

      if (fechasError) throw fechasError;

      // Ejecutar procedimiento de detalle del ciclo nutricional
      await ejecutarProcedimientoDetalleCiclo(idContrato);

      // Almacenar los menús por fecha en memoria, ordenados por fecha y luego por número de menú ascendente
      if (menusData && menusData.length > 0) {
        const menusOrdenados = [...menusData].sort((a, b) => {
          // Primero ordenar por fecha
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          if (fechaA !== fechaB) {
            return fechaA - fechaB;
          }
          // Si es la misma fecha, ordenar por número de menú (ciclos) ascendente
          const numMenuA = a.ciclos || 0;
          const numMenuB = b.ciclos || 0;
          return numMenuA - numMenuB;
        });
        setMenusPorFecha(menusOrdenados);
      }

      // Establecer las fechas en los filtros
      if (fechasData && fechasData.length > 0) {
        const fechas = fechasData[0];
        if (fechas.inicio && fechas.fin) {
          const fechaInicio = parsearFechaLocal(fechas.inicio);
          const fechaFin = parsearFechaLocal(fechas.fin);
          setFechaInicialCiclo(fechaInicio);
          setFechaFinalCiclo(fechaFin);
          
          // Calcular días
          const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          setDiasCalculados(diffDays);
        }
      }
    } catch (error) {
      console.error('Error al ejecutar el procedimiento:', error);
      toast.error('Error al calcular los menús', {
        description: 'Por favor, verifica que el contrato tenga datos válidos.'
      });
    } finally {
      stopLoading();
    }
  };

  // Función para ejecutar el procedimiento con fechas personalizadas
  const ejecutarProcedimientoMenusFechas = async (contratoId: number, fechaInicio: Date, fechaFin: Date) => {
    if (!contratoId || !fechaInicio || !fechaFin) return;

    setLoadingCalendario(true);
    try {
      // Formatear fechas para el procedimiento (YYYY-MM-DD)
      const formatoFecha = (fecha: Date) => {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      };

      const fechaInicioStr = formatoFecha(fechaInicio);
      const fechaFinStr = formatoFecha(fechaFin);

      // Ejecutar el procedimiento Sp_calcular_menus_fechas
      const { data: menusData, error: menusError } = await supabase.rpc('sp_calcular_menus_fechas', {
        p_idcontrato: contratoId,
        p_fechainicio: fechaInicioStr,
        p_fechafin: fechaFinStr
      });

      if (menusError) throw menusError;

      // Ejecutar procedimiento de detalle del ciclo nutricional para obtener los detalles completos
      await ejecutarProcedimientoDetalleCiclo(contratoId);

      // Almacenar los menús por fecha en memoria, ordenados por fecha y luego por número de menú ascendente
      if (menusData && menusData.length > 0) {
        const menusOrdenados = [...menusData].sort((a, b) => {
          // Primero ordenar por fecha
          const fechaA = new Date(a.fecha).getTime();
          const fechaB = new Date(b.fecha).getTime();
          if (fechaA !== fechaB) {
            return fechaA - fechaB;
          }
          // Si es la misma fecha, ordenar por número de menú (ciclos) ascendente
          const numMenuA = a.ciclos || 0;
          const numMenuB = b.ciclos || 0;
          return numMenuA - numMenuB;
        });
        setMenusPorFecha(menusOrdenados);
        // Establecer el mes actual al primer mes de los resultados
        if (menusOrdenados[0].fecha) {
          setMesActual(parsearFechaLocal(menusOrdenados[0].fecha));
        }
      }
    } catch (error: any) {
      console.error('Error al ejecutar el procedimiento con fechas:', error);
      toast.error('Error al calcular los menús', {
        description: error?.message || 'Error al calcular los menús con las fechas especificadas.'
      });
    } finally {
      setLoadingCalendario(false);
    }
  };

  // Función para ejecutar el procedimiento de detalle del ciclo nutricional
  const ejecutarProcedimientoDetalleCiclo = async (contratoId: number) => {
    if (!contratoId) return;

    try {
      const { data: detalleData, error: detalleError } = await supabase.rpc('sp_get_detalle_ciclo_nutricional', {
        p_id: contratoId
      });

      if (detalleError) throw detalleError;

      if (detalleData && detalleData.length > 0) {
        setDetalleCicloNutricional(detalleData[0]);
        console.log('Detalle del ciclo nutricional:', detalleData[0]);
      }
    } catch (error: any) {
      console.error('Error al obtener detalle del ciclo nutricional:', error);
      toast.error('Error al obtener detalle del contrato', {
        description: error?.message || 'Error al cargar la información detallada del contrato.'
      });
    }
  };

  // Función para obtener productos detalle zona
  const obtenerProductosDetalleZona = async (idUnidadServicio: number, idContrato: number, numMenu?: number) => {
    if (!idUnidadServicio || !idContrato) return;

    setLoadingProductos(true);
    try {
      const { data, error } = await supabase.rpc('get_productos_detalle_zona', {
        p_id_unidad_servicio: idUnidadServicio,
        p_id_contrato: idContrato,
        p_tipo_menu: numMenu || null
      });

      if (error) throw error;

      if (data) {
        setProductosDetalleZona(data);
        console.log('Productos detalle zona:', data);
      }
    } catch (error: any) {
      console.error('Error al obtener productos detalle zona:', error);
      toast.error('Error al obtener productos', {
        description: error?.message || 'Error al cargar los productos de la zona.'
      });
    } finally {
      setLoadingProductos(false);
    }
  };

  // Función para manejar el clic en "Calcular Análisis"
  const handleCalcularAnalisis = () => {
    if (fechaInicialCiclo && fechaFinalCiclo && contratoSeleccionadoCiclo?.id) {
      ejecutarProcedimientoMenusFechas(contratoSeleccionadoCiclo.id, fechaInicialCiclo, fechaFinalCiclo);
    }
  };

  // useEffect para calcular fecha final cuando cambien fecha inicial o días
  useEffect(() => {
    if (fechaInicialCiclo && diasCalculados > 0) {
      // Calcular fecha final sumando los días a la fecha inicial
      const fechaFinal = new Date(fechaInicialCiclo);
      fechaFinal.setDate(fechaFinal.getDate() + diasCalculados);
      setFechaFinalCiclo(fechaFinal);
    }
  }, [fechaInicialCiclo, diasCalculados]);

  // Funciones para navegar el calendario
  const irMesAnterior = () => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() - 1);
    setMesActual(nuevoMes);
  };

  const irMesSiguiente = () => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + 1);
    setMesActual(nuevoMes);
  };

  // Función para generar todos los días del mes
  const generarDiasDelMes = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    
    const dias = [];
    for (let i = 1; i <= diasEnMes; i++) {
      const fechaActual = new Date(año, mes, i);
      dias.push(fechaActual);
    }
    return dias;
  };

  // Función para obtener el menú de una fecha específica (ordenado por número de menú ascendente)
  const obtenerMenuPorFecha = (fecha: Date) => {
    const fechaString = formatearFechaLocal(fecha);
    const menusDelDia = menusPorFecha.filter(menu => menu.fecha === fechaString);
    if (menusDelDia.length === 0) return null;
    
    // Ordenar por número de menú (ciclos) ascendente y retornar el primero
    const menusOrdenados = menusDelDia.sort((a, b) => {
      const numMenuA = a.ciclos || 0;
      const numMenuB = b.ciclos || 0;
      return numMenuA - numMenuB;
    });
    
    return menusOrdenados[0]; // Retornar el menú con el número más bajo
  };
  
  // Función para obtener todos los menús de una fecha (ordenados por número ascendente)
  const obtenerTodosMenusPorFecha = (fecha: Date) => {
    const fechaString = formatearFechaLocal(fecha);
    const menusDelDia = menusPorFecha.filter(menu => menu.fecha === fechaString);
    
    // Ordenar por número de menú (ciclos) ascendente
    return menusDelDia.sort((a, b) => {
      const numMenuA = a.ciclos || 0;
      const numMenuB = b.ciclos || 0;
      return numMenuA - numMenuB;
    });
  };

  // Función para obtener menús filtrados por número de menú desde detalleCicloNutricional
  // Busca el menú en menusPorFecha que coincida con la fecha y ciclos, luego filtra por num_menu
  const obtenerMenusFiltrados = (fecha: Date, ciclos?: number) => {
    if (!detalleCicloNutricional || !detalleCicloNutricional.detalle_ciclo_nutricional) {
      console.log('obtenerMenusFiltrados: No hay detalleCicloNutricional', {
        tieneDetalle: !!detalleCicloNutricional,
        tieneDetalleCiclo: !!(detalleCicloNutricional?.detalle_ciclo_nutricional)
      });
      return [];
    }

    const menus = detalleCicloNutricional.detalle_ciclo_nutricional || [];
    const fechaString = formatearFechaLocal(fecha);
    
    console.log('obtenerMenusFiltrados: Buscando menús', {
      fecha: fechaString,
      ciclos,
      totalMenus: menus.length
    });

    // Buscar en menusPorFecha el menú que coincida con la fecha y ciclos
    const menuDelCalendario = menusPorFecha.find((m: any) => {
      const menuFecha = m.fecha ? formatearFechaLocal(parsearFechaLocal(m.fecha)) : null;
      return menuFecha === fechaString && m.ciclos === ciclos;
    });

    console.log('obtenerMenusFiltrados: Menú del calendario encontrado', menuDelCalendario);
    console.log('obtenerMenusFiltrados: Campos del menú del calendario', menuDelCalendario ? Object.keys(menuDelCalendario) : 'No encontrado');
    
    // Ver algunos ejemplos de menús en detalleCicloNutricional para entender su estructura
    if (menus.length > 0) {
      console.log('obtenerMenusFiltrados: Ejemplo de menú en detalleCicloNutricional', {
        campos: Object.keys(menus[0]),
        ejemplo: menus[0]
      });
    }

    // Si encontramos el menú en menusPorFecha, intentar usar su num_menu si existe
    // Si no, intentar filtrar por zona o usar todos los menús de esa fecha
    let menusFiltrados = menus;

    if (menuDelCalendario) {
      // Intentar filtrar por num_menu si existe en el menú del calendario
      if (menuDelCalendario.num_menu !== undefined && menuDelCalendario.num_menu !== null) {
        const numMenuBuscado = menuDelCalendario.num_menu;
        menusFiltrados = menus.filter((menu: any) => {
          const menuNum = menu.num_menu?.toString() || String(menu.num_menu || '');
          const numMenuStr = numMenuBuscado.toString();
          return menuNum === numMenuStr;
        });
        console.log('obtenerMenusFiltrados: Filtrado por num_menu del calendario', {
          numMenuBuscado,
          encontrados: menusFiltrados.length
        });
      }
      // Si no tiene num_menu, intentar filtrar por id_zona si existe
      else if (menuDelCalendario.id_zona !== undefined && menuDelCalendario.id_zona !== null) {
        menusFiltrados = menus.filter((menu: any) => menu.id_zona === menuDelCalendario.id_zona);
        console.log('obtenerMenusFiltrados: Filtrado por id_zona', {
          id_zona: menuDelCalendario.id_zona,
          encontrados: menusFiltrados.length
        });
      }
      // Si tiene id_unidad_servicio, intentar filtrar por ese
      else if (menuDelCalendario.id_unidad_servicio !== undefined && menuDelCalendario.id_unidad_servicio !== null) {
        menusFiltrados = menus.filter((menu: any) => menu.id_unidad_servicio === menuDelCalendario.id_unidad_servicio);
        console.log('obtenerMenusFiltrados: Filtrado por id_unidad_servicio', {
          id_unidad_servicio: menuDelCalendario.id_unidad_servicio,
          encontrados: menusFiltrados.length
        });
      }
      // Si el num_menu en detalleCicloNutricional corresponde al ciclos del calendario
      // (aunque no coincidan directamente, podrían estar relacionados)
      else {
        // Intentar filtrar por num_menu que coincida con ciclos
        menusFiltrados = menus.filter((menu: any) => {
          const menuNum = Number(menu.num_menu) || 0;
          return menuNum === ciclos;
        });
        console.log('obtenerMenusFiltrados: Intentando filtrar por num_menu === ciclos', {
          ciclos,
          encontrados: menusFiltrados.length
        });
        
        // Si aún no hay resultados, mostrar todos los menús
        if (menusFiltrados.length === 0) {
          console.log('obtenerMenusFiltrados: No se pudo filtrar, mostrando todos los menús');
        }
      }
    } else {
      // Si no se encontró el menú en menusPorFecha, mostrar todos los menús
      console.log('obtenerMenusFiltrados: No se encontró menú en menusPorFecha, mostrando todos los menús');
    }

    return menusFiltrados;
  };

  // Función para obtener el número de recetas por clase de servicio para una fecha
  const obtenerRecetasPorClaseServicio = (fecha: Date) => {
    const todosMenusDelDia = obtenerTodosMenusPorFecha(fecha);
    
    // Intentar usar detalleCicloNutricional primero
    if (detalleCicloNutricional && detalleCicloNutricional.detalle_ciclo_nutricional) {
      const menusDelDia = obtenerMenusFiltrados(fecha);
      
      if (menusDelDia.length > 0) {
        const recetasPorServicio: Record<string, number> = {};
        menusDelDia.forEach((menu: any) => {
          const servicio = menu.nombre_servicio || 'Otros';
          recetasPorServicio[servicio] = (recetasPorServicio[servicio] || 0) + 1;
        });
        return recetasPorServicio;
      }
    }
    
    // Si hay productosDetalleZona y tienen información de servicio, intentar agrupar por servicio
    if (productosDetalleZona && productosDetalleZona.length > 0) {
      const fechaString = formatearFechaLocal(fecha);
      
      // Intentar filtrar productosDetalleZona por fecha si tienen campo fecha
      const menusDelDia = productosDetalleZona.filter((menu: any) => {
        // Si el menú tiene fecha, filtrar por fecha
        if (menu.fecha) {
          return menu.fecha === fechaString;
        }
        // Si no tiene fecha, verificar si hay algún campo que relacione con la fecha
        // Por ahora, si no hay fecha en el menú, no lo incluimos para evitar mostrar datos incorrectos
        return false;
      });

      // Si encontramos menús filtrados por fecha, agrupar por nombre_servicio
      if (menusDelDia.length > 0) {
        const recetasPorServicio: Record<string, number> = {};
        menusDelDia.forEach((menu: any) => {
          const servicio = menu.nombre_servicio || 'Otros';
          recetasPorServicio[servicio] = (recetasPorServicio[servicio] || 0) + 1;
        });

        return recetasPorServicio;
      }
    }
    
    // Si no hay productosDetalleZona o no se pueden filtrar por fecha, 
    // retornar el número total de menús (recetas) del día
    // Cada menú en menusPorFecha representa una receta
    return { 'Total': todosMenusDelDia.length };
  };

  // Función para abrir el nuevo ciclo (cambiar al tab)
  const abrirNuevoCiclo = () => {
    setActiveTab("registro");
    // Limpiar estados anteriores
    setContratoSeleccionadoCiclo(null);
    setSedeSeleccionadaCiclo(null);
    setZonaSeleccionada(null);
    setUnidadServicioSeleccionada(null);
    setProductosDetalleZona([]);
    setFechaInicialCiclo(null);
    setFechaFinalCiclo(null);
    setMenusPorFecha([]);
    setDiasCalculados(0);
    setPpl(0);
    setServicio(0);
    setServicioDia(0);
    setRaciones(0);
    setShowMenuDetailModal(false);
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

  // Función para actualizar datos
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['planeaciones-contratos'] });
      await queryClient.refetchQueries({ queryKey: ['planeaciones-contratos'] });
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.error('Error al Actualizar', {
        description: 'No se pudieron actualizar los datos. Intente nuevamente.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-teal-800 flex items-center gap-2">
                  <UtensilsCrossed className="w-6 h-6 text-teal-600" />
                  Gestión de Análisis de Compra
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                  <Button
                    onClick={abrirNuevoCiclo}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Nuevo Ciclo
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Sección de Filtros */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por item, RQP, contrato, entidad..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
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
            </div>

            <CardContent className="p-6">
              <div className="rounded-md border">
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
                    {(isLoading || isRefreshing) ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2 text-teal-600" />
                            <span className="text-gray-600">
                              {isRefreshing ? 'Actualizando ciclos de compra...' : 'Cargando ciclos de compra...'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : ciclosFiltrados.length === 0 ? (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          {/* Formulario compacto de Datos del Contrato */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-cyan-800 flex items-center gap-2 mb-2">
                    <Calendar className="w-6 h-6 text-cyan-600" />
                    Nuevo Ciclo - Análisis de Menús
                  </h3>
                  <p className="text-sm text-gray-600 -mt-2 text-left">
                    Selecciona un contrato y una sede para calcular los menús de la semana
                  </p>
                </div>
                
               
              </div>
<hr style={{marginTop: '5px'}}/>
            {/* Primera fila - 8 campos readonly */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="space-y-1 col-span-3">
                <label className="text-xs font-medium text-gray-700">Contrato - Cliente</label>
                <div className="relative">
                  <Input
                    value={contratoSeleccionadoCiclo ? `${contratoSeleccionadoCiclo.numero_contrato} - ${contratoSeleccionadoCiclo.cliente}` : ""}
                    onFocus={() => setShowContratosModal(true)}
                    className="bg-yellow-50 border-blue-300 cursor-pointer h-8 text-xs"
                    readOnly
                    placeholder="Haz clic para seleccionar contrato"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-gray-700">Objeto</label>
                <Input
                  value={contratoSeleccionadoCiclo?.objeto || ""}
                  className="h-8 text-xs bg-gray-100"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nit Cliente</label>
                <Input
                  value={contratoSeleccionadoCiclo?.nit_cliente || ""}
                  className="h-8 text-xs bg-gray-100"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Fecha Inicial</label>
                <Input
                  value={contratoSeleccionadoCiclo?.fecha_inicial ? new Date(contratoSeleccionadoCiclo.fecha_inicial).toLocaleDateString() : ""}
                  className="h-8 text-xs bg-gray-100"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Fecha Final</label>
                <Input
                  value={contratoSeleccionadoCiclo?.fecha_final ? new Date(contratoSeleccionadoCiclo.fecha_final).toLocaleDateString() : ""}
                  className="h-8 text-xs bg-gray-100"
                  readOnly
                />
              </div>
            </div>

            {/* Segunda fila - selects y campos adicionales */}
            <div className="grid grid-cols-10 gap-2 mb-2">
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-gray-700">Sede</label>
                <ReactSelect
                  options={opcionesSedes}
                  value={sedeSeleccionadaCiclo}
                  onChange={setSedeSeleccionadaCiclo}
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
                  options={opcionesZonasCiclo}
                  value={zonaSeleccionada}
                  onChange={(zona: any) => {
                    setZonaSeleccionada(zona);
                    setUnidadServicioSeleccionada(null); // Limpiar unidad al cambiar zona
                    // Actualizar el campo PPL con el ppl_total de la zona seleccionada
                    if (zona && zona.ppl_total !== undefined) {
                      setPpl(zona.ppl_total);
                      setRaciones(zona.ppl_total);
                    }
                  }}
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
                <label className="text-xs font-medium text-gray-700">Unidad de Servicio</label>
                <ReactSelect
                  options={opcionesUnidadesServicio}
                  value={unidadServicioSeleccionada}
                  onChange={(unidad: any) => {
                    setUnidadServicioSeleccionada(unidad);
                    // Ejecutar el RPC cuando se seleccione una unidad
                    if (unidad && contratoSeleccionadoCiclo?.id) {
                      obtenerProductosDetalleZona(unidad.value, contratoSeleccionadoCiclo.id);
                    }
                  }}
                  isDisabled={!zonaSeleccionada || opcionesUnidadesServicio.length === 0}
                  placeholder={!zonaSeleccionada ? "Selecciona una zona primero" : "Selecciona unidad de servicio"}
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
                      backgroundColor: state.isDisabled ? '#f3f4f6' : '#fefce8',
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
                <label className="text-xs font-medium text-gray-700">N° PPL</label>
                <Input
                  type="number"
                  value={ppl}
                  onChange={(e) => handlePplChange(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">N° Servicios</label>
                <Input
                  type="number"
                  value={servicio}
                  onChange={(e) => setServicio(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Servicios/Dia</label>
                <Input
                  type="number"
                  value={servicioDia}
                  onChange={(e) => setServicioDia(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Raciones/Dia</label>
                <Input
                  type="number"
                  value={raciones}
                  onChange={(e) => handleRacionesChange(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="h-8 text-xs"
                />
              </div>
            </div>



            {/* Calendario con menús asignados */}
            <div className="border-t pt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg mt-4 shadow-sm">
                {/* Header con título del calendario, título del mes y filtros */}
                <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Lado izquierdo: Título "Calendario de Menús Asignados" alineado a la izquierda */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold text-gray-800">
                          Calendario de Menús Asignados
                        </h4>
                        <p className="text-sm text-gray-600 -mt-1">
                          Visualiza todos los menús programados para el período seleccionado
                        </p>
                      </div>
                    </div>

                    {/* Lado derecho: Filtros (Fecha Inicial, Días, Fecha Final, Botón Calcular) */}
                    <div className="flex items-end gap-2 flex-shrink-0">
                      <div className="space-y-1 w-32">
                        <label className="text-xs font-medium text-gray-700">Fecha Inicial</label>
                        <div className="relative">
                          <DatePicker
                            selected={fechaInicialCiclo}
                            onChange={(date) => setFechaInicialCiclo(date)}
                            minDate={new Date()}
                            dateFormat="dd/MM/yyyy"
                            className="w-full h-8 px-2 py-1 border border-gray-300 rounded-md bg-white text-xs"
                            showIcon
                            icon={<Calendar className="w-3 h-3" />}
                            disabled={!contratoSeleccionadoCiclo}
                            popperClassName="react-datepicker-popper z-[9999]"
                            wrapperClassName="w-full"
                          />
                          <style>{`
                            .react-datepicker-popper {
                              z-index: 9999 !important;
                            }
                            .react-datepicker__portal {
                              z-index: 9999 !important;
                            }
                          `}</style>
                        </div>
                      </div>
                      <div className="space-y-1 w-16">
                        <label className="text-xs font-medium text-gray-700">Días</label>
                        <Input
                          value={diasCalculados}
                          onChange={(e) => setDiasCalculados(parseInt(e.target.value) || 0)}
                          onFocus={(e) => e.target.select()}
                          className="w-full h-8 text-xs"
                          type="number"
                          disabled={!contratoSeleccionadoCiclo}
                        />
                      </div>
                      <div className="space-y-1 w-32">
                        <label className="text-xs font-medium text-gray-700">Fecha Final</label>
                        <Input
                          value={fechaFinalCiclo ? new Date(fechaFinalCiclo).toLocaleDateString() : ""}
                          className="h-8 text-xs bg-gray-100"
                          readOnly
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 opacity-0">Ejecutar</label>
                        <Button
                          onClick={handleCalcularAnalisis}
                          disabled={!contratoSeleccionadoCiclo || !fechaInicialCiclo || !fechaFinalCiclo || loadingCalendario}
                          className="h-8 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 flex items-center gap-2"
                        >
                          {loadingCalendario ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          <span className="text-xs font-medium">Calcular Análisis</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">

                  {/* Loading del calendario */}
                  {loadingCalendario ? (
                    <div className="bg-white border rounded-lg p-12 flex flex-col items-center justify-center">
                      <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mb-4" />
                      <p className="text-lg font-medium text-gray-700">Calculando menús...</p>
                      <p className="text-sm text-gray-500 mt-2">Por favor espera un momento</p>
                    </div>
                  ) : (
                    /* Dos calendarios lado a lado */
                    <div className="grid grid-cols-2 gap-4">
                      {/* Calendario del mes actual */}
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="bg-cyan-50 p-2 border-b">
                          <h4 className="text-sm font-bold text-gray-800 text-center capitalize">
                            {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                          </h4>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {/* Encabezados de días */}
                          {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(day => (
                            <div key={day} className="bg-cyan-50 p-0.5 text-center font-semibold text-gray-700 text-[9px] border-b">
                              {day.toUpperCase()}
                            </div>
                          ))}

                          {/* Generar espacios vacíos para alinear el primer día */}
                          {(() => {
                            const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
                            const diaSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.
                            // Ajustar para que lunes sea 0 (restar 1 y manejar domingo)
                            const diaSemanaAjustado = diaSemana === 0 ? 6 : diaSemana - 1;
                            const espaciosVacios = [];
                            for (let i = 0; i < diaSemanaAjustado; i++) {
                              espaciosVacios.push(
                                <div key={`empty-${i}`} className="p-0.5 border-r border-b min-h-[65px] bg-gray-50"></div>
                              );
                            }
                            return espaciosVacios;
                          })()}

                          {/* Días del mes actual */}
                          {generarDiasDelMes(mesActual).map((fecha, index) => {
                      const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
                      const menuDelDia = obtenerMenuPorFecha(fecha);
                      
                      // Verificar si es el día actual
                      const hoy = new Date();
                      const esDiaActual = fecha.getDate() === hoy.getDate() && 
                                          fecha.getMonth() === hoy.getMonth() && 
                                          fecha.getFullYear() === hoy.getFullYear();
                      
                      // Determinar el estilo de fondo según las condiciones
                      let bgClass = 'bg-white';
                      let bgHoverClass = 'hover:bg-gray-50';
                      let borderClass = '';
                      let diaNumClass = 'text-gray-500';
                      
                      if (esDiaActual) {
                        // Día actual - Resaltado más prominente
                        bgClass = 'bg-teal-100 border-teal-400 border-2';
                        bgHoverClass = 'hover:bg-teal-200';
                        borderClass = 'border-teal-400 border-2';
                        diaNumClass = 'text-teal-800 font-bold';
                      } else if (menuDelDia) {
                        // Día con menú - Fondo diferenciado y clickeable
                        bgClass = 'bg-blue-50/30';
                        bgHoverClass = 'hover:shadow-md hover:bg-blue-50/50 cursor-pointer';
                        diaNumClass = 'text-gray-400';
                      } else if (esFinDeSemana) {
                        // Fin de semana sin datos
                        bgClass = 'bg-red-50';
                        bgHoverClass = 'hover:bg-red-100';
                        diaNumClass = 'text-red-600';
                      }

                      return (
                        <div
                          key={index}
                          className={`border-r border-b min-h-[65px] flex flex-col transition-all duration-200 ${bgClass} ${borderClass} overflow-hidden relative ${menuDelDia ? 'cursor-pointer hover:shadow-md' : ''} ${bgHoverClass}`}
                          onClick={() => {
                            if (menuDelDia && menuDelDia.ciclos !== undefined && menuDelDia.ciclos !== null) {
                              console.log('Click en menú del calendario:', {
                                fecha: formatearFechaLocal(fecha),
                                numMenu: menuDelDia.ciclos,
                                menuDelDia,
                                tieneDetalleCiclo: !!detalleCicloNutricional,
                                tieneDetalleCicloArray: !!(detalleCicloNutricional?.detalle_ciclo_nutricional),
                                tieneProductosDetalleZona: !!(productosDetalleZona && productosDetalleZona.length > 0)
                              });
                              
                              // Usar detalleCicloNutricional si está disponible, sino usar productosDetalleZona
                              const menusFiltrados = obtenerMenusFiltrados(fecha, menuDelDia.ciclos);
                              const tieneDatos = (detalleCicloNutricional && detalleCicloNutricional.detalle_ciclo_nutricional && menusFiltrados.length > 0) || 
                                                 (productosDetalleZona && productosDetalleZona.length > 0);
                              
                              console.log('Resultado de validación:', {
                                menusFiltrados: menusFiltrados.length,
                                tieneDatos,
                                detalleCicloNutricional: !!detalleCicloNutricional,
                                detalleCicloArray: !!(detalleCicloNutricional?.detalle_ciclo_nutricional)
                              });
                              
                              if (tieneDatos) {
                                setFechaMenuSeleccionado(fecha);
                                setMenuNumeroSeleccionado(menuDelDia.ciclos);
                                setMostrarCostos(false); // Resetear el estado de costos
                                setShowMenuDetailModal(true);
                              } else {
                                toast.error('Menús no encontrados', {
                                  description: 'No se encontraron detalles para los menús. Asegúrate de haber seleccionado un contrato y calculado el ciclo.'
                                });
                              }
                            } else if (menuDelDia) {
                              console.warn('Click en menú sin ciclos definido:', { menuDelDia, fecha: formatearFechaLocal(fecha) });
                              toast.error('Error', {
                                description: 'El menú seleccionado no tiene un número de ciclo válido.'
                              });
                            }
                          }}
                        >
                          {menuDelDia ? (
                            <>
                              {/* Sección superior con fondo azul claro pálido - mitad de la altura */}
                              <div 
                                className="px-1.5 py-1.5 flex flex-col relative" 
                                style={{ 
                                  height: '50%',
                                  backgroundColor: '#f0f9ff' // sky-50 más pálido
                                }}
                              >
                                {/* Número del día en la esquina superior derecha */}
                                <div className="text-[11px] font-normal text-gray-400 absolute top-1 right-1.5">
                                  {fecha.getDate()}
                                </div>
                                {/* Botón MENU alineado a la izquierda, más corto y con color más pálido */}
                                <div className="mt-0.5 flex justify-start">
                                  <div className="bg-blue-400 text-white px-1.5 py-0.5 rounded text-[9px] font-bold text-center shadow-sm">
                                    MENU #{menuDelDia.ciclos}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Sección inferior con fondo blanco - mitad de la altura */}
                              <div 
                                className="bg-white px-1.5 py-1.5 flex flex-col items-start justify-center gap-0.5" 
                                style={{ height: '50%' }}
                              >
                                {(() => {
                                  const recetasPorServicio = obtenerRecetasPorClaseServicio(fecha);
                                  const ordenServicios = ['Desayuno', 'Almuerzo', 'Cena', 'Refrigerio'];
                                  const serviciosConRecetas = ordenServicios.filter(servicio => recetasPorServicio[servicio] > 0);
                                  
                                  if (serviciosConRecetas.length === 0 && recetasPorServicio['Total']) {
                                    return (
                                      <span className="text-[8px] leading-tight text-left">
                                        <span className="text-blue-600 font-semibold">{recetasPorServicio['Total']}</span>
                                        <span className="text-gray-700 ml-0.5">recetas</span>
                                      </span>
                                    );
                                  }
                                  
                                  return serviciosConRecetas.map((servicio) => (
                                    <span key={servicio} className="text-[8px] leading-tight text-left">
                                      <span className="text-blue-600 font-semibold">{recetasPorServicio[servicio]}</span>
                                      <span className="text-gray-700 ml-0.5">{servicio}</span>
                                    </span>
                                  ));
                                })()}
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Número del día cuando no hay menú */}
                              <div className={`text-[9px] font-medium text-right pr-1 pt-0.5 ${diaNumClass}`}>
                                {fecha.getDate()}
                                {esDiaActual && <span className="ml-1 text-[7px]">(Hoy)</span>}
                              </div>
                              <div className="flex-1 flex items-center justify-center px-1">
                                <div className="text-[8px] text-gray-400 text-center">
                                  Sin menú
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                        </div>
                      </div>

                      {/* Calendario del mes siguiente */}
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="bg-cyan-50 p-2 border-b">
                          <h4 className="text-sm font-bold text-gray-800 text-center capitalize">
                            {(() => {
                              const mesSiguiente = new Date(mesActual);
                              mesSiguiente.setMonth(mesSiguiente.getMonth() + 1);
                              return mesSiguiente.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                            })()}
                          </h4>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {/* Encabezados de días */}
                          {['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(day => (
                            <div key={day} className="bg-cyan-50 p-0.5 text-center font-semibold text-gray-700 text-[9px] border-b">
                              {day.toUpperCase()}
                            </div>
                          ))}

                          {/* Generar espacios vacíos para alinear el primer día del mes siguiente */}
                          {(() => {
                            const mesSiguiente = new Date(mesActual);
                            mesSiguiente.setMonth(mesSiguiente.getMonth() + 1);
                            const primerDia = new Date(mesSiguiente.getFullYear(), mesSiguiente.getMonth(), 1);
                            const diaSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.
                            // Ajustar para que lunes sea 0 (restar 1 y manejar domingo)
                            const diaSemanaAjustado = diaSemana === 0 ? 6 : diaSemana - 1;
                            const espaciosVacios = [];
                            for (let i = 0; i < diaSemanaAjustado; i++) {
                              espaciosVacios.push(
                                <div key={`empty-next-${i}`} className="p-0.5 border-r border-b min-h-[65px] bg-gray-50"></div>
                              );
                            }
                            return espaciosVacios;
                          })()}

                          {/* Días del mes siguiente */}
                          {(() => {
                            const mesSiguiente = new Date(mesActual);
                            mesSiguiente.setMonth(mesSiguiente.getMonth() + 1);
                            return generarDiasDelMes(mesSiguiente);
                          })().map((fecha, index) => {
                            const esFinDeSemana = fecha.getDay() === 0 || fecha.getDay() === 6;
                            const menuDelDia = obtenerMenuPorFecha(fecha);
                            
                            // Verificar si es el día actual
                            const hoy = new Date();
                            const esDiaActual = fecha.getDate() === hoy.getDate() && 
                                                fecha.getMonth() === hoy.getMonth() && 
                                                fecha.getFullYear() === hoy.getFullYear();
                            
                            // Determinar el estilo de fondo según las condiciones
                            let bgClass = 'bg-white';
                            let bgHoverClass = 'hover:bg-gray-50';
                            let borderClass = '';
                            let diaNumClass = 'text-gray-500';
                            
                            if (esDiaActual) {
                              // Día actual - Resaltado más prominente
                              bgClass = 'bg-teal-100 border-teal-400 border-2';
                              bgHoverClass = 'hover:bg-teal-200';
                              borderClass = 'border-teal-400 border-2';
                              diaNumClass = 'text-teal-800 font-bold';
                            } else if (menuDelDia) {
                              // Día con menú - Fondo diferenciado y clickeable
                              bgClass = 'bg-blue-50/30';
                              bgHoverClass = 'hover:shadow-md hover:bg-blue-50/50 cursor-pointer';
                              diaNumClass = 'text-gray-400';
                            } else if (esFinDeSemana) {
                              // Fin de semana sin datos
                              bgClass = 'bg-red-50';
                              bgHoverClass = 'hover:bg-red-100';
                              diaNumClass = 'text-red-600';
                            }

                            return (
                              <div
                                key={`next-${index}`}
                                className={`border-r border-b min-h-[65px] flex flex-col transition-all duration-200 ${bgClass} ${borderClass} overflow-hidden relative ${menuDelDia ? 'cursor-pointer hover:shadow-md' : ''} ${bgHoverClass}`}
                                onClick={() => {
                                  if (menuDelDia && menuDelDia.ciclos !== undefined && menuDelDia.ciclos !== null) {
                                    console.log('Click en menú del calendario (mes siguiente):', {
                                      fecha: formatearFechaLocal(fecha),
                                      numMenu: menuDelDia.ciclos,
                                      menuDelDia,
                                      tieneDetalleCiclo: !!detalleCicloNutricional,
                                      tieneDetalleCicloArray: !!(detalleCicloNutricional?.detalle_ciclo_nutricional),
                                      tieneProductosDetalleZona: !!(productosDetalleZona && productosDetalleZona.length > 0)
                                    });
                                    
                                    // Usar detalleCicloNutricional si está disponible, sino usar productosDetalleZona
                                    const menusFiltrados = obtenerMenusFiltrados(fecha, menuDelDia.ciclos);
                                    const tieneDatos = (detalleCicloNutricional && detalleCicloNutricional.detalle_ciclo_nutricional && menusFiltrados.length > 0) || 
                                                       (productosDetalleZona && productosDetalleZona.length > 0);
                                    
                                    console.log('Resultado de validación (mes siguiente):', {
                                      menusFiltrados: menusFiltrados.length,
                                      tieneDatos,
                                      detalleCicloNutricional: !!detalleCicloNutricional,
                                      detalleCicloArray: !!(detalleCicloNutricional?.detalle_ciclo_nutricional)
                                    });
                                    
                                    if (tieneDatos) {
                                      setFechaMenuSeleccionado(fecha);
                                      setMenuNumeroSeleccionado(menuDelDia.ciclos);
                                      setMostrarCostos(false); // Resetear el estado de costos
                                      setShowMenuDetailModal(true);
                                    } else {
                                      toast.error('Menús no encontrados', {
                                        description: 'No se encontraron detalles para los menús. Asegúrate de haber seleccionado un contrato y calculado el ciclo.'
                                      });
                                    }
                                  } else if (menuDelDia) {
                                    console.warn('Click en menú sin ciclos definido (mes siguiente):', { menuDelDia, fecha: formatearFechaLocal(fecha) });
                                    toast.error('Error', {
                                      description: 'El menú seleccionado no tiene un número de ciclo válido.'
                                    });
                                  }
                                }}
                              >
                                {menuDelDia ? (
                                  <>
                                    {/* Sección superior con fondo azul claro pálido - mitad de la altura */}
                                    <div 
                                      className="px-1.5 py-1.5 flex flex-col relative" 
                                      style={{ 
                                        height: '50%',
                                        backgroundColor: '#f0f9ff' // sky-50 más pálido
                                      }}
                                    >
                                      {/* Número del día en la esquina superior derecha */}
                                      <div className="text-[11px] font-normal text-gray-400 absolute top-1 right-1.5">
                                        {fecha.getDate()}
                                      </div>
                                      {/* Botón MENU alineado a la izquierda, más corto y con color más pálido */}
                                      <div className="mt-0.5 flex justify-start">
                                        <div className="bg-blue-400 text-white px-1.5 py-0.5 rounded text-[9px] font-bold text-center shadow-sm">
                                          MENU #{menuDelDia.ciclos}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Sección inferior con fondo blanco - mitad de la altura */}
                                    <div 
                                      className="bg-white px-1.5 py-1.5 flex flex-col items-start justify-center gap-0.5" 
                                      style={{ height: '50%' }}
                                    >
                                      {(() => {
                                        const recetasPorServicio = obtenerRecetasPorClaseServicio(fecha);
                                        const ordenServicios = ['Desayuno', 'Almuerzo', 'Cena', 'Refrigerio'];
                                        const serviciosConRecetas = ordenServicios.filter(servicio => recetasPorServicio[servicio] > 0);
                                        
                                        if (serviciosConRecetas.length === 0 && recetasPorServicio['Total']) {
                                          return (
                                            <span className="text-[8px] leading-tight text-left">
                                              <span className="text-blue-600 font-semibold">{recetasPorServicio['Total']}</span>
                                              <span className="text-gray-700 ml-0.5">recetas</span>
                                            </span>
                                          );
                                        }
                                        
                                        return serviciosConRecetas.map((servicio) => (
                                          <span key={servicio} className="text-[8px] leading-tight text-left">
                                            <span className="text-blue-600 font-semibold">{recetasPorServicio[servicio]}</span>
                                            <span className="text-gray-700 ml-0.5">{servicio}</span>
                                          </span>
                                        ));
                                      })()}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Número del día cuando no hay menú */}
                                    <div className={`text-[9px] font-medium text-right pr-1 pt-0.5 ${diaNumClass}`}>
                                      {fecha.getDate()}
                                      {esDiaActual && <span className="ml-1 text-[7px]">(Hoy)</span>}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center px-1">
                                      <div className="text-[8px] text-gray-400 text-center">
                                        Sin menú
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Footer del calendario con botones de navegación y acciones */}
                  <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-white to-blue-50 p-3 rounded-lg border border-blue-200 shadow-sm mt-2">
                    {/* Lado izquierdo: Botones de navegación */}
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={irMesAnterior}
                        variant="outline" 
                        size="sm" 
                        className="text-gray-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                      >
                        ← Anterior
                      </Button>
                      <Button
                        onClick={irMesSiguiente}
                        variant="outline" 
                        size="sm" 
                        className="text-gray-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                      >
                        Siguiente →
                      </Button>
                    </div>

                    {/* Lado derecho: Botones Guardar y Cancelar */}
                    <div className="flex items-center gap-2">
                      {menusPorFecha.length > 0 && (
                        <AlertDialog open={showConfirmGuardarCiclo} onOpenChange={setShowConfirmGuardarCiclo}>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="h-8 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-xs font-medium">Guardar Ciclo</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Guardar ciclo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Estás seguro de que deseas guardar este ciclo? Se creará una nueva planeación con los menús calculados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    // Obtener fechas de inicio y fin del ciclo
                                    if (!contratoSeleccionadoCiclo?.id) {
                                      toast.error('Error', {
                                        description: 'No hay un contrato seleccionado.'
                                      });
                                      setShowConfirmGuardarCiclo(false);
                                      return;
                                    }

                                    const { data: fechasData, error: fechasError } = await supabase.rpc('sp_calcular_menus_semana_fechas', {
                                      p_idcontrato: contratoSeleccionadoCiclo.id
                                    });

                                    if (fechasError) throw fechasError;

                                    if (!fechasData || fechasData.length === 0) {
                                      toast.error('Error', {
                                        description: 'No se pudieron obtener las fechas del ciclo.'
                                      });
                                      setShowConfirmGuardarCiclo(false);
                                      return;
                                    }

                                    const fechas = fechasData[0];
                                    const fechaInicio = parsearFechaLocal(fechas.inicio);
                                    const fechaFin = parsearFechaLocal(fechas.fin);

                                    // Función auxiliar para formatear fecha
                                    const formatoFecha = (fecha: Date) => {
                                      const año = fecha.getFullYear();
                                      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                                      const dia = String(fecha.getDate()).padStart(2, '0');
                                      return `${año}-${mes}-${dia}`;
                                    };

                                    // Calcular número de días
                                    const diasDiferencia = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                                    // Obtener el número de menú inicial y final del ciclo
                                    const menusOrdenados = [...menusPorFecha].sort((a, b) => {
                                      const fechaA = new Date(a.fecha).getTime();
                                      const fechaB = new Date(b.fecha).getTime();
                                      if (fechaA !== fechaB) {
                                        return fechaA - fechaB;
                                      }
                                      const numMenuA = a.ciclos || 0;
                                      const numMenuB = b.ciclos || 0;
                                      return numMenuA - numMenuB;
                                    });

                                    const numeroMenuInicial = menusOrdenados[0]?.ciclos || 1;
                                    const numeroMenuFinal = menusOrdenados[menusOrdenados.length - 1]?.ciclos || 28;

                                    // Crear la planeación
                                    const { planeacionesService } = await import('@/services/planeacionesService');
                                    
                                    // Obtener el usuario actual desde la sesión de Supabase
                                    const { data: { user } } = await supabase.auth.getUser();
                                    
                                    const nuevaPlaneacion: any = {
                                      id_contrato: contratoSeleccionadoCiclo.id,
                                      id_sede: sedeSeleccionadaCiclo?.value || contratoSeleccionadoCiclo.id_sede || 1,
                                      id_detalle_zona: zonaSeleccionada?.value || 1,
                                      fecha_inicial: formatoFecha(fechaInicio),
                                      fecha_final: formatoFecha(fechaFin),
                                      num_ciclos: diasDiferencia,
                                      numero_menu_inicial: numeroMenuInicial,
                                      numero_menu_final: numeroMenuFinal,
                                      no_servicios: contratoSeleccionadoCiclo.no_servicios || 0,
                                      valor_total: contratoSeleccionadoCiclo.valor_total || 0,
                                      estado: 'ENPROCESO',
                                      id_usuario: user?.id ? parseInt(user.id) : 1,
                                      no_req: 0 // Se generará automáticamente en el backend
                                    };

                                    await planeacionesService.create(nuevaPlaneacion);

                                    toast.success('Ciclo guardado exitosamente', {
                                      description: `Se guardó el ciclo del ${fechaInicio.toLocaleDateString()} al ${fechaFin.toLocaleDateString()}`
                                    });

                                    // Invalidar y refrescar las queries
                                    await queryClient.invalidateQueries({ queryKey: ['planeaciones-contratos'] });
                                    await queryClient.refetchQueries({ queryKey: ['planeaciones-contratos'] });
                                    
                                    setShowConfirmGuardarCiclo(false);
                                  } catch (error: any) {
                                    console.error('Error al guardar el ciclo:', error);
                                    toast.error('Error al guardar el ciclo', {
                                      description: error?.message || 'No se pudo guardar el ciclo. Intenta nuevamente.'
                                    });
                                    setShowConfirmGuardarCiclo(false);
                                  }
                                }}
                              >
                                Guardar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      <Button
                        onClick={() => {
                          // Limpiar el formulario
                          setContratoSeleccionadoCiclo(null);
                          setSedeSeleccionadaCiclo(null);
                          setFechaInicialCiclo(null);
                          setFechaFinalCiclo(null);
                          setMenusPorFecha([]);
                          setDiasCalculados(0);
                          setMesActual(new Date());
                          setUnidadServicioSeleccionada(null);
                          setProductosDetalleZona([]);
                          setShowMenuDetailModal(false);
                          setMostrarCostos(false);
                          setPpl(0);
                          setServicio(0);
                          setServicioDia(0);
                          setRaciones(0);
                          setZonaSeleccionada(null);
                          
                          // Redirigir al listado
                          setActiveTab("ciclos");
                        }}
                        variant="outline"
                        className="h-8 px-3 border-gray-300 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-xs font-medium">Cancelar</span>
                      </Button>
                    </div>
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

          {/* Modal/Overlay de Detalles del Menú */}
          {showMenuDetailModal && fechaMenuSeleccionado && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-50 animate-fade-in" 
              onClick={() => {
                setShowMenuDetailModal(false);
                setMostrarCostos(false);
              }}
            >
              <div 
                className="h-[80vh] w-[70%] max-w-4xl bg-white shadow-2xl overflow-hidden flex flex-col animate-slide-in-from-right"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del modal - Estilo como la imagen */}
                <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">Menu asignado al dia</p>
                    <p className="text-base font-bold text-gray-700">
                      {fechaMenuSeleccionado.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }).replace(/,/g, '')}
                      {menuNumeroSeleccionado && ` - MENU #${menuNumeroSeleccionado}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMostrarCostos(!mostrarCostos);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 border border-blue-400 bg-white rounded-md text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                    >
                      <input
                        type="checkbox"
                        checked={mostrarCostos}
                        readOnly
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMostrarCostos(!mostrarCostos);
                        }}
                      />
                      <span className="text-sm font-medium whitespace-nowrap">Ver Detalle Costos</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowMenuDetailModal(false);
                        setMostrarCostos(false);
                      }}
                      className="text-gray-600 hover:bg-gray-200 h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Contenido del modal */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingProductos ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                      <span className="ml-2 text-gray-600">Cargando detalles del menú...</span>
                    </div>
                  ) : (() => {
                    // Obtener menús filtrados: primero intentar desde detalleCicloNutricional, sino usar productosDetalleZona
                    let menusParaMostrar: any[] = [];
                    
                    if (fechaMenuSeleccionado && menuNumeroSeleccionado !== null) {
                      const menusFiltrados = obtenerMenusFiltrados(fechaMenuSeleccionado, menuNumeroSeleccionado);
                      if (menusFiltrados.length > 0) {
                        menusParaMostrar = menusFiltrados;
                      } else if (productosDetalleZona && productosDetalleZona.length > 0) {
                        menusParaMostrar = productosDetalleZona;
                      }
                    } else if (productosDetalleZona && productosDetalleZona.length > 0) {
                      menusParaMostrar = productosDetalleZona;
                    }
                    
                    if (menusParaMostrar.length === 0) {
                      return (
                        <div className="text-center text-gray-500 py-8">
                          No hay menús disponibles. Asegúrate de haber seleccionado un contrato y calculado el ciclo.
                        </div>
                      );
                    }
                    
                    return <MenuDetailContent menus={menusParaMostrar} mostrarCostos={mostrarCostos} />;
                  })()}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente para mostrar el contenido detallado del menú agrupado por servicio
const MenuDetailContent = ({ menus, mostrarCostos }: { menus: any[]; mostrarCostos: boolean }) => {
  // Agrupar menús por nombre_servicio
  const menusPorServicio: Record<string, any[]> = {};
  
  menus.forEach((menu: any) => {
    const servicio = menu.nombre_servicio || 'Otros';
    if (!menusPorServicio[servicio]) {
      menusPorServicio[servicio] = [];
    }
    menusPorServicio[servicio].push(menu);
  });

  // Mapeo de colores por servicio
  const coloresServicio: Record<string, { bg: string; text: string; border: string }> = {
    'Desayuno': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'Almuerzo': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Cena': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Refrigerio': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  };

  // Calcular el costo total por servicio
  const calcularCostoServicio = (menusServicio: any[]) => {
    return menusServicio.reduce((total, menu) => {
      const componentesConDetalle = menu.detalle?.filter((comp: any) => comp.detalle && comp.detalle.length > 0) || [];
      const costoMenu = componentesConDetalle.reduce((sum: number, comp: any) => {
        return sum + (comp.detalle?.reduce((s: number, det: any) => s + (det.total || 0), 0) || 0);
      }, 0);
      return total + costoMenu;
    }, 0);
  };

  // Limpiar nombre del componente (remover referencias a servicios)
  const limpiarNombreComponente = (nombre: string) => {
    return nombre
      .replace(/- (DESAYUNO|ALMUERZO|CENA|REFRIGERIO)/gi, '')
      .trim();
  };

  // Orden de servicios
  const ordenServicios = ['Desayuno', 'Almuerzo', 'Cena', 'Refrigerio'];

  return (
    <div className="grid grid-cols-4 gap-3">
      {ordenServicios.map((servicioNombre) => {
        const menusServicio = menusPorServicio[servicioNombre] || [];
        if (menusServicio.length === 0) {
          // Mostrar columna vacía si no hay menús para este servicio
          return (
            <div key={servicioNombre} className="flex flex-col">
              <div className={`${coloresServicio[servicioNombre]?.bg || 'bg-gray-50'} ${coloresServicio[servicioNombre]?.border || 'border-gray-200'} border-2 rounded-t-lg p-2 mb-2`}>
                <h3 className={`${coloresServicio[servicioNombre]?.text || 'text-gray-700'} font-bold text-sm uppercase`}>
                  {servicioNombre}
                </h3>
                {mostrarCostos && (
                  <p className="text-xs text-gray-600 mt-1">Costo Total: $0</p>
                )}
              </div>
              <div className="flex-1 bg-gray-50 rounded-b-lg p-3 text-center text-gray-400 text-xs">
                Sin menús
              </div>
            </div>
          );
        }

        const color = coloresServicio[servicioNombre] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
        const costoTotal = calcularCostoServicio(menusServicio);

        // Agrupar todos los componentes de todos los menús de este servicio
        const todosComponentes: any[] = [];
        menusServicio.forEach((menu) => {
          const componentesConDetalle = menu.detalle?.filter((comp: any) => comp.detalle && comp.detalle.length > 0) || [];
          componentesConDetalle.forEach((comp: any) => {
            // Verificar si ya existe un componente con el mismo nombre
            const componenteExistente = todosComponentes.find(c => limpiarNombreComponente(c.componente) === limpiarNombreComponente(comp.componente));
            if (componenteExistente) {
              // Combinar los detalles, agrupando por producto y sumando cantidades
              (comp.detalle || []).forEach((detalleItem: any) => {
                // Buscar si ya existe un detalle con el mismo producto (por id_maestro_producto o nombre)
                const detalleExistente = componenteExistente.detalle?.find((d: any) => 
                  (d.id_maestro_producto && detalleItem.id_maestro_producto && d.id_maestro_producto === detalleItem.id_maestro_producto) ||
                  (!d.id_maestro_producto && !detalleItem.id_maestro_producto && d.nombre === detalleItem.nombre && d.id_medida === detalleItem.id_medida)
                );
                
                if (detalleExistente) {
                  // Sumar cantidades y totales
                  detalleExistente.cantidad = (Number(detalleExistente.cantidad) || 0) + (Number(detalleItem.cantidad) || 0);
                  detalleExistente.total = (Number(detalleExistente.total) || 0) + (Number(detalleItem.total) || 0);
                  // Actualizar costo unitario promedio si es necesario
                  if (detalleExistente.cantidad > 0) {
                    detalleExistente.costo = detalleExistente.total / detalleExistente.cantidad;
                  }
                } else {
                  // Agregar nuevo detalle si no existe
                  if (!componenteExistente.detalle) {
                    componenteExistente.detalle = [];
                  }
                  componenteExistente.detalle.push({ ...detalleItem });
                }
              });
            } else {
              todosComponentes.push({ ...comp });
            }
          });
        });

        return (
          <div key={servicioNombre} className="flex flex-col">
            {/* Header del servicio */}
            <div className={`${color.bg} ${color.border} border-2 rounded-t-lg p-2 mb-2`}>
              <h3 className={`${color.text} font-bold text-sm uppercase`}>{servicioNombre}</h3>
              {mostrarCostos && (
                <p className="text-xs text-gray-600 mt-1">Costo Total: ${costoTotal.toLocaleString()}</p>
              )}
            </div>

            {/* Lista de componentes */}
            <div className="flex-1 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              {todosComponentes.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-4 bg-gray-50 rounded-lg">
                  Sin componentes
                </div>
              ) : (
                todosComponentes.map((componente, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                    <h4 className={`${color.text} font-semibold text-xs mb-2`}>
                      {limpiarNombreComponente(componente.componente)}
                    </h4>
                    <div className="space-y-1.5">
                      {componente.detalle?.map((detalle: any, detIdx: number) => (
                        <div key={detIdx} className="text-xs text-gray-700 border-l-2 border-gray-300 pl-2">
                          <div className="font-medium">{detalle.nombre}</div>
                          <div className="text-gray-500 mt-0.5">
                            {detalle.cantidad} {detalle.medida}
                            {mostrarCostos && detalle.total > 0 && (
                              <>
                                <span className="ml-2 text-gray-600 font-semibold">
                                  - ${detalle.total?.toLocaleString()}
                                </span>
                                {detalle.costo > 0 && (
                                  <span className="ml-2 text-gray-500 text-[10px]">
                                    (Unit: ${detalle.costo?.toLocaleString()})
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalisisCompraPage;