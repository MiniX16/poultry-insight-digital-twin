import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Alimentacion = Database['public']['Tables']['alimentacion']['Row'];
type AlimentacionInsert = Database['public']['Tables']['alimentacion']['Insert'];
type AlimentacionUpdate = Database['public']['Tables']['alimentacion']['Update'];

export const alimentacionService = {
  // Obtener todos los registros de alimentación
  async getAllAlimentaciones() {
    const { data, error } = await supabase
      .from('alimentacion')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo
        )
      `)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as (Alimentacion & {
      lote: {
        lote_id: number;
        codigo: string;
      };
    })[];
  },

  // Obtener alimentación por ID
  async getAlimentacionById(id: number) {
    const { data, error } = await supabase
      .from('alimentacion')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          fecha_ingreso,
          cantidad_inicial
        )
      `)
      .eq('alimentacion_id', id)
      .single();
    
    if (error) throw error;
    return data as Alimentacion & {
      lote: {
        lote_id: number;
        codigo: string;
        fecha_ingreso: string;
        cantidad_inicial: number;
      };
    };
  },

  // Obtener alimentaciones por lote
  async getAlimentacionesByLote(loteId: number) {
    const { data, error } = await supabase
      .from('alimentacion')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as Alimentacion[];
  },

  // Obtener alimentaciones por lote y fecha
  async getAlimentacionesByLoteAndFecha(loteId: number, fecha: string) {
    const { data, error } = await supabase
      .from('alimentacion')
      .select('*')
      .eq('lote_id', loteId)
      .eq('fecha', fecha)
      .order('hora_suministro');
    
    if (error) throw error;
    return data as Alimentacion[];
  },

  // Crear un nuevo registro de alimentación
  async createAlimentacion(alimentacion: AlimentacionInsert) {
    const { data, error } = await supabase
      .from('alimentacion')
      .insert(alimentacion)
      .select()
      .single();
    
    if (error) throw error;
    return data as Alimentacion;
  },

  // Actualizar un registro de alimentación
  async updateAlimentacion(id: number, alimentacion: AlimentacionUpdate) {
    const { data, error } = await supabase
      .from('alimentacion')
      .update(alimentacion)
      .eq('alimentacion_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Alimentacion;
  },

  // Eliminar un registro de alimentación
  async deleteAlimentacion(id: number) {
    const { error } = await supabase
      .from('alimentacion')
      .delete()
      .eq('alimentacion_id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener resumen de alimentación por rango de fechas
  async getResumenAlimentacion(loteId: number, fechaInicio: string, fechaFin: string) {
    const { data, error } = await supabase
      .from('alimentacion')
      .select('*')
      .eq('lote_id', loteId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha');
    
    if (error) throw error;
    
    const alimentaciones = data as Alimentacion[];
    
    // Agrupar por tipo de alimento
    const porTipoAlimento = alimentaciones.reduce((acc, curr) => {
      if (!acc[curr.tipo_alimento]) {
        acc[curr.tipo_alimento] = 0;
      }
      acc[curr.tipo_alimento] += curr.cantidad_suministrada;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSuministrado: alimentaciones.reduce((sum, a) => sum + a.cantidad_suministrada, 0),
      promedioSuministroDiario: alimentaciones.length ? 
        alimentaciones.reduce((sum, a) => sum + a.cantidad_suministrada, 0) / 
        [...new Set(alimentaciones.map(a => a.fecha))].length : 0,
      porTipoAlimento,
      registros: alimentaciones
    };
  },

  // Obtener últimas alimentaciones por lote activo
  async getUltimasAlimentacionesPorLote() {
    const { data, error } = await supabase
      .from('alimentacion')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          estado
        )
      `)
      .eq('lote.estado', 'activo')
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    
    // Agrupar por lote y obtener el último registro de cada uno
    const ultimasAlimentaciones = data.reduce((acc, curr) => {
      const key = `${curr.lote_id}_${curr.fecha}`;
      if (!acc[key] || new Date(curr.hora_suministro) > new Date(acc[key].hora_suministro)) {
        acc[key] = curr;
      }
      return acc;
    }, {} as Record<string, Alimentacion>);

    return Object.values(ultimasAlimentaciones) as (Alimentacion & {
      lote: {
        lote_id: number;
        codigo: string;
        estado: string;
      };
    })[];
  },

  // Obtener tipos de alimento únicos
  async getTiposAlimento() {
    const { data, error } = await supabase
      .from('alimentacion')
      .select('tipo_alimento')
      .order('tipo_alimento');
    
    if (error) throw error;
    
    // Eliminar duplicados
    return [...new Set(data.map(a => a.tipo_alimento))];
  }
}; 