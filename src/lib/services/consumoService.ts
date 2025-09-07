import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Consumo = Database['public']['Tables']['consumo']['Row'];
type ConsumoInsert = Database['public']['Tables']['consumo']['Insert'];
type ConsumoUpdate = Database['public']['Tables']['consumo']['Update'];

export const consumoService = {
  // Obtener todos los registros de consumo
  async getAllConsumos() {
    const { data, error } = await supabase
      .from('consumo')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo
        )
      `)
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    return data as (Consumo & {
      lote: {
        lote_id: number;
        codigo: string;
      };
    })[];
  },

  // Obtener consumo por ID
  async getConsumoById(id: number) {
    const { data, error } = await supabase
      .from('consumo')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          fecha_ingreso,
          cantidad_inicial
        )
      `)
      .eq('consumo_id', id)
      .single();
    
    if (error) throw error;
    return data as Consumo & {
      lote: {
        lote_id: number;
        codigo: string;
        fecha_ingreso: string;
        cantidad_inicial: number;
      };
    };
  },

  // Obtener consumos por lote
  async getConsumosByLote(loteId: number) {
    const { data, error } = await supabase
      .from('consumo')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    return data as Consumo[];
  },

  // Obtener consumo por lote y fecha
  async getConsumoByLoteAndFecha(loteId: number, fecha: string) {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('consumo')
      .select('*')
      .eq('lote_id', loteId)
      .gte('fecha_hora', startOfDay.toISOString())
      .lt('fecha_hora', endOfDay.toISOString());
    
    if (error) throw error;
    return data as Consumo[];
  },

  // Crear un nuevo registro de consumo
  async createConsumo(consumo: ConsumoInsert) {
    const { data, error } = await supabase
      .from('consumo')
      .insert(consumo)
      .select()
      .single();
    
    if (error) throw error;
    return data as Consumo;
  },

  // Actualizar un registro de consumo
  async updateConsumo(id: number, consumo: ConsumoUpdate) {
    const { data, error } = await supabase
      .from('consumo')
      .update(consumo)
      .eq('consumo_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Consumo;
  },

  // Eliminar un registro de consumo
  async deleteConsumo(id: number) {
    const { error } = await supabase
      .from('consumo')
      .delete()
      .eq('consumo_id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener resumen de consumo por rango de fechas
  async getResumenConsumo(loteId: number, fechaInicio: string, fechaFin: string) {
    const startOfDay = new Date(fechaInicio);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaFin);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('consumo')
      .select('*')
      .eq('lote_id', loteId)
      .gte('fecha_hora', startOfDay.toISOString())
      .lt('fecha_hora', endOfDay.toISOString())
      .order('fecha_hora');
    
    if (error) throw error;
    
    const consumos = data as Consumo[];
    
    // Agrupar por día para calcular totales diarios
    const consumosPorDia = consumos.reduce((acc, curr) => {
      const fecha = new Date(curr.fecha_hora).toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = {
          cantidad_agua: 0,
          cantidad_alimento: 0,
          desperdicio: 0,
          count: 0
        };
      }
      acc[fecha].cantidad_agua += curr.cantidad_agua;
      acc[fecha].cantidad_alimento += curr.cantidad_alimento;
      acc[fecha].desperdicio += (curr.desperdicio || 0);
      acc[fecha].count++;
      return acc;
    }, {} as Record<string, { cantidad_agua: number; cantidad_alimento: number; desperdicio: number; count: number; }>);

    const diasUnicos = Object.keys(consumosPorDia).length;

    return {
      totalAgua: consumos.reduce((sum, c) => sum + c.cantidad_agua, 0),
      totalAlimento: consumos.reduce((sum, c) => sum + c.cantidad_alimento, 0),
      totalDesperdicio: consumos.reduce((sum, c) => sum + (c.desperdicio || 0), 0),
      promedioAguaDiario: diasUnicos ? Object.values(consumosPorDia).reduce((sum: number, dia) => sum + dia.cantidad_agua, 0) / diasUnicos : 0,
      promedioAlimentoDiario: diasUnicos ? Object.values(consumosPorDia).reduce((sum: number, dia) => sum + dia.cantidad_alimento, 0) / diasUnicos : 0,
      registros: consumos
    };
  },

  // Obtener últimos consumos de lotes activos por granja
  async getUltimosConsumosPorLote(granjaId?: number) {
    let query = supabase
      .from('consumo')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          estado,
          granja_id
        )
      `)
      .eq('lote.estado', 'activo')
      .order('fecha', { ascending: false });

    if (granjaId) {
      query = query.eq('lote.granja_id', granjaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Agrupar por lote y obtener el último registro de cada uno
    const ultimosConsumos = data.reduce((acc, curr) => {
      if (!acc[curr.lote_id] || new Date(curr.fecha) > new Date(acc[curr.lote_id].fecha)) {
        acc[curr.lote_id] = curr;
      }
      return acc;
    }, {} as Record<number, Consumo>);

    return Object.values(ultimosConsumos) as (Consumo & {
      lote: {
        lote_id: number;
        codigo: string;
        estado: string;
        granja_id: number;
      };
    })[];
  }
}; 