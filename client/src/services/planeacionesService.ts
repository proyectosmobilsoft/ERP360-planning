import { supabase } from './supabaseClient';

export interface PlaneacionContrato {
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

// Función para calcular el ciclo actual basada en la función SQL
function calculaCicloActual(idContrato: number, fechaInicio: string, fechaArranque: string, noCiclos: number): number {
  // Convertir fechas a objetos Date
  const fechaInicioDate = new Date(fechaInicio);
  const fechaArranqueDate = new Date(fechaArranque);
  
  // Calcular fecha_inicio_contrato (fecha_arranque - 1 día)
  const fechaInicioContrato = new Date(fechaArranqueDate);
  fechaInicioContrato.setDate(fechaArranqueDate.getDate() - 1);
  
  // Calcular días transcurridos
  const diasTranscurridos = Math.floor((fechaInicioDate.getTime() - fechaInicioContrato.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calcular variable_ciclo
  const variableCiclo = diasTranscurridos / noCiclos;
  
  // Calcular decimales
  const decimales = variableCiclo - Math.floor(variableCiclo);
  
  // Calcular ciclo_actual
  let cicloActual = 1;
  if (decimales === 0) {
    cicloActual = noCiclos;
  } else if (decimales > 0) {
    cicloActual = Math.round(noCiclos * decimales);
  }
  
  return cicloActual;
}

export const planeacionesService = {
  // Obtener todas las planeaciones de contratos
  async getAll(): Promise<PlaneacionContrato[]> {
    const { data, error } = await supabase
      .from('prod_planeacion_contratos')
      .select(`
        id,
        no_req,
        fecha_inicial,
        fecha_final,
        num_ciclos,
        estado,
        id_contrato,
        id_sede,
        id_detalle_zona,
        id_usuario,
        fecha_creacion,
        prod_contratos!fk_prod_planeacion_contratos_id_contrato(
          id,
          no_contrato,
          fecha_inicial,
          fecha_final,
          fecha_arranque,
          no_ciclos,
          no_ppl,
          no_servicios,
          valor_racion,
          con_terceros!fk_tercero_contrato(nombre_tercero)
        ),
        gen_sucursales!fk_prod_planeacion_contratos_id_sede(codigo, nombre)
      `)
      .order('prod_contratos(id), no_req', { ascending: true });

    if (error) {
      console.error('Error al obtener planeaciones:', error);
      throw new Error('Error al cargar las planeaciones de contratos');
    }

    // Transformar los datos según la vista SQL proporcionada
    return data?.map((item: any) => {
      const contrato = item.prod_contratos;
      const tercero = contrato?.con_terceros;
      const sucursal = item.gen_sucursales;
      
      // Generar No RQP según la lógica de la vista
      const codigoSucursal = sucursal?.codigo || '00';
      const noReq = String(item.no_req).padStart(4, '0');
      const noRqp = `RQ-${codigoSucursal}-${noReq}`;
      
      // Calcular valores
      const noPpl = contrato?.no_ppl || 1;
      const valorRacion = contrato?.valor_racion || 0;
      const total = noPpl * valorRacion;
      
      // Calcular números de menús usando la función calculaCicloActual
      let numeroMenuInicial = 1;
      let numeroMenuFinal = 28;
      
      if (contrato?.no_ciclos && contrato?.fecha_arranque) {
        numeroMenuInicial = calculaCicloActual(
          item.id_contrato,
          item.fecha_inicial,
          contrato.fecha_arranque,
          contrato.no_ciclos
        );
        
        numeroMenuFinal = calculaCicloActual(
          item.id_contrato,
          item.fecha_final,
          contrato.fecha_arranque,
          contrato.no_ciclos
        );
      }
      
      return {
        id: item.id,
        no_req: item.no_req,
        id_contrato: item.id_contrato,
        id_sede: item.id_sede,
        id_detalle_zona: item.id_detalle_zona || 0,
        fecha_inicial: item.fecha_inicial,
        fecha_final: item.fecha_final,
        num_ciclos: item.num_ciclos,
        estado: item.estado,
        id_usuario: item.id_usuario || 1,
        fecha_creacion: item.fecha_creacion || new Date().toISOString(),
        // Campos calculados según la vista
        no_rqp: noRqp,
        numero_contrato: contrato?.no_contrato,
        entidad_contratante: tercero?.nombre_tercero || 'Sin especificar',
        fecha_contrato_inicial: contrato?.fecha_inicial,
        fecha_contrato_final: contrato?.fecha_final,
        fecha_contrato_ejecucion: contrato?.fecha_arranque,
        no_ppl: contrato?.no_ppl,
        no_servicios: contrato?.no_servicios,
        raciones: contrato?.no_ppl, // Mismo valor que no_ppl según la vista
        valor_racion: valorRacion,
        valor_total: total,
        nombre_sede: sucursal?.nombre,
        codigo_sede: sucursal?.codigo,
        // Campos calculados para menús
        numero_menu_inicial: numeroMenuInicial,
        numero_menu_final: numeroMenuFinal,
      };
    }) || [];
  },

  // Crear una nueva planeación
  async create(planeacion: Omit<PlaneacionContrato, 'id' | 'fecha_creacion'>): Promise<PlaneacionContrato> {
    const { data, error } = await supabase
      .from('prod_planeacion_contratos')
      .insert([planeacion])
      .select()
      .single();

    if (error) {
      console.error('Error al crear planeación:', error);
      throw new Error('Error al crear la planeación de contrato');
    }

    return data;
  },

  // Actualizar una planeación existente
  async update(id: number, planeacion: Partial<PlaneacionContrato>): Promise<PlaneacionContrato> {
    const { data, error } = await supabase
      .from('prod_planeacion_contratos')
      .update(planeacion)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar planeación:', error);
      throw new Error('Error al actualizar la planeación de contrato');
    }

    return data;
  },

  // Eliminar una planeación
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('prod_planeacion_contratos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar planeación:', error);
      throw new Error('Error al eliminar la planeación de contrato');
    }
  }
};
