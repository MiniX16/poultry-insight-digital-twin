import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Proveedor = Database['public']['Tables']['proveedor']['Row'];
type ProveedorInsert = Database['public']['Tables']['proveedor']['Insert'];
type ProveedorUpdate = Database['public']['Tables']['proveedor']['Update'];

export const proveedorService = {
  async getAllProveedores() {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .order('nombre');
    
    if (error) throw error;
    return data as Proveedor[];
  },

  async getProveedorById(id: number) {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .eq('proveedor_id', id)
      .single();
    
    if (error) throw error;
    return data as Proveedor;
  },

  async createProveedor(proveedor: ProveedorInsert) {
    const { data, error } = await supabase
      .from('proveedor')
      .insert(proveedor)
      .select()
      .single();
    
    if (error) throw error;
    return data as Proveedor;
  },

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

  async deleteProveedor(id: number) {
    const { error } = await supabase
      .from('proveedor')
      .delete()
      .eq('proveedor_id', id);
    
    if (error) throw error;
    return true;
  }
};