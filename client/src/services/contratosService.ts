import { supabase } from './supabaseClient';

export interface ContratoDetallado {
  id: number;
  numero_contrato: string;
  cliente: string;
  objeto: string;
  nit_cliente: string;
  fecha_inicial: string;
  fecha_final: string;
  fecha_ejecucion?: string;
  sede: {
    id: number;
    nombre: string;
    codigo: string;
  } | null;
  zona: {
    id: number;
    nombre: string;
    codigo: string;
  } | null;
  n_ppl: number;
  n_servicios: number;
  servicios_dia: number;
  raciones_dia: number;
  valor_racion?: number;
  valor_total?: number;
  estado: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  // Campos adicionales que pueden existir
  [key: string]: any;
}

export const contratosService = {
  // Obtener todos los contratos
  async getAll(): Promise<ContratoDetallado[]> {
    try {
      // Consulta con JOINs para obtener datos relacionados
      const { data, error } = await supabase
        .from('prod_contratos')
        .select(`
          *,
          con_terceros!fk_tercero_contrato (
            nombre_tercero,
            documento
          ),
          gen_sucursales!fk_sucursal_contrato (
            nombre,
            codigo
          )
        `)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching contratos:', error);
        throw error;
      }

      // Obtener zonas para cada contrato
      const contratosConZonas = await Promise.all(
        (data || []).map(async (contrato) => {
          const { data: zonasData } = await supabase
            .from('prod_zonas_by_contrato')
            .select(`
              prod_zonas_contrato!id_zona (
                id,
                nombre,
                codigo
              )
            `)
            .eq('id_contrato', contrato.id);

          const zonaData = zonasData?.[0]?.prod_zonas_contrato;
          const zona = Array.isArray(zonaData) ? zonaData[0] : zonaData;

          return {
            ...contrato,
            // Mapear datos del tercero (cliente)
            cliente: contrato.con_terceros?.nombre_tercero || 'Sin cliente',
            nit_cliente: contrato.con_terceros?.documento || 'Sin NIT',
            // Mapear datos de la sede
            sede: contrato.gen_sucursales ? {
              id: contrato.id_sucursal,
              nombre: contrato.gen_sucursales.nombre,
              codigo: contrato.gen_sucursales.codigo
            } : null,
            // Mapear datos de la zona
            zona: zona ? {
              id: zona.id,
              nombre: zona.nombre,
              codigo: zona.codigo
            } : null,
            // Mapear otros campos importantes
            numero_contrato: contrato.no_contrato,
            objeto: contrato.objetivo,
            fecha_inicial: contrato.fecha_inicial,
            fecha_final: contrato.fecha_final,
            fecha_ejecucion: contrato.fecha_arranque,
            n_ppl: contrato.no_ppl,
            n_servicios: contrato.no_servicios,
            servicios_dia: contrato.no_servicios, // Asumiendo que es por día
            raciones_dia: contrato.no_ppl, // Asumiendo que es por día
            valor_racion: contrato.valor_racion,
            valor_total: contrato.valor_contrato,
            estado: contrato.estado_proceso || 'SIN_ESTADO',
            observaciones: contrato.observacion,
            created_at: contrato.fecsys,
            updated_at: contrato.fecsys
          };
        })
      );

      return contratosConZonas;
    } catch (error) {
      console.error('Error in contratosService.getAll:', error);
      throw error;
    }
  },

  // Buscar contratos por término
  async search(searchTerm: string): Promise<ContratoDetallado[]> {
    try {
      // Consulta con JOINs para búsqueda
      const { data, error } = await supabase
        .from('prod_contratos')
        .select(`
          *,
          con_terceros!fk_tercero_contrato (
            nombre_tercero,
            documento
          ),
          gen_sucursales!fk_sucursal_contrato (
            nombre,
            codigo
          )
        `)
        .or(`no_contrato.ilike.%${searchTerm}%,objetivo.ilike.%${searchTerm}%,con_terceros.nombre_tercero.ilike.%${searchTerm}%`)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error searching contratos:', error);
        throw error;
      }

      // Obtener zonas para cada contrato
      const contratosConZonas = await Promise.all(
        (data || []).map(async (contrato) => {
          const { data: zonasData } = await supabase
            .from('prod_zonas_by_contrato')
            .select(`
              prod_zonas_contrato!id_zona (
                id,
                nombre,
                codigo
              )
            `)
            .eq('id_contrato', contrato.id);

          const zonaData = zonasData?.[0]?.prod_zonas_contrato;
          const zona = Array.isArray(zonaData) ? zonaData[0] : zonaData;

          return {
            ...contrato,
            // Mapear datos del tercero (cliente)
            cliente: contrato.con_terceros?.nombre_tercero || 'Sin cliente',
            nit_cliente: contrato.con_terceros?.documento || 'Sin NIT',
            // Mapear datos de la sede
            sede: contrato.gen_sucursales ? {
              id: contrato.id_sucursal,
              nombre: contrato.gen_sucursales.nombre,
              codigo: contrato.gen_sucursales.codigo
            } : null,
            // Mapear datos de la zona
            zona: zona ? {
              id: zona.id,
              nombre: zona.nombre,
              codigo: zona.codigo
            } : null,
            // Mapear otros campos importantes
            numero_contrato: contrato.no_contrato,
            objeto: contrato.objetivo,
            fecha_inicial: contrato.fecha_inicial,
            fecha_final: contrato.fecha_final,
            fecha_ejecucion: contrato.fecha_arranque,
            n_ppl: contrato.no_ppl,
            n_servicios: contrato.no_servicios,
            servicios_dia: contrato.no_servicios,
            raciones_dia: contrato.no_ppl,
            valor_racion: contrato.valor_racion,
            valor_total: contrato.valor_contrato,
            estado: contrato.estado_proceso || 'SIN_ESTADO',
            observaciones: contrato.observacion,
            created_at: contrato.fecsys,
            updated_at: contrato.fecsys
          };
        })
      );

      return contratosConZonas;
    } catch (error) {
      console.error('Error in contratosService.search:', error);
      throw error;
    }
  },

  // Obtener contrato por ID
  async getById(id: number): Promise<ContratoDetallado | null> {
    try {
      const { data, error } = await supabase
        .from('prod_contratos')
        .select(`
          *,
          con_terceros!fk_tercero_contrato (
            nombre_tercero,
            documento
          ),
          gen_sucursales!fk_sucursal_contrato (
            nombre,
            codigo
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching contrato by ID:', error);
        return null;
      }

      // Obtener zona para el contrato
      const { data: zonasData } = await supabase
        .from('prod_zonas_by_contrato')
        .select(`
          prod_zonas_contrato!id_zona (
            id,
            nombre,
            codigo
          )
        `)
        .eq('id_contrato', id);

      const zonaData = zonasData?.[0]?.prod_zonas_contrato;
      const zona = Array.isArray(zonaData) ? zonaData[0] : zonaData;

      return {
        ...data,
        // Mapear datos del tercero (cliente)
        cliente: data.con_terceros?.nombre_tercero || 'Sin cliente',
        nit_cliente: data.con_terceros?.documento || 'Sin NIT',
        // Mapear datos de la sede
        sede: data.gen_sucursales ? {
          id: data.id_sucursal,
          nombre: data.gen_sucursales.nombre,
          codigo: data.gen_sucursales.codigo
        } : null,
        // Mapear datos de la zona
        zona: zona ? {
          id: zona.id,
          nombre: zona.nombre,
          codigo: zona.codigo
        } : null,
        // Mapear otros campos importantes
        numero_contrato: data.no_contrato,
        objeto: data.objetivo,
        fecha_inicial: data.fecha_inicial,
        fecha_final: data.fecha_final,
        fecha_ejecucion: data.fecha_arranque,
        n_ppl: data.no_ppl,
        n_servicios: data.no_servicios,
        servicios_dia: data.no_servicios,
        raciones_dia: data.no_ppl,
        valor_racion: data.valor_racion,
        valor_total: data.valor_contrato,
        estado: data.estado_proceso || 'SIN_ESTADO',
        observaciones: data.observacion,
        created_at: data.fecsys,
        updated_at: data.fecsys
      };
    } catch (error) {
      console.error('Error in contratosService.getById:', error);
      return null;
    }
  }
};