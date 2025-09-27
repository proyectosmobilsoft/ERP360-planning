
import { supabase } from './supabaseClient';

export interface Empresa {
  id: number;
  nombre: string;
  razon_social: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
  representante_legal: string;
  cargo_representante: string;
  estado: string;
  logo_base64?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Obtiene información completa de una empresa por ID
 */
export const obtenerEmpresaPorId = async (empresaId: number): Promise<Empresa | null> => {
  try {
    console.log('Consultando empresa con ID:', empresaId);
    
    const { data, error } = await supabase
      .from('empresas')
      .select('*, logo_base64')
      .eq('id', empresaId)
      .single();

    if (error) {
      console.error('Error al consultar empresa:', error);
      return null;
    }

    if (data) {
      console.log('Empresa encontrada:', data);
      return data;
    }

    console.log('No se encontró empresa con ID:', empresaId);
    return null;
  } catch (error) {
    console.error('Error en obtenerEmpresaPorId:', error);
    return null;
  }
};

/**
 * Obtiene todas las empresas
 */
export const obtenerEmpresas = async (): Promise<Empresa[]> => {
  try {
    console.log('Consultando tabla empresas...');
    
    const { data, error } = await supabase
      .from('empresas')
      .select('*, logo_base64, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener empresas:', error);
      console.error('Detalles del error:', error.message, error.details, error.hint);
      return [];
    }

    console.log('Empresas encontradas en BD:', data);
    console.log('Número de empresas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error en obtenerEmpresas:', error);
    return [];
  }
};

// Exportar el servicio completo para mantener compatibilidad
export const empresasService = {
  getAll: async (): Promise<Empresa[]> => {
    console.log('Llamando a obtenerEmpresas...');
    const result = await obtenerEmpresas();
    console.log('Resultado de obtenerEmpresas:', result);
    return result;
  },
  create: async (empresa: Omit<Empresa, 'id' | 'createdAt' | 'updatedAt'>): Promise<Empresa | null> => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .insert([empresa])
        .select()
        .single();

      if (error) {
        console.error('Error al crear empresa:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en create empresa:', error);
      return null;
    }
  },
  update: async (empresa: any): Promise<Empresa | null> => {
    try {
      // Mapear los campos del frontend a los campos de la base de datos
      const empresaToUpdate = {
        razon_social: empresa.razonSocial,
        nit: empresa.nit,
        direccion: empresa.direccion,
        ciudad: empresa.ciudad,
        email: empresa.email,
        telefono: empresa.telefono,
        representante_legal: empresa.representanteLegal,
        logo_base64: empresa.logo_base64,
        activo: empresa.active
      };

      const { data, error } = await supabase
        .from('empresas')
        .update(empresaToUpdate)
        .eq('id', empresa.id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar empresa:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en update empresa:', error);
      return null;
    }
  },
  delete: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar empresa:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en delete empresa:', error);
      return false;
    }
  },
  activate: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ activo: true })
        .eq('id', id);

      if (error) {
        console.error('Error al activar empresa:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en activate empresa:', error);
      return false;
    }
  },
  deactivate: async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ activo: false })
        .eq('id', id);

      if (error) {
        console.error('Error al inactivar empresa:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en deactivate empresa:', error);
      return false;
    }
  }
};
