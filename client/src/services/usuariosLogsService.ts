import { supabase } from './supabaseClient';

export interface UsuarioLog {
  id?: number;
  usuario_id: number;
  accion: string;
  detalles?: string;
  fecha_accion?: string;
  // Relaciones
  usuario?: {
    id: number;
    username: string;
    email: string;
    primer_nombre: string;
    primer_apellido: string;
  };
}

export const usuariosLogsService = {
  // Crear un nuevo log
  crearLog: async (logData: Omit<UsuarioLog, 'id' | 'fecha_accion'>): Promise<UsuarioLog | null> => {
    try {
      console.log('📝 Creando log de usuario:', logData);
      
      const { data, error } = await supabase
        .from('gen_usuarios_logs')
        .insert({
          ...logData,
          fecha_accion: new Date().toISOString()
        })
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido)
        `)
        .single();

      if (error) {
        console.error('Error creating user log:', error);
        return null;
      }

      console.log('✅ Log de usuario creado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error in crearLog:', error);
      return null;
    }
  },

  // Obtener logs de un usuario específico
  getLogsByUsuario: async (usuarioId: number): Promise<UsuarioLog[]> => {
    try {
      const { data, error } = await supabase
        .from('gen_usuarios_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido)
        `)
        .eq('usuario_id', usuarioId)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching user logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getLogsByUsuario:', error);
      return [];
    }
  },

  // Obtener todos los logs de usuarios
  getAllLogs: async (): Promise<UsuarioLog[]> => {
    try {
      const { data, error } = await supabase
        .from('gen_usuarios_logs')
        .select(`
          *,
          usuario:gen_usuarios(id, username, email, primer_nombre, primer_apellido)
        `)
        .order('fecha_accion', { ascending: false });

      if (error) {
        console.error('Error fetching all user logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllLogs:', error);
      return [];
    }
  }
};

// Constantes para las acciones de usuarios
export const ACCIONES_USUARIOS = {
  CREAR_USUARIO: 'CREAR_USUARIO',
  EDITAR_USUARIO: 'EDITAR_USUARIO',
  ELIMINAR_USUARIO: 'ELIMINAR_USUARIO',
  ACTIVAR_USUARIO: 'ACTIVAR_USUARIO',
  DESACTIVAR_USUARIO: 'DESACTIVAR_USUARIO',
  CAMBIAR_ROL: 'CAMBIAR_ROL',
  CAMBIAR_PASSWORD: 'CAMBIAR_PASSWORD',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  RESET_PASSWORD: 'RESET_PASSWORD'
} as const;

// Función helper para obtener el usuario actual
export const getUsuarioActual = (): number => {
  try {
    const usuarioActual = localStorage.getItem('usuarioActual');
    return usuarioActual ? JSON.parse(usuarioActual).id : 1; // Fallback a ID 1
  } catch (error) {
    console.warn('Error obteniendo usuario actual:', error);
    return 1; // Fallback a ID 1
  }
};
