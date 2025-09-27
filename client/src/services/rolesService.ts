import { supabase } from './supabaseClient';

export const rolesService = {
  // Listar roles (incluyendo cantidad de modulos asignados y estado activo)
  async listRoles() {
    const { data, error } = await supabase
      .from('gen_roles')
      .select('id, nombre, descripcion, activo, created_at, gen_roles_modulos(count)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error al listar roles:", error);
      throw error;
    }

    // Mapear para incluir el count de módulos y asegurar que 'activo' sea booleano
    return data.map(rol => ({
      ...rol,
      modulos_count: rol.gen_roles_modulos ? rol.gen_roles_modulos[0]?.count || 0 : 0, // Extraer el count
      activo: rol.activo === true // Asegurar que activo sea booleano
    }));
  },

  // Crear un nuevo rol
  async createRole({ nombre, descripcion }: { nombre: string; descripcion?: string }) {
    const { data, error } = await supabase.from('gen_roles').insert([{ nombre, descripcion }]).select().single();
    if (error) throw error;
    return data;
  },

  // Editar rol
  async updateRole(id: number, { nombre, descripcion }: { nombre: string; descripcion?: string }) {
    const { data, error } = await supabase.from('gen_roles').update({ nombre, descripcion }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Eliminar (inactivar) un rol
  async deleteRole(id: number) {
    const { data, error } = await supabase
      .from('gen_roles')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error al inactivar rol:", error);
      throw error;
    }
    return data;
  },

  // Eliminar definitivamente un rol
  async deleteRolePermanent(id: number) {
    const { data, error } = await supabase
      .from('gen_roles')
      .delete()
      .eq('id', id);
    if (error) {
      console.error("Error al eliminar permanentemente el rol:", error);
      throw error;
    }
    return data;
  },

  // Activar un rol inactivo
  async activateRole(id: number) {
    const { data, error } = await supabase
      .from('gen_roles')
      .update({ activo: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
    if (error) {
      console.error("Error al activar el rol:", error);
      throw error;
    }
    return data;
  },

  // Listar solo roles activos
  async listActiveRoles() {
    const { data, error } = await supabase
      .from('gen_roles')
      .select('id, nombre, created_at')
      .eq('activo', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error("Error al listar roles activos:", error);
      throw error;
    }
    return data;
  },

  // Eliminar métodos de roles_permisos
  // Listar permisos de un rol (ya no se usa)
  // async listPermisosByRol(rol_id: number) { ... }
  // Asignar permisos a un rol (ya no se usa)
  // async setPermisosToRol(rol_id: number, permiso_ids: number[]) { ... }

  // Obtener todas las acciones completas para un rol (ahora desde roles_modulos)
  async getAccionesCompletasPorRol(rol_id: number) {
    const { data, error } = await supabase
      .from('gen_roles_modulos')
      .select('modulo_id, selected_actions_codes, gen_modulos(id, nombre)') // Seleccionar el id y nombre del modulo
      .eq('rol_id', rol_id);
    
    if (error) {
      console.error("Error al obtener acciones completas por rol:", error);
      throw error;
    }

    // Aplanar los datos para facilitar el procesamiento en el frontend
    const flattenedActions: any[] = [];
    for (const entry of data) {
      const moduloId = entry.modulo_id;
      const moduloNombre = (Array.isArray(entry.gen_modulos) ? entry.gen_modulos[0] : entry.gen_modulos)?.nombre || '';
      const selectedActions = entry.selected_actions_codes as string[] || [];

      for (const actionCode of selectedActions) {
        // Necesitamos el permiso_id real y los detalles del permiso/módulo.
        // Esto requerirá una búsqueda adicional si queremos mantener la estructura anterior.
        // Por ahora, devolveremos lo que podamos directamente.
        flattenedActions.push({
          modulo_id: moduloId,
          modulo_nombre: moduloNombre,
          accion_codigo: actionCode, // Este es el 'code' de modulo_permisos.code
          // No tenemos el permiso_id o nombre directo de modulo_permisos aquí, se obtendrá en el handleEdit
        });
      }
    }
    return flattenedActions;
  },

  // Obtener detalles de un permiso de módulo específico
  async getModuloPermisoDetails(permiso_id: number) {
    const { data, error } = await supabase
      .from('gen_modulo_permisos')
      .select('id, nombre, descripcion, code, gen_modulos(nombre)')
      .eq('id', permiso_id)
      .single();

    if (error) {
      console.error("Error al obtener detalles del permiso de módulo:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Permiso de módulo no encontrado");
    }

    const moduloInfo = (Array.isArray(data.gen_modulos) ? data.gen_modulos[0] : data.gen_modulos) as { nombre: string } | null; // Asegurar el tipo

    return {
      permiso_id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      code: data.code,
      modulo: moduloInfo?.nombre || ''
    };
  },

  // Guardar acciones por modulo para un rol
  async setAccionesToRol(rol_id: number, modulosConAcciones: { modulo_id: number; acciones: string[] }[]) {
    // Primero, eliminar todas las entradas existentes para este rol en roles_modulos
    const { error: deleteError } = await supabase
      .from('gen_roles_modulos')
      .delete()
      .eq('rol_id', rol_id);

    if (deleteError) {
      console.error("Error al eliminar acciones de rol existentes:", deleteError);
      throw deleteError;
    }

    // Luego, insertar los nuevos registros
    const inserts = modulosConAcciones.map(mc => ({
      rol_id: rol_id,
      modulo_id: mc.modulo_id,
      selected_actions_codes: mc.acciones // Guardar el array de codes como JSONB
    }));

    if (inserts.length > 0) {
      const { data, error } = await supabase
        .from('gen_roles_modulos')
        .insert(inserts)
        .select();

      if (error) {
        console.error("Error al guardar acciones de rol:", error);
        throw error;
      }
      return data;
    }
    return [];
  },

  // Consultar acciones por permiso para un rol
  async getAccionesByRol(rol_id: number) {
    const { data, error } = await supabase.from('gen_roles_acciones').select('*').eq('rol_id', rol_id);
    if (error) throw error;
    return data;
  },

  // Listar módulos con sus permisos y acciones (incluyendo descripción del módulo)
  async listModulosConPermisos() {
    const { data, error } = await supabase
      .from('gen_modulos')
      .select(`
        id,
        nombre,
        descripcion,
        gen_modulo_permisos (
          id,
          nombre,
          descripcion,
          code
        )
      `);
    if (error) throw error;
    return data;
  },

  // Listar permisos (con nombre de módulo)
  async listPermisos() {
    const { data, error } = await supabase
      .from('gen_modulo_permisos')
      .select('*, gen_modulos(nombre)');
    if (error) throw error;
    return data.map(p => {
      const moduloObj = (Array.isArray(p.gen_modulos) ? p.gen_modulos[0] : p.gen_modulos) as { nombre: string } | null; // Asegurar el tipo
      return {
        ...p,
        modulo: moduloObj?.nombre || ''
      };
    });
  }
}; 