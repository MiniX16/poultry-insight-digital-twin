import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Pollo = Database['public']['Tables']['pollo']['Row'];
type PolloInsert = Database['public']['Tables']['pollo']['Insert'];
type PolloUpdate = Database['public']['Tables']['pollo']['Update'];

export const polloService = {
  // Obtener todos los pollos
  async getAllPollos() {
    const { data, error } = await supabase
      .from('pollo')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          raza
        )
      `)
      .order('fecha_registro', { ascending: false });
    
    if (error) throw error;
    return data as (Pollo & {
      lote: {
        lote_id: number;
        codigo: string;
        raza: string;
      };
    })[];
  },

  // Obtener pollo por ID
  async getPolloById(id: number) {
    const { data, error } = await supabase
      .from('pollo')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          raza,
          fecha_ingreso
        )
      `)
      .eq('pollo_id', id)
      .single();
    
    if (error) throw error;
    return data as Pollo & {
      lote: {
        lote_id: number;
        codigo: string;
        raza: string;
        fecha_ingreso: string;
      };
    };
  },

  // Obtener pollos por lote
  async getPollosByLote(loteId: number) {
    const { data, error } = await supabase
      .from('pollo')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha_registro', { ascending: true });
    
    if (error) throw error;
    return data as Pollo[];
  },

  // Obtener pollos por estado de salud
  async getPollosByEstadoSalud(estadoSalud: string) {
    const { data, error } = await supabase
      .from('pollo')
      .select(`
        *,
        lote:lote_id(
          codigo,
          raza
        )
      `)
      .eq('estado_salud', estadoSalud)
      .order('fecha_registro', { ascending: false });
    
    if (error) throw error;
    return data as (Pollo & {
      lote: {
        codigo: string;
        raza: string;
      };
    })[];
  },

  // Crear un nuevo pollo
  async createPollo(pollo: PolloInsert) {
    const { data, error } = await supabase
      .from('pollo')
      .insert(pollo)
      .select()
      .single();
    
    if (error) throw error;
    return data as Pollo;
  },

  // Crear múltiples pollos
  async createPollos(pollos: PolloInsert[]) {
    const { data, error } = await supabase
      .from('pollo')
      .insert(pollos)
      .select();
    
    if (error) throw error;
    return data as Pollo[];
  },

  // Actualizar un pollo
  async updatePollo(id: number, pollo: PolloUpdate) {
    const { data, error } = await supabase
      .from('pollo')
      .update(pollo)
      .eq('pollo_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Pollo;
  },

  // Eliminar un pollo
  async deletePollo(id: number) {
    const { error } = await supabase
      .from('pollo')
      .delete()
      .eq('pollo_id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener estadísticas de salud por lote
  async getEstadisticasSaludPorLote(loteId: number) {
    const { data: pollos, error } = await supabase
      .from('pollo')
      .select('estado_salud')
      .eq('lote_id', loteId);
    
    if (error) throw error;

    const total = pollos.length;
    const estadisticas = pollos.reduce((acc, pollo) => {
      acc[pollo.estado_salud] = (acc[pollo.estado_salud] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      distribucion: Object.entries(estadisticas).map(([estado, cantidad]) => ({
        estado,
        cantidad,
        porcentaje: (cantidad / total) * 100
      }))
    };
  },

  // Obtener historial de peso inicial por lote
  async getHistorialPesoInicial(loteId: number) {
    const { data, error } = await supabase
      .from('pollo')
      .select('peso, fecha_registro')
      .eq('lote_id', loteId)
      .order('fecha_registro', { ascending: true });
    
    if (error) throw error;

    const pollos = data as Pollo[];
    const totalPollos = pollos.length;
    
    if (totalPollos === 0) return null;

    const pesoPromedio = pollos.reduce((sum, p) => sum + p.peso, 0) / totalPollos;
    const pesosOrdenados = pollos.map(p => p.peso).sort((a, b) => a - b);
    
    return {
      cantidad_pollos: totalPollos,
      peso_promedio: pesoPromedio,
      peso_minimo: pesosOrdenados[0],
      peso_maximo: pesosOrdenados[totalPollos - 1],
      peso_mediana: totalPollos % 2 === 0
        ? (pesosOrdenados[totalPollos/2 - 1] + pesosOrdenados[totalPollos/2]) / 2
        : pesosOrdenados[Math.floor(totalPollos/2)],
      distribucion_temporal: pollos.map(p => ({
        fecha: p.fecha_registro,
        peso: p.peso
      }))
    };
  },

  // Obtener los últimos 10 registros de pollos
  async getLastTenPollos() {
    const { data, error } = await supabase
      .from('pollo')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo
        )
      `)
      .order('fecha_registro', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    return data as (Pollo & {
      lote: {
        lote_id: number;
        codigo: string;
      };
    })[];
  }
}; 