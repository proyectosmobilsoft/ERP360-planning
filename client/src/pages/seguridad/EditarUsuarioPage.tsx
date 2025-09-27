import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, UserCheck, ImagePlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usuariosService, UsuarioData } from "@/services/usuariosService";
import { rolesService } from "@/services/rolesService";
import { useLocation, useParams } from "wouter";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { Checkbox } from "@/components/ui/checkbox";

// Schema de validación para el formulario de edición
const editUsuarioSchema = z.object({
  identificacion: z.string().min(6, "Identificación debe tener al menos 6 caracteres"),
  primerNombre: z.string().min(2, "Primer nombre requerido"),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(2, "Primer apellido requerido"),
  segundoApellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Username debe tener al menos 3 caracteres"),
  password: z.string().optional().refine((password) => {
    if (!password || password === "") return true; // Permitir contraseña vacía (no cambiar)
    return password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  }, "Contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números"),
  perfilIds: z.array(z.number()).min(1, "Debe seleccionar al menos un perfil"),
  activo: z.boolean().default(true),
  foto_base64: z.string().optional(),
});

type FormData = z.infer<typeof editUsuarioSchema>;

interface Perfil {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface Usuario {
  id: number;
  identificacion: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono?: string;
  email: string;
  username: string;
  activo: boolean;
  perfiles: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
  foto_base64?: string;
}

const EditarUsuarioPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPerfiles, setSelectedPerfiles] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const params = useParams();
  const userId = parseInt(params.id || "0");

  // Función para limpiar errores de campos cuando el usuario comience a escribir
  const handleFieldChange = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Query para obtener el usuario
  const { data: usuario, isLoading: loadingUsuario } = useQuery<Usuario>({
    queryKey: ["usuario", userId],
    queryFn: async () => {
      const usuarios = await usuariosService.listUsuarios();
      const user = usuarios.find((u: any) => u.id === userId);
      if (!user) throw new Error("Usuario no encontrado");
      
      // Mapear los datos al formato esperado por el formulario
      return {
        id: user.id,
        identificacion: user.identificacion || "",
        primerNombre: user.primer_nombre,
        segundoNombre: user.segundo_nombre || "",
        primerApellido: user.primer_apellido,
        segundoApellido: user.segundo_apellido || "",
        telefono: user.telefono || "",
        email: user.email,
        username: user.username,
        activo: user.activo,
        perfiles: user.gen_usuario_roles?.map((ur: any) => ({
          id: ur.rol_id,
          nombre: ur.gen_roles?.nombre || "Sin nombre"
        })) || []
      };
    },
  });

  // Query para obtener perfiles disponibles
  const { data: perfiles = [], isLoading: loadingPerfiles } = useQuery<Perfil[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const roles = await rolesService.listRoles();
      return roles.map((rol: any) => ({
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion || ""
      }));
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(editUsuarioSchema),
    defaultValues: {
      identificacion: "",
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      telefono: "",
      email: "",
      username: "",
      password: "",
      perfilIds: [],
      activo: true,
    },
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = form;
  const passwordValue = watch("password");
  const fotoBase64 = watch("foto_base64");

  // Cargar datos del usuario cuando esté disponible
  useEffect(() => {
    if (usuario) {
      reset({
        identificacion: usuario.identificacion,
        primerNombre: usuario.primerNombre,
        segundoNombre: usuario.segundoNombre || "",
        primerApellido: usuario.primerApellido,
        segundoApellido: usuario.segundoApellido || "",
        telefono: usuario.telefono || "",
        email: usuario.email,
        username: usuario.username,
        password: "",
        perfilIds: usuario.perfiles.map(p => p.id),
        activo: usuario.activo,
        foto_base64: usuario.foto_base64 || "",
      });
      setSelectedPerfiles(usuario.perfiles.map(p => p.id));
    }
  }, [usuario, reset]);

  // Mutation para actualizar usuario
  const updateUsuarioMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('📝 Datos del formulario a actualizar:', data);
      console.log('🔍 Usuario ID:', userId);
      
      // Mapear los datos al formato esperado por el servicio
      const usuarioData: Partial<UsuarioData> = {
        identificacion: data.identificacion,
        primer_nombre: data.primerNombre,
        segundo_nombre: data.segundoNombre || undefined,
        primer_apellido: data.primerApellido,
        segundo_apellido: data.segundoApellido || undefined,
        telefono: data.telefono || undefined,
        email: data.email,
        username: data.username,
        activo: data.activo,
        foto_base64: data.foto_base64 || undefined,
      };
      
      console.log('📤 Datos mapeados para el servicio:', usuarioData);
      
      const password = data.password && data.password.trim() !== "" ? data.password : undefined;
      
      return await usuariosService.updateUsuario(
        userId,
        usuarioData,
        data.perfilIds || [],
        [], // empresaIds - por ahora vacío, se puede agregar después
        password
      );
    },
    onSuccess: () => {
      // Limpiar errores de campos
      setFieldErrors({});
      toast({
        title: "✅ Usuario actualizado exitosamente",
        description: "Los cambios han sido guardados correctamente.",
        className: "bg-cyan-50 border-cyan-200",
      });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["usuario", userId] });
      setLocation("/seguridad/usuarios");
    },
    onError: (error: any) => {
      console.error("Error completo:", error);
      
      // Extraer errores específicos de campos del mensaje de error
      const errorMessage = error.message || "";
      const newFieldErrors: {[key: string]: string} = {};
      
      // Detectar errores específicos por campo
      if (errorMessage.toLowerCase().includes("username") && errorMessage.toLowerCase().includes("ya está en uso")) {
        newFieldErrors.username = "Este nombre de usuario ya está en uso";
      }
      
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("ya está en uso")) {
        newFieldErrors.email = "Este correo electrónico ya está en uso";
      }
      
      if (errorMessage.toLowerCase().includes("identificacion") || errorMessage.toLowerCase().includes("identificación")) {
        newFieldErrors.identificacion = "Esta identificación ya está registrada";
      }
      
      // Si hay errores específicos de campos, marcarlos
      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(newFieldErrors);
        toast({
          title: "❌ Error de validación",
          description: "Por favor, corrige los campos marcados y vuelve a intentar.",
          variant: "destructive",
        });
      } else {
        // Error general
        toast({
          title: "❌ Error al actualizar usuario",
          description: errorMessage || "No se pudieron guardar los cambios. Verifica los datos e intenta nuevamente.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: FormData) => {
    const formDataWithPerfiles = {
      ...data,
      perfilIds: selectedPerfiles,
    };
    updateUsuarioMutation.mutate(formDataWithPerfiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setValue("foto_base64", String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => setValue("foto_base64", "");

  const handlePerfilChange = (perfilId: number, checked: boolean) => {
    let newSelectedPerfiles: number[];
    if (checked) {
      newSelectedPerfiles = [...selectedPerfiles, perfilId];
    } else {
      newSelectedPerfiles = selectedPerfiles.filter(id => id !== perfilId);
    }
    setSelectedPerfiles(newSelectedPerfiles);
    setValue("perfilIds", newSelectedPerfiles);
  };

  const handleVolver = () => {
    setLocation("/seguridad/usuarios");
  };

  if (loadingUsuario) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Usuario no encontrado
          </h1>
          <Button onClick={handleVolver}>Volver a usuarios</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleVolver}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-cyan-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Editar Usuario
              </h1>
              <p className="text-gray-600">
                Modifica la información del usuario
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Foto de perfil */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ImagePlus className="w-5 h-5 text-cyan-600" />
                  Foto de perfil
                </h3>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center">
                    {fotoBase64 ? (
                      <img src={fotoBase64} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <UserCheck className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                    />
                    {fotoBase64 && (
                      <Button type="button" variant="ghost" size="sm" onClick={removePhoto} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" /> Quitar foto
                      </Button>
                    )}
                    <input type="hidden" {...register("foto_base64")} />
                    <p className="text-xs text-gray-500">Formatos recomendados: JPG, PNG. Tamaño sugerido: 400x400.</p>
                  </div>
                </div>
              </div>
              {/* Información personal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="identificacion">Identificación *</Label>
                  <Input
                    id="identificacion"
                    placeholder="00000000"
                    {...register("identificacion")}
                    onChange={(e) => {
                      register("identificacion").onChange(e);
                      handleFieldChange("identificacion");
                    }}
                    className={(errors.identificacion || fieldErrors.identificacion) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {(errors.identificacion || fieldErrors.identificacion) && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.identificacion || errors.identificacion?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="primerNombre">1er Nombre *</Label>
                  <Input
                    id="primerNombre"
                    placeholder="Primer nombre"
                    {...register("primerNombre")}
                    className={errors.primerNombre ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.primerNombre && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.primerNombre.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="segundoNombre">2do Nombre</Label>
                  <Input
                    id="segundoNombre"
                    placeholder="Segundo nombre"
                    {...register("segundoNombre")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primerApellido">1er Apellido *</Label>
                  <Input
                    id="primerApellido"
                    placeholder="Primer apellido"
                    {...register("primerApellido")}
                    className={errors.primerApellido ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {errors.primerApellido && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.primerApellido.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="segundoApellido">2do Apellido</Label>
                  <Input
                    id="segundoApellido"
                    placeholder="Segundo apellido"
                    {...register("segundoApellido")}
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="### ##-##"
                    {...register("telefono")}
                  />
                </div>
              </div>

              {/* Información de contacto y acceso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Correo Electrónico"
                    {...register("email")}
                    onChange={(e) => {
                      register("email").onChange(e);
                      handleFieldChange("email");
                    }}
                    className={(errors.email || fieldErrors.email) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {(errors.email || fieldErrors.email) && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.email || errors.email?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">Usuario *</Label>
                  <Input
                    id="username"
                    placeholder="Usuario"
                    {...register("username")}
                    onChange={(e) => {
                      register("username").onChange(e);
                      handleFieldChange("username");
                    }}
                    className={(errors.username || fieldErrors.username) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                  />
                  {(errors.username || fieldErrors.username) && (
                    <p className="text-sm text-red-500 mt-1">
                      {fieldErrors.username || errors.username?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Contraseña con indicador de fortaleza */}
              <div>
                <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Dejar vacío para mantener la actual"
                  {...register("password")}
                  className={errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
                {passwordValue && (
                  <PasswordStrengthIndicator password={passwordValue} />
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Deja este campo vacío si no deseas cambiar la contraseña
                </p>
              </div>

              {/* Estado del usuario */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activo"
                  {...register("activo")}
                />
                <Label htmlFor="activo">Usuario activo</Label>
              </div>

              {/* Perfiles asociados - Multiselect */}
              <div>
                <Label>Perfiles Asociados *</Label>
                <div className="border rounded-lg p-4 mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {loadingPerfiles ? (
                    <div className="text-center py-4">
                      <span className="text-gray-500">Cargando perfiles...</span>
                    </div>
                  ) : perfiles.length === 0 ? (
                    <div className="text-center py-4">
                      <span className="text-gray-500">No hay perfiles disponibles</span>
                    </div>
                  ) : (
                    perfiles.map((perfil) => (
                      <div key={perfil.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`perfil-${perfil.id}`}
                          checked={selectedPerfiles.includes(perfil.id)}
                          onCheckedChange={(checked) => handlePerfilChange(perfil.id, checked as boolean)}
                        />
                        <Label 
                          htmlFor={`perfil-${perfil.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          <span className="font-medium">{perfil.nombre}</span>
                          {perfil.descripcion && (
                            <span className="text-gray-500 ml-2">- {perfil.descripcion}</span>
                          )}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {errors.perfilIds && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.perfilIds.message}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Selecciona uno o más perfiles para el usuario
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVolver}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateUsuarioMutation.isPending}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {updateUsuarioMutation.isPending ? (
                    "Actualizando..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Actualizar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditarUsuarioPage;