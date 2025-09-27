import { supabase } from './supabaseClient';
import { emailService } from './emailService';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserValidation {
  user: {
    id: number;
    username: string;
    email: string;
    primer_nombre: string;
    primer_apellido: string;
    activo: boolean;
  };
  empresas: Array<{
    id: number;
    razon_social: string;
  }>;
  roles: Array<{
    id: number;
    nombre: string;
  }>;
}

export interface AuthService {
  // Métodos originales
  validateUser: (identifier: string) => Promise<UserValidation | null>;
  verifyPassword: (userId: number, password: string) => Promise<{ success: boolean; userData?: any }>;
  getUserEmpresas: (userId: number) => Promise<any[]>;
  
  // Métodos de recuperación de contraseña
  generarCodigoVerificacion: (email: string) => Promise<{ success: boolean; message: string }>;
  verificarCodigo: (email: string, codigo: string) => Promise<{ success: boolean; message: string }>;
  cambiarContraseña: (email: string, codigo: string, nuevaContraseña: string) => Promise<{ success: boolean; message: string }>;
  
  // Método para configurar email
  configurarEmail: (gmail: string, password: string, appPassword?: string) => void;
}

// Configuración de email (puedes cambiar estos valores)
const EMAIL_CONFIG = {
  gmail: 'proyectosmobilsoft@gmail.com', // Cambia por tu Gmail
  password: 'Axul2025$', // Cambia por tu contraseña
  appPassword: 'sewi slmy fcls hvaa' // Opcional: contraseña de aplicación si tienes 2FA
};

// Configurar el servicio de email
emailService.setConfig(EMAIL_CONFIG);

export const authService: AuthService = {
  // Métodos originales
  validateUser: async (identifier: string): Promise<UserValidation | null> => {
    try {
      // Usuario de prueba para desarrollo
      if (identifier === 'testuser' || identifier === 'test@example.com') {
        return {
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            primer_nombre: 'Usuario',
            primer_apellido: 'Prueba',
            activo: true,
          },
          empresas: [
            { id: 1, razon_social: 'Empresa de Prueba 1' },
            { id: 2, razon_social: 'Empresa de Prueba 2' }
          ],
          roles: [
            { id: 1, nombre: 'admin' }
          ]
        };
      }
      
      const { data, error } = await supabase
        .from('gen_usuarios')
        .select(`
          id,
          username,
          email,
          primer_nombre,
          primer_apellido,
          foto_base64,
          activo,
          gen_usuario_empresas (
            empresas (
              id,
              razon_social
            )
          ),
          gen_usuario_roles (
            rol_id,
            gen_roles (
              id,
              nombre
            )
          )
        `)
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .eq('activo', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Extraer empresas y roles de la respuesta anidada
      const empresas = data.gen_usuario_empresas?.map((ue: any) => ue.empresas) || [];
      const roles = data.gen_usuario_roles?.map((ur: any) => ur.gen_roles) || [];

      return {
        user: {
          id: data.id,
          username: data.username,
          email: data.email,
          primer_nombre: data.primer_nombre,
          primer_apellido: data.primer_apellido,
          activo: data.activo,
        },
        empresas,
        roles
      };
    } catch (error) {
      return null;
    }
  },

  async verifyPassword(userId: number, password: string): Promise<{ success: boolean; userData?: any }> {
    try {
      // Obtener datos del usuario incluyendo hash de contraseña
      const { data: userData, error: userError } = await supabase
        .from('gen_usuarios')
        .select(`
          id,
          username,
          email,
          primer_nombre,
          primer_apellido,
          password,
          foto_base64,
          activo,
          gen_usuario_empresas (
            empresas (
              id,
              razon_social
            )
          ),
          gen_usuario_roles (
            rol_id,
            gen_roles (
              id,
              nombre
            )
          )
        `)
        .eq('id', userId)
        .eq('activo', true)
        .single();

      if (userError || !userData) {
        return { success: false };
      }

      // Verificar que userData no sea null antes de continuar
      if (!userData || !userData.id) {
        return { success: false };
      }

      // A partir de aquí, userData está garantizado que no es null
      const safeUserData = userData as NonNullable<typeof userData>;

      // Extraer roles y empresas de la respuesta
      const roles = (safeUserData.gen_usuario_roles || [])
        .map((ur: any) => {
          const role = ur?.gen_roles;
          if (!role) return null;
          return { id: role.id ?? ur.rol_id, nombre: role.nombre };
        })
        .filter(Boolean) || [];
      const empresas = safeUserData.gen_usuario_empresas?.map((ue: any) => ue.empresas).filter(Boolean) || [];

      // Helper: obtener acciones por rol desde gen_roles_modulos (por ids)
      const getAccionesPorRolByIds = async (roleIds: number[]) => {
        const accionesPorRol: Record<string, string[]> = {};
        const flattened = new Set<string>();
        if (roleIds.length === 0) return { accionesPorRol, acciones: Array.from(flattened) };
        try {
          const { data, error } = await supabase
            .from('gen_roles_modulos')
            .select('rol_id, selected_actions_codes, selected_actions_codes')
            .in('rol_id', roleIds);
          if (!error && Array.isArray(data)) {
            for (const row of data) {
              const codes: string[] = Array.isArray((row as any).selected_actions_codes)
                ? (row as any).selected_actions_codes
                : (Array.isArray((row as any).selected_actions_codes) ? (row as any).selected_actions_codes : []);
              accionesPorRol[String((row as any).rol_id)] = codes;
              codes.forEach(c => flattened.add(c));
            }
          }
        } catch (_e) {
          // Ignorar errores para no bloquear login
        }
        return { accionesPorRol, acciones: Array.from(flattened) };
      };

      // Construir roleIds a partir de ambas fuentes: join y tabla intermedia
      const roleIdsFromJoin = (safeUserData.gen_usuario_roles || [])
        .map((ur: any) => ur?.rol_id)
        .filter((id: any) => Number.isFinite(id));
      const roleIdsFromRoles = (safeUserData.gen_usuario_roles || [])
        .map((ur: any) => ur?.gen_roles?.id)
        .filter((id: any) => Number.isFinite(id));
      const roleIdsUnique = Array.from(new Set<number>([...roleIdsFromJoin, ...roleIdsFromRoles] as number[]));

      // Comparar contraseña como texto plano
      const isMatch = password === safeUserData.password;
      
      if (isMatch) {
        // Actualizar último acceso del usuario
        if (safeUserData.id) {
          await supabase
            .from('gen_usuarios')
            .update({ ultimo_acceso: new Date().toISOString() })
            .eq('id', safeUserData.id);
        }

        const { accionesPorRol, acciones } = await getAccionesPorRolByIds(roleIdsUnique);
        return {
          success: true,
          userData: {
            id: safeUserData.id,
            username: safeUserData.username,
            email: safeUserData.email,
            primerNombre: safeUserData.primer_nombre,
            primerApellido: safeUserData.primer_apellido,
            foto_base64: safeUserData.foto_base64,
            role: roles.length > 0 ? roles[0].nombre : 'admin',
            activo: safeUserData.activo,
            roles: roles,
            empresas: empresas,
            accionesPorRol,
            acciones,
            ultimoAcceso: new Date().toISOString(), // Incluir último acceso
            // Información adicional del usuario
            password: safeUserData.password // Solo para debug
          }
        };
      }
      
      return { success: false };
    } catch (error) {
      return { success: false };
    }
  },

  getUserEmpresas: async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('gen_usuario_empresas')
        .select(`
          empresas (
            id,
            razon_social
          )
        `)
        .eq('usuario_id', userId);
      
      if (error) throw error;
      
      return data?.map((item: any) => item.empresas) || [];
    } catch (error) {
      return [];
    }
  },

  // Método para configurar email
  configurarEmail: (gmail: string, password: string, appPassword?: string) => {
    emailService.setConfig({ gmail, password, appPassword });
  },

  // Métodos de recuperación de contraseña
  generarCodigoVerificacion: async (email: string) => {
    try {
      // Verificar que el usuario existe
      const userValidation = await authService.validateUser(email);
      if (!userValidation) {
        return {
          success: false,
          message: 'No se encontró una cuenta con este correo electrónico'
        };
      }

      // Obtener el email del administrador desde config_empresa
      const { data: configData, error: configError } = await supabase
        .from('config_empresa')
        .select('email')
        .eq('estado', 'activo')
        .single();

      if (configError || !configData?.email) {
        return {
          success: false,
          message: 'Error: No se encontró la configuración del administrador'
        };
      }

      const adminEmail = configData.email;

      // Generar código de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Fecha de expiración (30 minutos)
      const fechaExpiracion = new Date();
      fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 30);
      
      // Guardar código en la base de datos (mantener el email del usuario para validación)
      const { error } = await supabase
        .from('codigos_verificacion')
        .insert({
          email,
          codigo,
          tipo: 'recuperacion',
          usado: false,
          fecha_expiracion: fechaExpiracion.toISOString()
        });
      
      if (error) throw error;
      
      // Enviar email con el código AL ADMINISTRADOR
      const nombre = `${userValidation.user.primer_nombre} ${userValidation.user.primer_apellido}`;
      const emailResult = await emailService.sendVerificationCode(adminEmail, codigo, nombre, email);
      
      if (emailResult.success) {
        return {
          success: true,
          message: 'Código de verificación enviado al administrador',
          adminEmail: adminEmail
        };
      } else {
        return {
          success: false,
          message: 'Error al enviar el código. Por favor, intenta nuevamente.'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error al generar el código de verificación'
      };
    }
  },

  verificarCodigo: async (email: string, codigo: string) => {
    try {
      const { data, error } = await supabase
        .from('codigos_verificacion')
        .select('*')
        .eq('email', email)
        .eq('codigo', codigo)
        .eq('tipo', 'recuperacion')
        .eq('usado', false)
        .gte('fecha_expiracion', new Date().toISOString())
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return {
          success: false,
          message: 'Código inválido o expirado'
        };
      }
      
      return {
        success: true,
        message: 'Código verificado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al verificar el código'
      };
    }
  },

  cambiarContraseña: async (email: string, codigo: string, nuevaContraseña: string) => {
    try {
      // Primero verificar que el código es válido
      const verificacion = await authService.verificarCodigo(email, codigo);
      if (!verificacion.success) {
        return verificacion;
      }
      
      // Guardar la nueva contraseña como texto plano
      const { error: updateError } = await supabase
        .from('gen_usuarios')
        .update({ password: nuevaContraseña })
        .eq('email', email);
      
      if (updateError) throw updateError;
      
      // Marcar código como usado
      const { error: markError } = await supabase
        .from('codigos_verificacion')
        .update({ usado: true })
        .eq('email', email)
        .eq('codigo', codigo);
      
      if (markError) throw markError;
      
      // Enviar notificación de cambio de contraseña
      const userValidation = await authService.validateUser(email);
      if (userValidation) {
        const nombre = `${userValidation.user.primer_nombre} ${userValidation.user.primer_apellido}`;
        await emailService.sendPasswordChangedNotification(email, nombre);
      }
      
      return {
        success: true,
        message: 'Contraseña cambiada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al cambiar la contraseña'
      };
    }
  }
};