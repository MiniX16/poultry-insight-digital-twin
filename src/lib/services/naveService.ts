import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Nave = Database['public']['Tables']['nave']['Row'];
type NaveInsert = Database['public']['Tables']['nave']['Insert'];
type NaveUpdate = Database['public']['Tables']['nave']['Update'];

export const naveService = {
  // Obtener todas las naves
  async getAllNaves() {
    const { data, error } = await supabase
      .from('nave')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data as Nave[];
  },

  // Obtener una nave por ID
  async getNaveById(id: number) {
    const { data, error } = await supabase
      .from('nave')
      .select('*')
      .eq('nave_id', id)
      .single();
    
    if (error) throw error;
    return data as Nave;
  },

  // Crear una nueva nave
  async createNave(nave: NaveInsert) {
    const { data, error } = await supabase
      .from('nave')
      .insert(nave)
      .select()
      .single();
    
    if (error) throw error;
    return data as Nave;
  },

  // Actualizar una nave
  async updateNave(id: number, nave: NaveUpdate) {
    const { data, error } = await supabase
      .from('nave')
      .update(nave)
      .eq('nave_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Nave;
  },

  // Eliminar una nave
  async deleteNave(id: number) {
    const { error } = await supabase
      .from('nave')
      .delete()
      .eq('nave_id', id);
    
    if (error) throw error;
    return true;
  }
}; 