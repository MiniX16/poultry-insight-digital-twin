import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Usuario = Database['public']['Tables']['usuario']['Row'];
type UsuarioInsert = Database['public']['Tables']['usuario']['Insert'];
type UsuarioUpdate = Database['public']['Tables']['usuario']['Update'];

export const usuarioService = {
  // Obtener todos los usuarios
  async getAllUsuarios() {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data as Usuario[];
  },

  // Obtener un usuario por ID
  async getUsuarioById(id: number) {
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        *,
        granjas:granja(
          granja_id,
          nombre,
          ubicacion,
          estado
        )
      `)
      .eq('usuario_id', id)
      .single();
    
    if (error) throw error;
    return data as Usuario & {
      granjas: {
        granja_id: number;
        nombre: string;
        ubicacion: string;
        estado: string;
      }[];
    };
  },

  // Crear un nuevo usuario
  async createUsuario(usuario: UsuarioInsert) {
    const { data, error } = await supabase
      .from('usuario')
      .insert(usuario)
      .select()
      .single();
    
    if (error) throw error;
    return data as Usuario;
  },

  // Actualizar un usuario
  async updateUsuario(id: number, usuario: UsuarioUpdate) {
    const { data, error } = await supabase
      .from('usuario')
      .update(usuario)
      .eq('usuario_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Usuario;
  },

  // Eliminar un usuario
  async deleteUsuario(id: number) {
    const { error } = await supabase
      .from('usuario')
      .delete()
      .eq('usuario_id', id);
    
    if (error) throw error;
    return true;
  },

  // Buscar usuarios por nombre
  async searchUsuarios(searchTerm: string) {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .ilike('nombre', `%${searchTerm}%`)
      .order('nombre');
    
    if (error) throw error;
    return data as Usuario[];
  },

  // Obtener usuarios con granjas activas
  async getUsuariosConGranjasActivas() {
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        *,
        granjas:granja(
          granja_id,
          nombre,
          estado
        )
      `)
      .eq('granjas.estado', 'activo');
    
    if (error) throw error;
    return data as (Usuario & {
      granjas: {
        granja_id: number;
        nombre: string;
        estado: string;
      }[];
    })[];
  }
}; 