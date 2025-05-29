import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Proveedor = Database['public']['Tables']['proveedor']['Row'];
type ProveedorInsert = Database['public']['Tables']['proveedor']['Insert'];
type ProveedorUpdate = Database['public']['Tables']['proveedor']['Update'];

export const proveedorService = {
  // Obtener todos los proveedores
  async getAllProveedores() {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data as Proveedor[];
  },

  // Obtener un proveedor por ID
  async getProveedorById(id: number) {
    const { data, error } = await supabase
      .from('proveedor')
      .select(`
        *,
        lotes:lote(
          lote_id,
          codigo,
          fecha_ingreso,
          cantidad_inicial,
          estado
        )
      `)
      .eq('proveedor_id', id)
      .single();
    
    if (error) throw error;
    return data as Proveedor & {
      lotes: {
        lote_id: number;
        codigo: string;
        fecha_ingreso: string;
        cantidad_inicial: number;
        estado: string;
      }[];
    };
  },

  // Crear un nuevo proveedor
  async createProveedor(proveedor: ProveedorInsert) {
    const { data, error } = await supabase
      .from('proveedor')
      .insert(proveedor)
      .select()
      .single();
    
    if (error) throw error;
    return data as Proveedor;
  },

  // Actualizar un proveedor
  async updateProveedor(id: number, proveedor: ProveedorUpdate) {
    const { data, error } = await supabase
      .from('proveedor')
      .update(proveedor)
      .eq('proveedor_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Proveedor;
  },

  // Eliminar un proveedor
  async deleteProveedor(id: number) {
    const { error } = await supabase
      .from('proveedor')
      .delete()
      .eq('proveedor_id', id);
    
    if (error) throw error;
    return true;
  },

  // Buscar proveedores por nombre
  async searchProveedores(searchTerm: string) {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .ilike('nombre', `%${searchTerm}%`)
      .order('nombre');
    
    if (error) throw error;
    return data as Proveedor[];
  },

  // Obtener proveedores con lotes activos
  async getProveedoresConLotesActivos() {
    const { data, error } = await supabase
      .from('proveedor')
      .select(`
        *,
        lotes:lote(
          lote_id,
          codigo,
          estado
        )
      `)
      .eq('lotes.estado', 'activo');
    
    if (error) throw error;
    return data as (Proveedor & {
      lotes: {
        lote_id: number;
        codigo: string;
        estado: string;
      }[];
    })[];
  }
}; 