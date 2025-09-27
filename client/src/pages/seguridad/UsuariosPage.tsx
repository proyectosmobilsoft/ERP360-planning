import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search, Users, Save, RefreshCw, Loader2, Lock, CheckCircle, User, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/ui/multi-select";
import { PasswordStrength } from "@/components/ui/password-strength";
import { rolesService } from "@/services/rolesService";
import { empresasService, Empresa } from "@/services/empresasService";
import { usuariosService, UsuarioData } from "@/services/usuariosService";
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
import { Can } from "@/contexts/PermissionsContext";

// Esquema de validación para crear/editar usuario (usa isEditing para reglas de contraseña)
const crearUsuarioSchema = z.object({
  identificacion: z.string().min(1, "La identificación es requerida"),
  primer_nombre: z.string().min(1, "El primer nombre es requerido"),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().min(1, "El primer apellido es requerido"),
  segundo_apellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "El username debe tener al menos 3 caracteres"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  perfilIds: z.array(z.number()).min(1, "Debe seleccionar al menos un perfil"),
  empresaIds: z.array(z.number()).optional(),
  foto_base64: z.string().optional(),
  isEditing: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const isEditing = !!data.isEditing;
  const pwd = data.password || "";
  const confirm = data.confirmPassword || "";
  if (!isEditing) {
    if (!pwd) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña es requerida" });
      return;
    }
    if (pwd.length < 8) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe tener al menos 8 caracteres" });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número" });
    if (confirm !== pwd) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
  } else {
    if (pwd) {
      if (pwd.length < 8) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe tener al menos 8 caracteres" });
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número" });
      if (confirm !== pwd) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
    }
  }
});

// Esquema para editar usuario (password opcional)
const editarUsuarioSchema = z.object({
  identificacion: z.string().min(1, "La identificación es requerida"),
  primer_nombre: z.string().min(1, "El primer nombre es requerido"),
  segundo_nombre: z.string().optional(),
  primer_apellido: z.string().min(1, "El primer apellido es requerido"),
  segundo_apellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "El username debe tener al menos 3 caracteres"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "La contraseña debe contener al menos una letra mayúscula, una minúscula y un número")
    .or(z.literal(""))
    .optional(),
  confirmPassword: z.string().optional(),
  perfilIds: z.array(z.number()).min(1, "Debe seleccionar al menos un perfil"),
  empresaIds: z.array(z.number()).optional(),
  foto_base64: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== "") {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;
type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

interface Perfil {
  id: number;
  nombre: string;
  descripcion?: string;
}

// INTERFAZ DE USUARIO CON LA ESTRUCTURA CORRECTA DE SUPABASE
interface Usuario {
  id: number;
  identificacion?: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  telefono?: string;
  email: string;
  username: string;
  activo: boolean;
  foto_base64?: string;
  gen_usuario_roles: Array<{ id: number; rol_id: number; created_at: string; gen_roles: { id: number; nombre: string } }>;
  gen_usuario_empresas: Array<{ id: number; empresa_id: number; created_at: string; empresas: { id: number; razon_social: string } }>;
}

const UsuariosPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [perfilFilter, setPerfilFilter] = useState<"all" | number>("all");
  const [activeTab, setActiveTab] = useState("usuarios");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const queryClient = useQueryClient();

  // Función para asignar colores diferentes a cada perfil
  const getPerfilColor = (perfilId: number) => {
    const colors = [
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-green-50 text-green-700 border-green-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-pink-50 text-pink-700 border-pink-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-teal-50 text-teal-700 border-teal-200",
      "bg-red-50 text-red-700 border-red-200",
      "bg-yellow-50 text-yellow-700 border-yellow-200",
      "bg-cyan-50 text-cyan-700 border-cyan-200",
    ];
    return colors[perfilId % colors.length];
  };

  // Query para obtener usuarios desde Supabase
  const { data: usuarios = [], isLoading, refetch } = useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: usuariosService.listUsuarios,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Query para obtener perfiles activos
  const { data: perfilesActivos = [], isLoading: perfilesLoading } = useQuery<Perfil[]>({
    queryKey: ["perfilesActivos"],
    queryFn: rolesService.listActiveRoles,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obtener empresas
  const { data: empresas = [], isLoading: empresasLoading } = useQuery<Empresa[]>({
    queryKey: ["empresas"],
    queryFn: empresasService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Formulario para crear usuario
  const form = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      identificacion: "",
      primer_nombre: "",
      segundo_nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      telefono: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      perfilIds: [],
      empresaIds: [],
      foto_base64: "",
      isEditing: false,
    },
  });

  // Mutaciones
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      startLoading();
      try {
        const { password, perfilIds, empresaIds, ...userData } = data;
        return await usuariosService.createUsuario(userData, password, perfilIds, empresaIds);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      form.reset();
      setActiveTab("usuarios");
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear usuario",
        description: error.message || "Hubo un error al crear el usuario",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: EditarUsuarioForm) => {
      startLoading();
      try {
        const { password, perfilIds, empresaIds, ...userData } = data;
        return await usuariosService.updateUsuario(
          userData.id, 
          userData, 
          perfilIds || [], 
          empresaIds || [], 
          password
        );
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setEditingUser(null);
      setActiveTab("usuarios");
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message || "Hubo un error al actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await usuariosService.deleteUsuarioPermanent(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar usuario",
        description: error.message || "Hubo un error al eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const activateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await usuariosService.activateUsuario(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Usuario activado",
        description: "El usuario ha sido activado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al activar usuario",
        description: error.message || "Hubo un error al activar el usuario",
        variant: "destructive",
      });
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      startLoading();
      try {
        return await usuariosService.deactivateUsuario(id);
      } finally {
        stopLoading();
      }
    },
    onSuccess: () => {
      toast({
        title: "Usuario desactivado",
        description: "El usuario ha sido desactivado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al desactivar usuario",
        description: error.message || "Hubo un error al desactivar el usuario",
        variant: "destructive",
      });
    },
  });

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const term = (searchTerm || "").toLowerCase();
      const matchesSearch =
        (usuario.primer_nombre || "").toLowerCase().includes(term) ||
        (usuario.primer_apellido || "").toLowerCase().includes(term) ||
        (usuario.email || "").toLowerCase().includes(term) ||
        (usuario.username || "").toLowerCase().includes(term) ||
        (usuario.identificacion || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ? true :
          statusFilter === "active" ? usuario.activo :
            !usuario.activo;

      const matchesPerfil =
        perfilFilter === "all" ? true :
          usuario.gen_usuario_roles?.some(rol => rol.rol_id === perfilFilter);

      return matchesSearch && matchesStatus && matchesPerfil;
    });
  }, [usuarios, searchTerm, statusFilter, perfilFilter]);

  // Handlers
  const handleEliminarUsuario = async (id: number) => {
    deleteUserMutation.mutate(id);
  };

  const handleActivarUsuario = async (id: number) => {
    activateUserMutation.mutate(id);
  };

  const handleInactivarUsuario = async (id: number) => {
    deactivateUserMutation.mutate(id);
  };

  const handleCrearUsuario = (data: CrearUsuarioForm) => {
    // Filtrar campos que no deben enviarse al backend
    const { confirmPassword, perfilIds, empresaIds, isEditing, ...userData } = data;
    const password = data.password;

    // Decidir si crear o actualizar basado en editingUser
    if (editingUser) {
      console.log('🔄 Editando usuario existente, llamando updateUserMutation');
      // Estamos editando un usuario existente
      const updateData = {
        ...userData,
        id: editingUser.id,
        password,
        perfilIds,
        empresaIds
      };
      updateUserMutation.mutate(updateData);
    } else {
      console.log('➕ Creando nuevo usuario, llamando createUserMutation');
      // Estamos creando un nuevo usuario
    createUserMutation.mutate({
      ...userData,
      password,
      perfilIds,
      empresaIds
    });
    }
  };

  const handleActualizarUsuario = (data: EditarUsuarioForm) => {
    updateUserMutation.mutate(data);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setEditingUser(usuario);
    form.reset({
      id: usuario.id,
      identificacion: usuario.identificacion || "",
      primer_nombre: usuario.primer_nombre,
      segundo_nombre: usuario.segundo_nombre || "",
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido || "",
      telefono: usuario.telefono || "",
      email: usuario.email,
      username: usuario.username,
      password: "",
      perfilIds: usuario.gen_usuario_roles?.map(r => r.rol_id) || [],
      empresaIds: usuario.gen_usuario_empresas?.map(e => e.empresa_id) || [],
      foto_base64: usuario.foto_base64 || "",
      isEditing: true,
    });
    setActiveTab("registro");
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-cyan-800 flex items-center gap-2 mb-2">
          <Users className="w-8 h-8 text-cyan-600" />
          Gestión de Usuarios
        </h1>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-cyan-100/60 p-1 rounded-lg">
          <TabsTrigger
            value="usuarios"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Listado de Usuarios
          </TabsTrigger>
          <TabsTrigger
            value="registro"
            className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all duration-300"
          >
            Registro de Usuario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-6">
          {/* Header similar a perfiles */}
          <div className="bg-white rounded-lg border">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-semibold text-gray-700">USUARIOS</span>
              </div>
              <div className="flex space-x-2">
                <Can action="accion-crear-usuario">
                <Button
                  onClick={() => {
                    setEditingUser(null);
                      // Vaciar completamente el formulario con valores por defecto
                      form.reset({
                        identificacion: "",
                        primer_nombre: "",
                        segundo_nombre: "",
                        primer_apellido: "",
                        segundo_apellido: "",
                        telefono: "",
                        email: "",
                        username: "",
                        password: "",
                        confirmPassword: "",
                        perfilIds: [],
                        empresaIds: [],
                        isEditing: false,
                      });
                    setActiveTab("registro");
                  }}
                    className="bg-brand-lime hover:bg-brand-lime/90"
                  size="sm"
                >
                  Adicionar Registro
                </Button>
                </Can>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="flex flex-wrap items-center gap-4 p-3 bg-cyan-50 rounded-lg mb-4 shadow-sm">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por nombre, email, username..."
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
              <div className="min-w-[180px]">
                <Select value={perfilFilter === "all" ? "all" : perfilFilter.toString()} onValueChange={(value) => setPerfilFilter(value === "all" ? "all" : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los perfiles</SelectItem>
                    {perfilesActivos.map(perfil => (
                      <SelectItem key={perfil.id} value={perfil.id.toString()}>
                        {perfil.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="relative overflow-x-auto rounded-lg shadow-sm">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin h-10 w-10 text-cyan-600" />
                    <span className="text-cyan-700 font-semibold">Cargando usuarios...</span>
                  </div>
                </div>
              )}
              <Table className="min-w-[900px] w-full text-xs">
                <TableHeader className="bg-cyan-50">
                  <TableRow className="text-left font-semibold text-gray-700">
                    <TableHead className="px-2 py-1 text-teal-600">Acciones</TableHead>
                    <TableHead className="px-4 py-3">Identificación</TableHead>
                    <TableHead className="px-4 py-3">Nombre Completo</TableHead>
                    <TableHead className="px-4 py-3">Username</TableHead>
                    <TableHead className="px-4 py-3">Teléfono</TableHead>
                    <TableHead className="px-4 py-3">Perfiles</TableHead>
                    <TableHead className="px-4 py-3">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && (usuariosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay usuarios disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <TableRow key={usuario.id} className="hover:bg-gray-50">
                        <TableCell className="px-2 py-1">
                          <div className="flex flex-row gap-1 items-center">
                            <Can action="accion-editar-usuario">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditarUsuario(usuario)}
                                    aria-label="Editar usuario"
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

                            {usuario.activo ? (
                              <Can action="accion-inactivar-usuario">
                              <AlertDialog>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label="Inactivar usuario"
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
                                    <AlertDialogTitle>¿Inactivar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Estás seguro de que deseas inactivar el usuario{" "}
                                      <strong>{usuario.primer_nombre} {usuario.primer_apellido}</strong>?
                                      El usuario no podrá acceder al sistema hasta que sea reactivado.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleInactivarUsuario(usuario.id)}
                                      className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                      Inactivar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </Can>
                            ) : (
                              <>
                              <Can action="accion-activar-usuario">
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Activar usuario"
                                          >
                                            <CheckCircle className="h-5 w-5 text-brand-lime hover:text-brand-lime/80 transition-colors" />
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
                                      <AlertDialogTitle>¿Activar usuario?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas activar el usuario{" "}
                                        <strong>{usuario.primer_nombre} {usuario.primer_apellido}</strong>?
                                        El usuario podrá acceder al sistema nuevamente.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleActivarUsuario(usuario.id)}
                                        className="bg-brand-lime hover:bg-brand-lime/90"
                                      >
                                        Activar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Can>
                              <Can action="accion-eliminar-usuario">
                                <AlertDialog>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Eliminar usuario"
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
                                      <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        ¿Estás seguro de que deseas eliminar permanentemente el usuario{" "}
                                        <strong>{usuario.primer_nombre} {usuario.primer_apellido}</strong>?
                                        Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleEliminarUsuario(usuario.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Eliminar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </Can>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.identificacion || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {`${usuario.primer_nombre} ${usuario.segundo_nombre || ""} ${usuario.primer_apellido} ${usuario.segundo_apellido || ""}`.trim()}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.username}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.telefono || "-"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-900">
                          {usuario.gen_usuario_roles && usuario.gen_usuario_roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                              {usuario.gen_usuario_roles.map((rol, index) => (
                              <Badge
                                  key={rol.id} 
                                variant="outline"
                                  className={`text-xs ${getPerfilColor(rol.rol_id)}`}
                              >
                                  {rol.gen_roles.nombre}
                              </Badge>
                              ))}
                          </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Badge
                            variant={usuario.activo ? "default" : "secondary"}
                            className={
                              usuario.activo
                                ? "bg-brand-lime/10 text-brand-lime"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {usuario.activo ? "Activo" : "Inactivo"}
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

        <TabsContent value="registro" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCrearUsuario)} className="space-y-6">
                  {/* Foto de perfil */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-2">
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <ImagePlus className="w-5 h-5 text-cyan-600" />
                      Foto de perfil
                    </h3>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center">
                        {form.watch('foto_base64') ? (
                          <img src={form.watch('foto_base64') as unknown as string} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => form.setValue('foto_base64', String(reader.result));
                            reader.readAsDataURL(file);
                          }}
                          className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                        />
                        {form.watch('foto_base64') && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue('foto_base64', "")} className="text-red-600 hover:text-red-700">
                            Quitar foto
                          </Button>
                        )}
                        <input type="hidden" {...form.register('foto_base64')} />
                        <p className="text-xs text-gray-500">Formatos recomendados: JPG, PNG. Tamaño sugerido: 400x400.</p>
                      </div>
                    </div>
                  </div>
                  {/* Datos Personales */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-600" />
                      Datos Personales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="identificacion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Identificación *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de identificación" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="primer_nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primer Nombre *</FormLabel>
                            <FormControl>
                              <Input placeholder="Primer nombre" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="segundo_nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segundo Nombre</FormLabel>
                            <FormControl>
                              <Input placeholder="Segundo nombre (opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="primer_apellido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primer Apellido *</FormLabel>
                            <FormControl>
                              <Input placeholder="Primer apellido" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="segundo_apellido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segundo Apellido</FormLabel>
                            <FormControl>
                              <Input placeholder="Segundo apellido (opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                              <Input placeholder="Número de teléfono" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Credenciales de Acceso */}
                  <div className="p-4 border rounded-lg bg-slate-50 mb-4">
                    <h3 className="text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-cyan-600" />
                      Credenciales de Acceso
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre de usuario"
                                autoComplete="off"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!editingUser && (
                        <>
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contraseña *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Contraseña"
                                    autoComplete="new-password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                                {field.value && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${field.value.length >= 8 ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${field.value.length >= 8 ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Mínimo 8 caracteres
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(field.value) ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${/[a-z]/.test(field.value) ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Al menos una letra minúscula
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(field.value) ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${/[A-Z]/.test(field.value) ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Al menos una letra mayúscula
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${/\d/.test(field.value) ? 'bg-brand-lime' : 'bg-gray-300'}`} />
                                      <span className={`text-xs ${/\d/.test(field.value) ? 'text-brand-lime' : 'text-gray-500'}`}>
                                        Al menos un número
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => {
                              const password = form.watch("password");
                              const isMatch = field.value === password && field.value !== "";
                              return (
                                <FormItem>
                                  <FormLabel>Confirmar Contraseña *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="password"
                                      placeholder="Confirmar contraseña"
                                      autoComplete="new-password"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  {field.value && password && (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isMatch ? 'bg-brand-lime' : 'bg-red-500'}`} />
                                        <span className={`text-xs ${isMatch ? 'text-brand-lime' : 'text-red-600'}`}>
                                          {isMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </FormItem>
                              );
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Perfiles y Empresas */}
                  <div className="p-4 border rounded-lg bg-cyan-50 mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-600" />
                      Asignaciones
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="perfilIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Perfiles *</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={perfilesActivos.map(perfil => ({
                                  id: perfil.id,
                                  value: perfil.id.toString(),
                                  label: perfil.nombre
                                }))}
                                selected={field.value || []}
                                onSelectionChange={(selected) => {
                                  field.onChange(selected);
                                }}
                                placeholder="Seleccionar perfiles..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="empresaIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresas asociadas</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={empresas.map(empresa => ({
                                  id: empresa.id!,
                                  value: empresa.id!.toString(),
                                  label: empresa.razon_social
                                }))}
                                selected={field.value || []}
                                onSelectionChange={(selected) => {
                                  field.onChange(selected);
                                }}
                                placeholder="Seleccionar empresas..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveTab("usuarios");
                        setEditingUser(null);
                        form.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Can action={editingUser ? "accion-actualizar-usuario" : "accion-crear-usuario"}>
                    <Button
                      type="submit"
                        className="bg-brand-lime hover:bg-brand-lime/90 text-white border-0 shadow-sm px-6 py-2 rounded text-sm font-medium transition-colors"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ?
                        (editingUser ? 'Actualizando...' : 'Guardando...') :
                        (editingUser ? 'Actualizar' : 'Guardar')
                      }
                    </Button>
                    </Can>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
</Tabs>
</div>
);
};

export default UsuariosPage;