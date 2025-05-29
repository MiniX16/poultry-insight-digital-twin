import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Mortalidad = Database['public']['Tables']['mortalidad']['Row'];
type MortalidadInsert = Database['public']['Tables']['mortalidad']['Insert'];
type MortalidadUpdate = Database['public']['Tables']['mortalidad']['Update'];

export const mortalidadService = {
  // Obtener todos los registros de mortalidad
  async getAllMortalidades() {
    const { data, error } = await supabase
      .from('mortalidad')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo
        )
      `)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as (Mortalidad & {
      lote: {
        lote_id: number;
        codigo: string;
      };
    })[];
  },

  // Obtener mortalidad por ID
  async getMortalidadById(id: number) {
    const { data, error } = await supabase
      .from('mortalidad')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          fecha_ingreso,
          cantidad_inicial
        )
      `)
      .eq('mortalidad_id', id)
      .single();
    
    if (error) throw error;
    return data as Mortalidad & {
      lote: {
        lote_id: number;
        codigo: string;
        fecha_ingreso: string;
        cantidad_inicial: number;
      };
    };
  },

  // Obtener mortalidades por lote
  async getMortalidadesByLote(loteId: number) {
    const { data, error } = await supabase
      .from('mortalidad')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as Mortalidad[];
  },

  // Obtener mortalidad por lote y fecha
  async getMortalidadByLoteAndFecha(loteId: number, fecha: string) {
    const { data, error } = await supabase
      .from('mortalidad')
      .select('*')
      .eq('lote_id', loteId)
      .eq('fecha', fecha)
      .single();
    
    if (error) throw error;
    return data as Mortalidad;
  },

  // Crear un nuevo registro de mortalidad
  async createMortalidad(mortalidad: MortalidadInsert) {
    const { data, error } = await supabase
      .from('mortalidad')
      .insert(mortalidad)
      .select()
      .single();
    
    if (error) throw error;
    return data as Mortalidad;
  },

  // Actualizar un registro de mortalidad
  async updateMortalidad(id: number, mortalidad: MortalidadUpdate) {
    const { data, error } = await supabase
      .from('mortalidad')
      .update(mortalidad)
      .eq('mortalidad_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Mortalidad;
  },

  // Eliminar un registro de mortalidad
  async deleteMortalidad(id: number) {
    const { error } = await supabase
      .from('mortalidad')
      .delete()
      .eq('mortalidad_id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener resumen de mortalidad por rango de fechas
  async getResumenMortalidad(loteId: number, fechaInicio: string, fechaFin: string) {
    const { data: mortalidades, error } = await supabase
      .from('mortalidad')
      .select('*')
      .eq('lote_id', loteId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha');
    
    if (error) throw error;

    // Obtener información del lote
    const { data: loteData, error: loteError } = await supabase
      .from('lote')
      .select('cantidad_inicial')
      .eq('lote_id', loteId)
      .single();
    
    if (loteError) throw loteError;
    
    const cantidadInicial = loteData.cantidad_inicial;
    const totalMortalidad = mortalidades.reduce((sum, m) => sum + m.cantidad, 0);
    
    // Agrupar por causa
    const porCausa = mortalidades.reduce((acc, curr) => {
      if (!acc[curr.causa]) {
        acc[curr.causa] = 0;
      }
      acc[curr.causa] += curr.cantidad;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMortalidad,
      porcentajeMortalidad: (totalMortalidad / cantidadInicial) * 100,
      promedioMortalidadDiario: mortalidades.length ? 
        totalMortalidad / [...new Set(mortalidades.map(m => m.fecha))].length : 0,
      porCausa,
      cantidadRestante: cantidadInicial - totalMortalidad,
      registros: mortalidades
    };
  },

  // Obtener causas de mortalidad más comunes
  async getCausasMortalidad() {
    const { data, error } = await supabase
      .from('mortalidad')
      .select('causa')
      .order('causa');
    
    if (error) throw error;
    
    // Eliminar duplicados
    return [...new Set(data.map(m => m.causa))];
  },

  // Obtener mortalidad por lote con tendencias
  async getMortalidadConTendencias(loteId: number) {
    const { data: mortalidades, error } = await supabase
      .from('mortalidad')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha');
    
    if (error) throw error;

    // Calcular tendencias por semana
    const porSemana = mortalidades.reduce((acc, curr) => {
      const fecha = new Date(curr.fecha);
      const semana = Math.floor((fecha.getTime() - new Date(fecha.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (!acc[semana]) {
        acc[semana] = {
          semana,
          cantidad: 0,
          causas: {} as Record<string, number>
        };
      }
      
      acc[semana].cantidad += curr.cantidad;
      if (!acc[semana].causas[curr.causa]) {
        acc[semana].causas[curr.causa] = 0;
      }
      acc[semana].causas[curr.causa] += curr.cantidad;
      
      return acc;
    }, {} as Record<number, { semana: number; cantidad: number; causas: Record<string, number> }>);

    return {
      mortalidadDiaria: mortalidades,
      tendenciasSemanal: Object.values(porSemana)
    };
  }
}; 