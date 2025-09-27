import React, { useState } from "react";
import { Plus, Edit, Trash2, X, ChevronDown, Eye, Settings, Building, Users, FileText, Award, BarChart, UserCheck, QrCode, Crown, Shield, Lock, CheckCircle, PackageOpen, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/contexts/LoadingContext";
import { apiRequest } from "@/lib/queryClient";
import { AdvancedProfileManager } from "@/components/profiles/AdvancedProfileManager";
import { PermissionsForm } from "@/components/profiles/PermissionsForm";
import { rolesService } from '@/services/rolesService';
import { Skeleton } from "@/components/ui/skeleton"; // Importar Skeleton
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Can } from "@/contexts/PermissionsContext";

// Schema para el formulario de perfil
const perfilSchema = z.object({
  codigo: z.number(),
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  permisos: z.array(z.object({
    viewId: z.string(),
    viewName: z.string(),
    actions: z.array(z.string()).default([])
  })).default([])
});

type PerfilForm = z.infer<typeof perfilSchema>;

interface Perfil {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  modulos_count: number;
}

// Mock data de las vistas del sistema (Mantengo el mock por si lo necesitas para referencia, aunque ya no se usa directamente)
interface ViewAction {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  tipo: string;
  orden: number;
  activo: boolean;
}

interface SystemView {
  id: number;
  nombre: string;
  displayName: string;
  descripcion: string;
  ruta: string;
  modulo: string;
  icono: string;
  orden: number;
  activo: boolean;
  acciones: ViewAction[];
}

const mockSystemViews: SystemView[] = [
  {
    id: 1,
    nombre: "dashboard",
    displayName: "Dashboard General",
    descripcion: "Panel principal del sistema con métricas y estadísticas",
    ruta: "/admin/dashboard",
    modulo: "GENERAL",
    icono: "LayoutDashboard",
    orden: 1,
    activo: true,
    acciones: [
      { id: 1, nombre: "ver_dashboard", displayName: "Ver Dashboard", descripcion: "Acceso al panel principal", tipo: "visualizacion", orden: 1, activo: true },
      { id: 2, nombre: "ver_estadisticas", displayName: "Ver Estadísticas", descripcion: "Visualizar métricas del sistema", tipo: "visualizacion", orden: 2, activo: true },
      { id: 3, nombre: "exportar_dashboard", displayName: "Exportar Dashboard", descripcion: "Exportar datos del dashboard", tipo: "exportacion", orden: 3, activo: true }
    ]
  },
  {
    id: 2,
    nombre: "usuarios",
    displayName: "Gestión de Usuarios",
    descripcion: "Administración completa de usuarios del sistema",
    ruta: "/admin/usuarios",
    modulo: "SEGURIDAD",
    icono: "Users",
    orden: 1,
    activo: true,
    acciones: [
      { id: 4, nombre: "ver_usuarios", displayName: "Ver Usuarios", descripcion: "Listar todos los usuarios", tipo: "visualizacion", orden: 1, activo: true },
      { id: 5, nombre: "crear_usuario", displayName: "Crear Usuario", descripcion: "Registrar nuevos usuarios", tipo: "creacion", orden: 2, activo: true },
      { id: 6, nombre: "editar_usuario", displayName: "Editar Usuario", descripcion: "Modificar datos de usuarios", tipo: "edicion", orden: 3, activo: true },
      { id: 7, nombre: "eliminar_usuario", displayName: "Eliminar Usuario", descripcion: "Desactivar o eliminar usuarios", tipo: "eliminacion", orden: 4, activo: true },
      { id: 8, nombre: "resetear_password", displayName: "Resetear Contraseña", descripcion: "Restablecer contraseñas de usuario", tipo: "especial", orden: 5, activo: true }
    ]
  },
  {
    id: 3,
    nombre: "perfiles",
    displayName: "Perfiles de Usuario",
    descripcion: "Gestión de perfiles y roles del sistema",
    ruta: "/admin/perfiles",
    modulo: "SEGURIDAD",
    icono: "UserCircle",
    orden: 2,
    activo: true,
    acciones: [
      { id: 9, nombre: "ver_perfiles", displayName: "Ver Perfiles", descripcion: "Listar perfiles de usuario", tipo: "visualizacion", orden: 1, activo: true },
      { id: 10, nombre: "crear_perfil", displayName: "Crear Perfil", descripcion: "Crear nuevos perfiles", tipo: "creacion", orden: 2, activo: true },
      { id: 11, nombre: "editar_perfil", displayName: "Editar Perfil", descripcion: "Modificar perfiles existentes", tipo: "edicion", orden: 3, activo: true },
      { id: 12, nombre: "eliminar_perfil", displayName: "Eliminar Perfil", descripcion: "Eliminar perfiles de usuario", tipo: "eliminacion", orden: 4, activo: true }
    ]
  },
  {
    id: 4,
    nombre: "candidatos",
    displayName: "Gestión de Candidatos",
    descripcion: "Administración de candidatos y postulantes",
    ruta: "/admin/candidatos",
    modulo: "REGISTROS",
    icono: "UserPlus",
    orden: 1,
    activo: true,
    acciones: [
      { id: 13, nombre: "ver_candidatos", displayName: "Ver Candidatos", descripcion: "Listar candidatos", tipo: "visualizacion", orden: 1, activo: true },
      { id: 14, nombre: "crear_candidato", displayName: "Crear Candidato", descripcion: "Registrar nuevos candidatos", tipo: "creacion", orden: 2, activo: true },
      { id: 15, nombre: "editar_candidato", displayName: "Editar Candidato", descripcion: "Modificar datos de candidatos", tipo: "edicion", orden: 3, activo: true },
      { id: 16, nombre: "eliminar_candidato", displayName: "Eliminar Candidato", descripcion: "Eliminar candidatos", tipo: "eliminacion", orden: 4, activo: true },
      { id: 17, nombre: "aprobar_candidato", displayName: "Aprobar Candidato", descripcion: "Aprobar solicitudes de candidatos", tipo: "aprobacion", orden: 5, activo: true }
    ]
  },
  {
    id: 5,
    nombre: "empresas",
    displayName: "Empresas Afiliadas",
    descripcion: "Gestión de empresas cliente y afiliadas",
    ruta: "/admin/empresas",
    modulo: "EMPRESA",
    icono: "Building",
    orden: 1,
    activo: true,
    acciones: [
      { id: 18, nombre: "ver_empresas", displayName: "Ver Empresas", descripcion: "Listar empresas afiliadas", tipo: "visualizacion", orden: 1, activo: true },
      { id: 19, nombre: "crear_empresa", displayName: "Crear Empresa", descripcion: "Registrar nuevas empresas", tipo: "creacion", orden: 2, activo: true },
      { id: 20, nombre: "editar_empresa", displayName: "Editar Empresa", descripcion: "Modificar datos de empresas", tipo: "edicion", orden: 3, activo: true },
      { id: 21, nombre: "eliminar_empresa", displayName: "Eliminar Empresa", descripcion: "Desactivar empresas", tipo: "eliminacion", orden: 4, activo: true }
    ]
  },
  {
    id: 6,
    nombre: "qr",
    displayName: "Códigos QR",
    descripcion: "Gestión y generación de códigos QR",
    ruta: "/admin/qr",
    modulo: "RECURSOS",
    icono: "QrCode",
    orden: 1,
    activo: true,
    acciones: [
      { id: 22, nombre: "ver_qr", displayName: "Ver Códigos QR", descripcion: "Visualizar códigos QR", tipo: "visualizacion", orden: 1, activo: true },
      { id: 23, nombre: "generar_qr", displayName: "Generar QR", descripcion: "Crear nuevos códigos QR", tipo: "creacion", orden: 2, activo: true },
      { id: 24, nombre: "eliminar_qr", displayName: "Eliminar QR", descripcion: "Eliminar códigos QR", tipo: "eliminacion", orden: 3, activo: true }
    ]
  },
  {
    id: 7,
    nombre: "analistas",
    displayName: "Gestión de Analistas",
    descripcion: "Administración de analistas y especialistas",
    ruta: "/admin/analistas",
    modulo: "RECURSOS",
    icono: "UserCheck",
    orden: 2,
    activo: true,
    acciones: [
      { id: 25, nombre: "ver_analistas", displayName: "Ver Analistas", descripcion: "Listar analistas", tipo: "visualizacion", orden: 1, activo: true },
      { id: 26, nombre: "crear_analista", displayName: "Crear Analista", descripcion: "Registrar nuevos analistas", tipo: "creacion", orden: 2, activo: true },
      { id: 27, nombre: "editar_analista", displayName: "Editar Analista", descripcion: "Modificar datos de analistas", tipo: "edicion", orden: 3, activo: true },
      { id: 28, nombre: "eliminar_analista", displayName: "Eliminar Analista", descripcion: "Eliminar analistas", tipo: "eliminacion", orden: 4, activo: true },
      { id: 29, nombre: "asignar_casos", displayName: "Asignar Casos", descripcion: "Asignar casos a analistas", tipo: "especial", orden: 5, activo: true }
    ]
  },
  {
    id: 8,
    nombre: "ordenes",
    displayName: "Expedición de Órdenes",
    descripcion: "Gestión de órdenes médicas y laboratoriales",
    ruta: "/admin/ordenes",
    modulo: "ORDENES",
    icono: "FileText",
    orden: 1,
    activo: true,
    acciones: [
      { id: 30, nombre: "ver_ordenes", displayName: "Ver Órdenes", descripcion: "Listar órdenes médicas", tipo: "visualizacion", orden: 1, activo: true },
      { id: 31, nombre: "crear_orden", displayName: "Crear Orden", descripcion: "Generar nuevas órdenes", tipo: "creacion", orden: 2, activo: true },
      { id: 32, nombre: "editar_orden", displayName: "Editar Orden", descripcion: "Modificar órdenes existentes", tipo: "edicion", orden: 3, activo: true },
      { id: 33, nombre: "eliminar_orden", displayName: "Anular Orden", descripcion: "Cancelar órdenes", tipo: "eliminacion", orden: 4, activo: true },
      { id: 34, nombre: "firmar_orden", displayName: "Firmar Orden", descripcion: "Firmar órdenes médicas", tipo: "aprobacion", orden: 5, activo: true }
    ]
  },
  {
    id: 9,
    nombre: "certificados",
    displayName: "Expedición de Certificados",
    descripcion: "Gestión de certificados médicos y laboratoriales",
    ruta: "/admin/certificados",
    modulo: "CERTIFICADOS",
    icono: "Award",
    orden: 1,
    activo: true,
    acciones: [
      { id: 35, nombre: "ver_certificados", displayName: "Ver Certificados", descripcion: "Listar certificados", tipo: "visualizacion", orden: 1, activo: true },
      { id: 36, nombre: "crear_certificado", displayName: "Crear Certificado", descripcion: "Generar certificados", tipo: "creacion", orden: 2, activo: true },
      { id: 37, nombre: "editar_certificado", displayName: "Editar Certificado", descripcion: "Modificar certificados", tipo: "edicion", orden: 3, activo: true },
      { id: 38, nombre: "eliminar_certificado", displayName: "Eliminar Certificado", descripcion: "Anular certificados", tipo: "eliminacion", orden: 4, activo: true },
      { id: 39, nombre: "firmar_certificado", displayName: "Firmar Certificado", descripcion: "Firmar certificados médicos", tipo: "aprobacion", orden: 5, activo: true }
    ]
  },
  {
    id: 10,
    nombre: "maestro",
    displayName: "Configuración Maestro",
    descripcion: "Gestión de datos maestros y configuraciones",
    ruta: "/admin/maestro",
    modulo: "CONFIGURACION",
    icono: "Settings",
    orden: 1,
    activo: true,
    acciones: [
      { id: 40, nombre: "ver_maestro", displayName: "Ver Configuración", descripcion: "Visualizar configuraciones", tipo: "visualizacion", orden: 1, activo: true },
      { id: 41, nombre: "editar_maestro", displayName: "Editar Configuración", descripcion: "Modificar configuraciones", tipo: "edicion", orden: 2, activo: true },
      { id: 42, nombre: "exportar_maestro", displayName: "Exportar Configuración", descripcion: "Exportar datos maestros", tipo: "exportacion", orden: 3, activo: true }
    ]
  },
  {
    id: 11,
    nombre: "reportes",
    displayName: "Reportes y Análisis",
    descripcion: "Generación de reportes y análisis estadísticos",
    ruta: "/admin/reportes",
    modulo: "REPORTES",
    icono: "BarChart",
    orden: 1,
    activo: true,
    acciones: [
      { id: 43, nombre: "ver_reportes", displayName: "Ver Reportes", descripcion: "Visualizar reportes", tipo: "visualizacion", orden: 1, activo: true },
      { id: 44, nombre: "generar_reporte", displayName: "Generar Reporte", descripcion: "Crear nuevos reportes", tipo: "creacion", orden: 2, activo: true },
      { id: 45, nombre: "exportar_reporte", displayName: "Exportar Reporte", descripcion: "Exportar reportes en diferentes formatos", tipo: "exportacion", orden: 3, activo: true },
      { id: 46, nombre: "programar_reporte", displayName: "Programar Reporte", descripcion: "Programar generación automática", tipo: "especial", orden: 4, activo: true }
    ]
  }
];

const PerfilesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("perfiles");
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
  const [viewingModules, setViewingModules] = useState<{ modulo_nombre: string }[] | null>(null);
  const [selectedProfileForModules, setSelectedProfileForModules] = useState<Perfil | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();

  // Funciones auxiliares para las vistas
  const getModuleColor = (modulo: string) => {
    const colors: Record<string, string> = {
      'GENERAL': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'SEGURIDAD': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'REGISTROS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'EMPRESA': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'RECURSOS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'ORDENES': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20',
      'CERTIFICADOS': 'bg-brand-lime/10 text-brand-lime border-brand-lime/20',
      'CONFIGURACION': 'bg-brand-gray/10 text-brand-gray border-brand-gray/20',
      'REPORTES': 'bg-brand-turquoise/10 text-brand-turquoise border-brand-turquoise/20'
    };
    return colors[modulo] || 'bg-brand-gray/10 text-brand-gray border-brand-gray/20';
  };

  const getActionTypeColor = (tipo: string) => {
    const colors: Record<string, string> = {
              'visualizacion': 'bg-cyan-100 text-cyan-800',
      'creacion': 'bg-brand-lime/10 text-brand-lime',
      'edicion': 'bg-yellow-100 text-yellow-800',
      'eliminacion': 'bg-red-100 text-red-800',
      'exportacion': 'bg-purple-100 text-purple-800',
      'aprobacion': 'bg-orange-100 text-orange-800',
      'especial': 'bg-indigo-100 text-indigo-800'
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'LayoutDashboard': Eye,
      'Users': Users,
      'UserCircle': Users,
      'UserPlus': Users,
      'Building': Building,
      'QrCode': QrCode,
      'UserCheck': UserCheck,
      'FileText': FileText,
      'Award': Award,
      'Settings': Settings,
      'BarChart': BarChart
    };
    return iconMap[iconName] || Eye;
  };

  // Fetch perfiles desde Supabase
  const { data: perfiles = [], isLoading, refetch, error: queryError } = useQuery<Perfil[], Error>({
    queryKey: ['roles'],
    queryFn: async () => {
      const fetchedRoles = await rolesService.listRoles();
      console.log("Roles fetched from service:", fetchedRoles);
      return fetchedRoles;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Manejar errores de la consulta (si ocurren)
  React.useEffect(() => {
    if (queryError) {
      console.error("Error al cargar perfiles:", queryError);
      toast({ title: 'Error', description: 'No se pudieron cargar los perfiles', variant: 'destructive' });
    }
  }, [queryError, toast]);

  console.log("Perfiles data in component:", perfiles);

  const form = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      codigo: 0,
      nombre: "",
      descripcion: "",
      permisos: []
    }
  });



  // Create/Update perfil mutation
  const savePerfilMutation = useMutation({
    mutationFn: async (data: PerfilForm) => {
      startLoading();
      try {
        // Mapear los permisos del formulario a la estructura esperada por setAccionesToRol
        const modulosParaGuardar = data.permisos.map(p => ({
          modulo_id: Number(p.viewId), // viewId del formulario es ahora el modulo_id
          acciones: p.actions // actions del formulario ya contiene los codes
        }));

        if (editingPerfil) {
          // Editar
          const updated = await rolesService.updateRole(editingPerfil.id, { nombre: data.nombre, descripcion: data.descripcion });
          await rolesService.setAccionesToRol(editingPerfil.id, modulosParaGuardar);
          return updated;
        } else {
          // Crear
          const created = await rolesService.createRole({ nombre: data.nombre, descripcion: data.descripcion });
          await rolesService.setAccionesToRol(created.id, modulosParaGuardar);
          return created;
        }
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => {
      setIsModalOpen(false);
      setEditingPerfil(null);
      queryClient.removeQueries({ queryKey: ['roles'] });
      await refetch();
      setActiveTab('perfiles');
      form.reset({ codigo: 0, nombre: '', descripcion: '', permisos: [] });
      toast({ title: '✅ Éxito', description: editingPerfil ? 'Perfil actualizado correctamente' : 'Perfil creado correctamente', variant: 'default' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Error al guardar el perfil', variant: 'destructive' });
    }
  });

  // Delete perfil mutation
  const deletePerfilMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await rolesService.deleteRole(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['roles'] });
      await refetch();
      toast({ title: '✅ Éxito', description: 'Perfil eliminado correctamente', variant: 'default' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Error al eliminar el perfil', variant: 'destructive' });
    }
  });

  // Mutaciones para eliminar permanente y activar
  const deletePerfilPermanentMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await rolesService.deleteRolePermanent(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['roles'] });
      await refetch();
      toast({ title: '✅ Éxito', description: 'Perfil eliminado permanentemente', variant: 'default' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Error al eliminar el perfil', variant: 'destructive' });
    }
  });

  const activatePerfilMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await rolesService.activateRole(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['roles'] });
      await refetch();
      toast({ title: '✅ Éxito', description: 'Perfil activado correctamente', variant: 'default' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Error al activar el perfil', variant: 'destructive' });
    }
  });

  const onSubmit = (data: PerfilForm) => {
    savePerfilMutation.mutate(data);
  };

  // handleEdit debe cargar los permisos del rol desde Supabase y mostrarlos en la tabla para editar
  const handleEdit = async (perfil: any) => {
    startLoading();
    try {
      setEditingPerfil(perfil);
      const accionesCompletas = await rolesService.getAccionesCompletasPorRol(perfil.id);
      // console.log("Acciones completas fetched:", accionesCompletas); // Comentado para limpiar consola

      // Agrupar acciones por modulo_id y recopilar las acciones de cada modulo
      const modulosConAcciones: Record<number, { nombre: string; acciones: string[] }> = {};

      accionesCompletas.forEach(accion => {
        // Acceso directo a modulo_id y modulo_nombre, ya que rolesService los devuelve así
        const moduloId = accion.modulo_id;
        const moduloNombre = accion.modulo_nombre;

        if (moduloId !== null && moduloId !== undefined && moduloNombre) {
          if (!modulosConAcciones[moduloId]) {
            modulosConAcciones[moduloId] = { nombre: moduloNombre, acciones: [] };
          }
          // Añadir el código de la acción (accion.accion_codigo) al array de acciones del módulo
          if (!modulosConAcciones[moduloId].acciones.includes(accion.accion_codigo)) {
            modulosConAcciones[moduloId].acciones.push(accion.accion_codigo);
          }
        }
      });

      // Construir el array de permisos para el formulario usando los módulos agrupados
      const permisosParaForm = Object.keys(modulosConAcciones).map(moduloIdStr => {
        const moduloId = Number(moduloIdStr);
        const moduloData = modulosConAcciones[moduloId];
        return {
          viewId: String(moduloId), // El ID del módulo
          viewName: moduloData.nombre, // El nombre del módulo
          actions: moduloData.acciones // Las acciones asociadas a los permisos de este módulo
        };
      });

      form.reset({ codigo: perfil.id, nombre: perfil.nombre, descripcion: perfil.descripcion || '', permisos: permisosParaForm });
      setActiveTab('vistas');
    } catch (error) {
      console.error("Error al cargar permisos del perfil:", error);
      toast({ title: 'Error', description: 'No se pudieron cargar los permisos del perfil', variant: 'destructive' });
      form.reset({ codigo: perfil.id, nombre: perfil.nombre, descripcion: perfil.descripcion || '', permisos: [] });
      setActiveTab('vistas');
    } finally {
      stopLoading();
    }
  };

  // handleDelete ya usa deletePerfilMutation
  const handleDelete = (id: number) => {
    deletePerfilMutation.mutate(id);
  };

  const handleAdvancedProfileCreated = async (profile: any) => {
    startLoading();
    try {
      // Invalidar cache para actualizar la lista y refrescar
      await queryClient.invalidateQueries({ queryKey: ['/api/perfiles'] });
      await refetch();

      // Mostrar notificación de éxito
      toast({
        title: "Perfil Avanzado Creado",
        description: `El perfil "${profile.name}" ha sido creado exitosamente con permisos granulares.`,
        variant: "default",
      });
    } finally {
      stopLoading();
    }
  };

  const handleViewModules = async (perfil: Perfil) => {
    startLoading();
    try {
      setSelectedProfileForModules(perfil);
      const acciones = await rolesService.getAccionesCompletasPorRol(perfil.id);
      const uniqueModules = [...new Map(acciones.map(item => [item.modulo_nombre, item])).values()];
      setViewingModules(uniqueModules);
      setIsModulesModalOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los módulos del perfil', variant: 'destructive' });
    } finally {
      stopLoading();
    }
  };

  // Filtrado de perfiles
  const filteredPerfiles = perfiles.filter(perfil => {
    const matchesSearch = perfil.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (perfil.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : (statusFilter === "active" ? perfil.activo : !perfil.activo);
    return matchesSearch && matchesStatus;
  });


  if (isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Crown className="w-8 h-8 text-cyan-600" />
          Gestión de Perfiles y Vistas
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="perfiles"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Perfiles
          </TabsTrigger>
          <TabsTrigger
            value="vistas"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Perfil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfiles" className="mt-6">
          {/* Header similar a la imagen */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Crown className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">ROLES</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-perfil">
                  <Button
                    onClick={() => {
                      setEditingPerfil(null);
                      form.reset({
                        codigo: perfiles.length + 1,
                        nombre: "",
                        descripcion: "",
                        permisos: []
                      });
                      setActiveTab("vistas");
                    }}
                    className="bg-teal-400 hover:bg-teal-500 text-white text-xs px-3 py-1"
                    size="sm"
                  >
                    Adicionar Registro
                  </Button>
                </Can>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Solo activos</SelectItem>
                    <SelectItem value="inactive">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("active");
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpiar filtros
                </Button>
              </div>
            </div>

            {/* Tabla similar a la imagen */}
            <div className="overflow-x-auto rounded-lg shadow-sm">
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Código</TableHead>
                    <TableHead className="px-4 py-3">Nombre</TableHead>
                    <TableHead className="px-4 py-3">Descripción</TableHead>
                    <TableHead className="px-4 py-3">Cantidad de Módulos</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && (filteredPerfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay perfiles disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPerfiles.map((perfil: Perfil, index: number) => (
                      <TableRow key={perfil.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-perfil">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(perfil)}
                                      aria-label="Editar perfil"
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Can>
                            {perfil.activo ? (
                              <Can action="accion-inactivar-perfil">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Inactivar perfil"
                                            className="h-8 w-8"
                                          >
                                            <Lock className="h-4 w-4 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Inactivar perfil?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta acción inactivará el perfil y no podrá ser usado hasta que se reactive. ¿Estás seguro?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(perfil.id)}>
                                            Sí, inactivar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Inactivar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              </Can>
                            ) : (
                              <>
                                <Can action="accion-eliminar-perfil">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Eliminar perfil"
                                              className="h-8 w-8"
                                            >
                                              <Trash2 className="h-4 w-4 text-rose-600 hover:text-rose-800 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Eliminar perfil?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción eliminará el perfil de forma permanente. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deletePerfilPermanentMutation.mutate(perfil.id)}>
                                                Sí, eliminar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Eliminar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                                <Can action="accion-activar-perfil">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              aria-label="Activar perfil"
                                              className="h-8 w-8"
                                            >
                                              <CheckCircle className="h-4 w-4 text-brand-lime hover:text-brand-lime/80 transition-colors" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>¿Activar perfil?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Esta acción reactivará el perfil y estará disponible para su uso. ¿Estás seguro?
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => activatePerfilMutation.mutate(perfil.id)}>
                                                Sí, activar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Activar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">{String(perfil.id).padStart(3, '0')}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">{perfil.nombre}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500">{perfil.descripcion || 'N/A'}</TableCell>
                        <TableCell className="px-4 py-3 text-center font-bold text-cyan-700">
                          <div className="flex items-center justify-center gap-2">
                            <span>{perfil.modulos_count}</span>
                            <Can action="accion-ver-modulos-perfil">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleViewModules(perfil)}
                                      aria-label="Ver módulos"
                                      className="h-6 w-6"
                                    >
                                      <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ver Módulos Asignados</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Can>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant={perfil.activo ? "default" : "secondary"} className={perfil.activo ? "bg-brand-lime/10 text-brand-lime border-brand-lime/20" : "bg-gray-200 text-gray-600 border-gray-300"}>
                            {perfil.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Modal para crear/editar perfiles */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingPerfil(null);
                  form.reset({
                    codigo: perfiles.length + 1,
                    nombre: "",
                    descripcion: "",
                    permisos: []
                  });
                }}
                className="hidden"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPerfil ? 'Editar Perfil' : 'Registro de Perfiles'}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="codigo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={String(field.value).padStart(2, '0')}
                              disabled
                              className="bg-red-50 text-red-600 font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del perfil" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Nuevo formulario de permisos */}
                  <PermissionsForm
                    selectedPermissions={form.watch('permisos') || []}
                    onPermissionsChange={(permissions) => {
                      form.setValue('permisos', permissions);
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción del perfil..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingPerfil(null);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Can action={editingPerfil ? "accion-actualizar-perfil" : "accion-crear-perfil"}>
                      <Button
                        type="submit"
                        className="bg-brand-lime hover:bg-brand-lime/90 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
                        disabled={savePerfilMutation.isPending}
                      >
                        {savePerfilMutation.isPending ?
                          (editingPerfil ? 'Actualizando...' : 'Guardando...') :
                          (editingPerfil ? 'Actualizar' : 'Guardar')
                        }
                      </Button>
                    </Can>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="vistas" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingPerfil ? 'Editar Perfil' : 'Registro de Perfil'}
            </h2>
          </div>

          {/* Formulario de perfil en el tab de vistas */}
          <Card>
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="codigo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={String(field.value).padStart(2, '0')}
                              disabled
                              className="bg-red-50 text-red-600 font-semibold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del perfil" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Formulario de permisos */}
                  <PermissionsForm
                    selectedPermissions={form.watch('permisos') || []}
                    onPermissionsChange={(permissions) => {
                      form.setValue('permisos', permissions);
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción del perfil..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveTab("perfiles");
                        setEditingPerfil(null);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Can action={editingPerfil ? "accion-actualizar-perfil" : "accion-crear-perfil"}>
                      <Button
                        type="submit"
                        className="bg-brand-lime hover:bg-brand-lime/90 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
                        disabled={savePerfilMutation.isPending}
                      >
                        {savePerfilMutation.isPending ?
                          (editingPerfil ? 'Actualizando...' : 'Guardando...') :
                          (editingPerfil ? 'Actualizar' : 'Guardar')
                        }
                      </Button>
                    </Can>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Resumen estadístico */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Estadístico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{mockSystemViews.length}</div>
                  <div className="text-sm text-gray-600">Vistas Totales</div>
                </div>
                            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">
                    {mockSystemViews.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'visualizacion').length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Acciones de Vista</div>
                </div>
                <div className="text-center p-3 bg-brand-lime/10 rounded-lg">
                  <div className="text-2xl font-bold text-brand-lime">
                    {mockSystemViews.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'creacion').length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Acciones de Creación</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {mockSystemViews.reduce((sum, v) => sum + v.acciones.filter(a => a.tipo === 'edicion').length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Acciones de Edición</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Componente de Gestión Avanzada de Perfiles */}
      <AdvancedProfileManager
        open={isAdvancedModalOpen}
        onOpenChange={setIsAdvancedModalOpen}
        onProfileCreated={handleAdvancedProfileCreated}
      />

      {/* Modal para ver módulos asignados */}
      <Dialog open={isModulesModalOpen} onOpenChange={setIsModulesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Módulos Asignados a: {selectedProfileForModules?.nombre}</DialogTitle>
            <DialogDescription>
              Estos son los módulos que tiene asignados este perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {viewingModules && viewingModules.length > 0 ? (
              <ul className="space-y-2">
                {viewingModules.map((modulo, index) => (
                  <li key={index} className="flex items-center gap-3 rounded-md border bg-gray-50 p-3">
                    <PackageOpen className="h-5 w-5 text-cyan-600" />
                    <span className="font-medium text-gray-800">{modulo.modulo_nombre}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500">No hay módulos asignados a este perfil.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModulesModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};



export default PerfilesPage;