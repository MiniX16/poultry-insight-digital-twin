import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Lote = Database['public']['Tables']['lote']['Row'];
type LoteInsert = Database['public']['Tables']['lote']['Insert'];
type LoteUpdate = Database['public']['Tables']['lote']['Update'];

export const loteService = {
  // Obtener todos los lotes
  async getAllLotes() {
    const { data, error } = await supabase
      .from('lote')
      .select('*')
      .order('fecha_ingreso', { ascending: false });
    
    if (error) throw error;
    return data as Lote[];
  },

  // Obtener un lote por ID
  async getLoteById(id: number) {
    const { data, error } = await supabase
      .from('lote')
      .select('*')
      .eq('lote_id', id)
      .single();
    
    if (error) throw error;
    return data as Lote;
  },

  // Obtener lotes por granja
  async getLotesByGranja(granjaId: number) {
    const { data, error } = await supabase
      .from('lote')
      .select('*')
      .eq('granja_id', granjaId)
      .order('fecha_ingreso', { ascending: false });
    
    if (error) throw error;
    return data as Lote[];
  },

  // Crear un nuevo lote
  async createLote(lote: LoteInsert) {
    const { data, error } = await supabase
      .from('lote')
      .insert(lote)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lote;
  },

  // Actualizar un lote
  async updateLote(id: number, lote: LoteUpdate) {
    const { data, error } = await supabase
      .from('lote')
      .update(lote)
      .eq('lote_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Lote;
  },

  // Eliminar un lote
  async deleteLote(id: number) {
    const { error } = await supabase
      .from('lote')
      .delete()
      .eq('lote_id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener lotes activos
  async getLotesActivos() {
    const { data, error } = await supabase
      .from('lote')
      .select('*')
      .eq('estado', 'activo')
      .order('fecha_ingreso', { ascending: false });
    
    if (error) throw error;
    return data as Lote[];
  }
}; 