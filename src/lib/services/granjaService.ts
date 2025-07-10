import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Granja = Database['public']['Tables']['granja']['Row'];
type GranjaInsert = Database['public']['Tables']['granja']['Insert'];
type GranjaUpdate = Database['public']['Tables']['granja']['Update'];

export const granjaService = {
  // Obtener todas las granjas
  async getAllGranjas() {
    const { data, error } = await supabase
      .from('granja')
      .select(`
        *,
        usuario:usuario_id(
          usuario_id,
          nombre,
          email
        )
      `)
      .order('nombre');
    
    if (error) throw error;
    return data as (Granja & { usuario: { usuario_id: number; nombre: string; email: string } | null })[];
  },

  // Obtener una granja por ID
  async getGranjaById(id: number) {
    const { data, error } = await supabase
      .from('granja')
      .select(`
        *,
        usuario:usuario_id(
          usuario_id,
          nombre,
          email
        )
      `)
      .eq('granja_id', id)
      .single();
    
    if (error) throw error;
    return data as Granja & { usuario: { usuario_id: number; nombre: string; email: string } | null };
  },

  // Obtener granjas por usuario
  async getGranjasByUsuario(usuarioId: number) {
    const { data, error } = await supabase
      .from('granja')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('nombre');
    
    if (error) throw error;
    return data as Granja[];
  },

  // Crear una nueva granja
  async createGranja(granja: GranjaInsert) {
    const { data, error } = await supabase
      .from('granja')
      .insert(granja)
      .select()
      .single();
    
    if (error) throw error;
    return data as Granja;
  },

  // Actualizar una granja
  async updateGranja(id: number, granja: GranjaUpdate) {
    const { data, error } = await supabase
      .from('granja')
      .update(granja)
      .eq('granja_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Granja;
  },

  // Eliminar una granja
  async deleteGranja(id: number) {
    const { error } = await supabase
      .from('granja')
      .delete()
      .eq('granja_id', id);
    
    if (error) throw error;
    return true;
  }
}; 