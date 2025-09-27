import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search, Shield, Save, RefreshCw, Loader2, Lock, CheckCircle, Eye, X, Settings, Pause, Play, Trash, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoading } from "@/contexts/LoadingContext";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useModulos } from "@/hooks/useModulos";
import { Modulo, ModuloPermiso } from "@/services/modulosService";
import { useRegisterView } from "@/hooks/useRegisterView";
import { Can } from "@/contexts/PermissionsContext";
import { supabase } from "@/services/supabaseClient";

// Esquema de validación para módulos
const moduloSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
});

// Esquema de validación para permisos
const permisoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  code: z.string().min(1, "El código es requerido"),
  descripcion: z.string().optional(),
});

type ModuloForm = z.infer<typeof moduloSchema>;
type PermisoForm = z.infer<typeof permisoSchema>;

const PermisosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"modulos" | "registro">("modulos");
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);
  const [editingPermiso, setEditingPermiso] = useState<ModuloPermiso | null>(null);
  const [showPermisoModal, setShowPermisoModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [moduloParaConfigurar, setModuloParaConfigurar] = useState<Modulo | null>(null);
  const [permisosDelModulo, setPermisosDelModulo] = useState<ModuloPermiso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [moduloParaEliminar, setModuloParaEliminar] = useState<Modulo | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const queryClient = useQueryClient();

  // Registrar vista y acciones
  const { addAction } = useRegisterView('Permisos', 'listado', 'Listado de Módulos y Permisos');
  const { addAction: addActionForm } = useRegisterView('Permisos', 'formulario', 'Formulario de Módulo');

  // Registrar acciones del listado
  React.useEffect(() => {
    addAction('accion-crear-modulo', 'Crear módulo');
    addAction('accion-editar-modulo', 'Editar módulo');
    addAction('accion-activar-modulo', 'Activar módulo');
    addAction('accion-inactivar-modulo', 'Inactivar módulo');
    addAction('accion-eliminar-modulo', 'Eliminar módulo');
    addAction('accion-agregar-permiso', 'Agregar permiso');
    addAction('accion-editar-permiso', 'Editar permiso');
    addAction('accion-eliminar-permiso', 'Eliminar permiso');
    addAction('accion-configurar-permisos', 'Configurar permisos');
  }, [addAction]);

  // Registrar acciones del formulario
  React.useEffect(() => {
    addActionForm('accion-guardar-modulo', 'Guardar módulo');
    addActionForm('accion-cancelar-modulo', 'Cancelar edición de módulo');
    addActionForm('accion-guardar-permiso', 'Guardar permiso');
    addActionForm('accion-cancelar-permiso', 'Cancelar edición de permiso');
  }, [addActionForm]);

  const {
    modulos,
    modulosConPermisos,
    isLoading,
    createModulo,
    updateModulo,
    activateModulo,
    deactivateModulo,
    deleteModulo,
    createModuloPermiso,
    updateModuloPermiso,
    deleteModuloPermiso,
    isCreating,
    isUpdating,
    isCreatingPermiso,
    isUpdatingPermiso
  } = useModulos();

  // Formulario para módulos
  const moduloForm = useForm<ModuloForm>({
    resolver: zodResolver(moduloSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  // Formulario para permisos
  const permisoForm = useForm<PermisoForm>({
    resolver: zodResolver(permisoSchema),
    defaultValues: {
      nombre: "",
      code: "",
      descripcion: "",
    },
  });

  // Filtrado de módulos
  const modulosFiltrados = useMemo(() => {
    return modulos.filter(modulo => {
      const matchesSearch =
        modulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (modulo.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true :
          statusFilter === "active" ? modulo.activo :
            !modulo.activo;

      return matchesSearch && matchesStatus;
    });
  }, [modulos, searchTerm, statusFilter]);

  // Cargar datos
  React.useEffect(() => {
    // Cargar módulos
    queryClient.prefetchQuery({
      queryKey: ['modulos'],
      queryFn: () => modulosConPermisos || [],
    });
  }, [queryClient, modulosConPermisos]);

  // Handlers para módulos
  const handleCrearModulo = async (data: ModuloForm) => {
    try {
      startLoading();
      // 1) Crear o actualizar módulo primero
      let moduloId = editingModulo?.id;
      if (editingModulo) {
        const updated: any = await updateModulo({ id: editingModulo.id, data });
        moduloId = updated?.id ?? editingModulo.id;
      } else {
        const created: any = await createModulo(data);
        moduloId = created?.id;
      }

      if (!moduloId) {
        toast({ title: 'Error', description: 'No se pudo determinar el ID del módulo', variant: 'destructive' });
        return;
      }

      toast({
        title: editingModulo ? 'Módulo actualizado' : 'Módulo creado',
        description: 'Se guardó el módulo exitosamente.',
      });

      // Reset UI
      setEditingModulo(null);
      setPermisosDelModulo([]);
      moduloForm.reset();
      setActiveTab('modulos'); // Solo aquí se redirige al listado
      queryClient.invalidateQueries({ queryKey: ['modulos'] });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'No se pudo guardar', variant: 'destructive' });
    } finally {
      stopLoading();
    }
  };

  const handleCrearPermisoModal = async (data: PermisoForm) => {
    try {
      startLoading();
      // Crear el nuevo permiso
      await createModuloPermiso({
        ...data,
        modulo_id: moduloParaConfigurar?.id || 0,
      });

      // Agregar el nuevo permiso a la lista de disponibles (simulado)
      const nuevoPermiso: ModuloPermiso = {
        id: Date.now(), // ID temporal
        ...data,
        activo: true,
        modulo_id: moduloParaConfigurar?.id || 0,
      };
      // setPermisosDisponibles(prev => [...prev, nuevoPermiso]); // Eliminado
      
      // Agregar el nuevo permiso a la lista del módulo
      setPermisosDelModulo(prev => [...prev, nuevoPermiso]);
      
      toast({
        title: 'Permiso creado',
        description: 'El nuevo permiso se creó exitosamente.',
      });

      // Solo resetear el formulario, mantener el modal abierto
      permisoForm.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo crear el permiso',
        variant: 'destructive',
      });
    } finally {
      stopLoading();
    }
  };

  const handleEditarModulo = (modulo: Modulo) => {
    setEditingModulo(modulo);
    moduloForm.reset({
      nombre: modulo.nombre,
      descripcion: modulo.descripcion || "",
    });
    setActiveTab("registro");
  };

  const handleConfigurarPermisos = async (modulo: Modulo) => {
    setModuloParaConfigurar(modulo);
    setShowConfigModal(true);
    
    // Cargar los permisos asociados al módulo
    try {
      const permisos = await queryClient.fetchQuery({
        queryKey: ['modulo-permisos', modulo.id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('gen_modulo_permisos')
            .select('*')
            .eq('modulo_id', modulo.id)
            .eq('activo', true);
          
          if (error) throw error;
          return data || [];
        }
      });
      
      setPermisosDelModulo(permisos);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setPermisosDelModulo([]);
    }
  };

  const handleToggleEstado = async (modulo: Modulo) => {
    if (modulo.activo) {
      await deactivateModulo(modulo.id);
    } else {
      await activateModulo(modulo.id);
    }
    // No es necesario invalidar la consulta de modulos aquí, ya que la tabla ya muestra el estado actual
  };

  const handleEliminarModulo = (modulo: Modulo) => {
    setModuloParaEliminar(modulo);
    setShowDeleteConfirmModal(true);
  };

  const confirmarEliminacionModulo = async () => {
    if (!moduloParaEliminar) return;
    
    try {
      startLoading();
      await deleteModulo(moduloParaEliminar.id);
      toast({
        title: "✅ Módulo eliminado",
        description: `El módulo "${moduloParaEliminar.nombre}" y todos sus permisos han sido eliminados exitosamente.`,
        variant: "default",
      });
      setShowDeleteConfirmModal(false);
      setModuloParaEliminar(null);
    } catch (error: any) {
      toast({
        title: "❌ Error al eliminar módulo",
        description: error.message || "Hubo un error al eliminar el módulo",
        variant: "destructive",
      });
    } finally {
      stopLoading();
    }
  };

  // Handlers para permisos
  const handleCrearPermiso = (data: PermisoForm) => {
    if (!editingModulo) return;
    
    // Operar solo en memoria. Al guardar módulo se sincroniza en BD
    if (editingPermiso) {
      // Actualizar permiso existente en memoria - AQUÍ se modifica la tabla
      setPermisosDelModulo(prev => prev.map(p => {
        if (p.id === editingPermiso.id) {
          const next: any = { ...p, ...data };
          if ((p as any)._status !== 'new') next._status = 'updated';
          return next;
        }
        return p;
      }));
    } else {
      // Crear nuevo permiso en memoria
      const temp: any = { 
        id: undefined, 
        nombre: data.nombre, 
        code: data.code, 
        descripcion: data.descripcion, 
        activo: true, 
        _status: 'new' 
      };
      setPermisosDelModulo(prev => [...prev, temp]);
    }
    
    // Reset del formulario y estado del permiso, pero mantener el módulo activo
    permisoForm.reset();
    setEditingPermiso(null);
    // NO se cambia el activeTab, se mantiene en "registro"
  };

  const handleEditarPermiso = (permiso: ModuloPermiso) => {
    // Solo cargar los datos en el formulario para edición
    setEditingPermiso(permiso);
    permisoForm.reset({
      nombre: permiso.nombre || "",
      code: permiso.code || "",
      descripcion: permiso.descripcion || "",
    });
    // NO se modifica permisosDelModulo, solo se prepara el formulario
  };

  const handleEliminarPermiso = async (id: number) => {
    // Solo marcar como eliminado. Si era nuevo sin id, quitarlo
    setPermisosDelModulo(prev => prev.filter(p => {
      if (!p.id && (p as any)._status === 'new') return p.id !== undefined; // remove new without id
      if (p.id === id) {
        (p as any)._status = 'deleted';
      }
      return true;
    }));
  };

  const handleCancelarModulo = () => {
    setEditingModulo(null);
    setPermisosDelModulo([]);
    setEditingPermiso(null);
    moduloForm.reset();
    permisoForm.reset();
    setActiveTab("modulos");
  };

  const handleCancelarPermiso = () => {
    setEditingPermiso(null);
    permisoForm.reset();
  };

  const handleQuitarPermiso = (permisoId: number) => {
    // Esta función se usará en el modal de configuración
    setPermisosDelModulo(prev => prev.filter(p => p.id !== permisoId));
  };

  // Efectos para limpiar formularios después de operaciones exitosas
  React.useEffect(() => {
    if (isCreating || isUpdating) {
      setEditingModulo(null);
      setPermisosDelModulo([]);
      moduloForm.reset();
      setActiveTab("modulos");
    }
  }, [isCreating, isUpdating]);

  // Efectos para limpiar solo el formulario de permisos
  React.useEffect(() => {
    if (isCreatingPermiso || isUpdatingPermiso) {
      // Solo limpiar el estado del permiso, NO el módulo
      setEditingPermiso(null);
      permisoForm.reset();
      // NO cambiar activeTab, mantener en "registro"
    }
  }, [isCreatingPermiso, isUpdatingPermiso]);

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Shield className="w-8 h-8 text-cyan-600" />
          Gestión de Permisos
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "modulos" | "registro")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="modulos"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Módulos
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Módulo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modulos" className="mt-6">
          {/* Header */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">MÓDULOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-modulo">
                  <Button
                    onClick={() => {
                      setEditingModulo(null);
                      moduloForm.reset();
                      setActiveTab("registro");
                    }}
                    className="bg-brand-lime hover:bg-brand-lime/90"
                    size="sm"
                  >
                    Agregar Nuevo
                  </Button>
                </Can>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-cyan-50 rounded-lg mb-4 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="min-w-[180px]">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Solo activos</SelectItem>
                    <SelectItem value="inactive">Solo inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabla de módulos */}
            <div className="relative overflow-x-auto rounded-lg shadow-sm">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin h-10 w-10 text-cyan-600" />
                    <span className="text-cyan-700 font-semibold">Cargando módulos...</span>
                  </div>
                </div>
              )}
              <Table className="min-w-[800px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Nombre</TableHead>
                    <TableHead className="px-4 py-3">Descripción</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && (modulosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No hay módulos disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    modulosFiltrados.map((modulo) => (
                      <TableRow key={modulo.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-modulo">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditarModulo(modulo)}
                                      aria-label="Editar módulo"
                                    >
                                      <Edit className="h-5 w-5 text-cyan-600 hover:text-cyan-800 transition-colors" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Can>

                            <Can action="accion-configurar-permisos">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleConfigurarPermisos(modulo)}
                                      aria-label="Configurar permisos"
                                    >
                                      <Settings className="h-5 w-5 text-purple-600 hover:text-purple-800 transition-colors" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Configurar Permisos</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </Can>

                            <Can action="accion-activar-modulo">
                              {modulo.activo ? (
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Inactivar módulo"
                                          >
                                            <Lock className="h-5 w-5 text-yellow-600 hover:text-yellow-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Inactivar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Inactivar módulo?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas inactivar el módulo{" "}
                                        <strong>{modulo.nombre}</strong>?
                                        El módulo no estará disponible hasta que sea reactivado.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleToggleEstado(modulo)}
                                      >
                                        Inactivar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Activar módulo"
                                          >
                                            <Play className="h-5 w-5 text-green-600 hover:text-green-800 transition-colors" />
                                          </Button>
                                        </AlertDialogTrigger>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Activar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Activar módulo?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas activar el módulo{" "}
                                        <strong>{modulo.nombre}</strong>?
                                        El módulo estará disponible nuevamente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleToggleEstado(modulo)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        Activar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </Can>

                            <Can action="accion-eliminar-modulo">
                              {!modulo.activo && (
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Eliminar módulo"
                                          >
                                            <Trash className="h-5 w-5 text-red-600 hover:text-red-800 transition-colors" />
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
                                      <AlertDialogTitle>¿Eliminar módulo?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas eliminar permanentemente el módulo{" "}
                                        <strong>{modulo.nombre}</strong>?
                                        Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleEliminarModulo(modulo)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </Can>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">
                          {modulo.nombre}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900">
                          {modulo.descripcion}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            variant={modulo.activo ? "default" : "secondary"}
                            className={
                              modulo.activo
                                ? "bg-brand-lime/10 text-brand-lime"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {modulo.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registro" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <Form {...moduloForm}>
                <form onSubmit={moduloForm.handleSubmit(handleCrearModulo)} className="space-y-6">
                   {/* Información del Módulo */}
                   <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                     <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                       <Shield className="w-5 h-5 text-cyan-600" />
                       Información del Módulo
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField
                         control={moduloForm.control}
                         name="nombre"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Nombre *</FormLabel>
                             <FormControl>
                               <Input placeholder="Nombre del módulo" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                         control={moduloForm.control}
                         name="descripcion"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Descripción</FormLabel>
                             <FormControl>
                               <Textarea placeholder="Descripción del módulo" {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                   </div>

                   {/* Botones de acción */}
                   <div className="flex justify-end gap-2">
                     <Can action="accion-cancelar-modulo">
                       <Button
                         type="button"
                         variant="outline"
                         onClick={handleCancelarModulo}
                       >
                         Cancelar
                       </Button>
                     </Can>
                     <Can action="accion-guardar-modulo">
                       <Button
                         type="submit"
                         disabled={isCreating || isUpdating}
                       >
                         {editingModulo ? "Actualizar" : "Crear"}
                       </Button>
                     </Can>
                   </div>
                 </form>
               </Form>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

      {/* Modal para crear nuevo permiso */}
      {showPermisoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Crear Nuevo Permiso</h3>
            <Form {...permisoForm}>
              <form onSubmit={permisoForm.handleSubmit(handleCrearPermisoModal)} className="space-y-4">
                <FormField
                  control={permisoForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del permiso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={permisoForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código *</FormLabel>
                      <FormControl>
                        <Input placeholder="Código único" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={permisoForm.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción del permiso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPermisoModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreatingPermiso || isUpdatingPermiso}>
                    {isCreatingPermiso || isUpdatingPermiso ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Modal de configuración de permisos */}
      {showConfigModal && moduloParaConfigurar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                Configuración de Permisos: {moduloParaConfigurar.nombre}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConfigModal(false)}
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5 text-gray-600 hover:text-gray-800 transition-colors" />
              </Button>
            </div>

            {/* Formulario para agregar nuevo permiso - Una fila */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Nuevo Permiso</h4>
              <Form {...permisoForm}>
                <form onSubmit={permisoForm.handleSubmit(handleCrearPermisoModal)} className="flex gap-4 items-end">
                  <FormField
                    control={permisoForm.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Nombre *</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={permisoForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Código *</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={permisoForm.control}
                    name="descripcion"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Descripción</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-9" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-brand-lime hover:bg-brand-lime/90 text-white h-9 px-4 flex items-center gap-2 shadow-sm"
                    disabled={isCreatingPermiso || isUpdatingPermiso}
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Permiso
                  </Button>
                </form>
              </Form>
            </div>

            {/* Tabla de permisos asociados */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Permisos Asociados</h4>
              <div className="bg-white rounded-lg border shadow-sm">
                <div className="relative overflow-x-auto rounded-lg">
                  <Table className="min-w-[800px] w-full text-xs">
                    <TableHeader className="bg-cyan-50">
                      <TableRow className="text-left font-semibold text-gray-700">
                        <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                        <TableHead className="px-4 py-3">Nombre</TableHead>
                        <TableHead className="px-4 py-3">Código</TableHead>
                        <TableHead className="px-4 py-3">Descripción</TableHead>
                        <TableHead className="px-4 py-3">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permisosDelModulo.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                            No hay permisos asociados a este módulo
                          </TableCell>
                        </TableRow>
                      ) : (
                        permisosDelModulo.map((permiso) => (
                          <TableRow key={permiso.id} className="hover:bg-gray-50">
                            <TableCell className="px-2 py-1">
                              <div className="flex flex-row gap-1 items-center">
                                <Can action="accion-eliminar-permiso">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleQuitarPermiso(permiso.id)}
                                          aria-label="Eliminar permiso"
                                        >
                                          <Trash className="h-5 w-5 text-red-600 hover:text-red-800 transition-colors" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Eliminar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Can>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-2 text-sm text-gray-900">
                              {permiso.nombre}
                            </TableCell>
                            <TableCell className="px-4 py-2 text-sm text-gray-900">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {permiso.code}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-2 text-sm text-gray-900">
                              {permiso.descripcion || "-"}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <Badge
                                variant={permiso.activo ? "default" : "secondary"}
                                className={
                                  permiso.activo
                                    ? "bg-brand-lime/10 text-brand-lime text-xs"
                                    : "bg-gray-100 text-gray-800 text-xs"
                                }
                              >
                                {permiso.activo ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar módulo */}
      <AlertDialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Eliminación de Módulo
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  ADVERTENCIA CRÍTICA
                </div>
                <p className="text-red-700 text-sm">
                  Al eliminar el módulo <strong>"{moduloParaEliminar?.nombre}"</strong> se eliminarán <strong>TODOS los permisos asociados</strong>.
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                  <Info className="h-4 w-4" />
                  IMPACTO
                </div>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Todos los permisos del módulo serán eliminados permanentemente</li>
                  <li>• Los roles que tengan estos permisos perderán acceso a las funcionalidades</li>
                  <li>• Esta acción no se puede deshacer</li>
                </ul>
              </div>
              <p className="text-gray-600">
                ¿Estás completamente seguro de que deseas continuar con esta eliminación?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setModuloParaEliminar(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarEliminacionModulo}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sí, Eliminar Módulo y Permisos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PermisosPage;
