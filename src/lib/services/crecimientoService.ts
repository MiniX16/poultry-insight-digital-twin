import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Crecimiento = Database['public']['Tables']['crecimiento']['Row'];
type CrecimientoInsert = Database['public']['Tables']['crecimiento']['Insert'];
type CrecimientoUpdate = Database['public']['Tables']['crecimiento']['Update'];

export const crecimientoService = {
  // Obtener todos los registros de crecimiento
  async getAllCrecimientos() {
    const { data, error } = await supabase
      .from('crecimiento')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo
        )
      `)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data as (Crecimiento & {
      lote: {
        lote_id: number;
        codigo: string;
      };
    })[];
  },

  // Obtener crecimiento por ID
  async getCrecimientoById(id: number) {
    const { data, error } = await supabase
      .from('crecimiento')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          fecha_ingreso,
          cantidad_inicial
        )
      `)
      .eq('crecimiento_id', id)
      .single();
    
    if (error) throw error;
    return data as Crecimiento & {
      lote: {
        lote_id: number;
        codigo: string;
        fecha_ingreso: string;
        cantidad_inicial: number;
      };
    };
  },

  // Obtener crecimientos por lote
  async getCrecimientosByLote(loteId: number) {
    const { data, error } = await supabase
      .from('crecimiento')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha', { ascending: true });
    
    if (error) throw error;
    return data as Crecimiento[];
  },

  // Obtener crecimiento por lote y fecha
  async getCrecimientoByLoteAndFecha(loteId: number, fecha: string) {
    const { data, error } = await supabase
      .from('crecimiento')
      .select('*')
      .eq('lote_id', loteId)
      .eq('fecha', fecha)
      .single();
    
    if (error) throw error;
    return data as Crecimiento;
  },

  // Crear un nuevo registro de crecimiento
  async createCrecimiento(crecimiento: CrecimientoInsert) {
    const { data, error } = await supabase
      .from('crecimiento')
      .insert(crecimiento)
      .select()
      .single();
    
    if (error) throw error;
    return data as Crecimiento;
  },

  // Actualizar un registro de crecimiento
  async updateCrecimiento(id: number, crecimiento: CrecimientoUpdate) {
    const { data, error } = await supabase
      .from('crecimiento')
      .update(crecimiento)
      .eq('crecimiento_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Crecimiento;
  },

  // Eliminar un registro de crecimiento
  async deleteCrecimiento(id: number) {
    const { error } = await supabase
      .from('crecimiento')
      .delete()
      .eq('crecimiento_id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener resumen de crecimiento por rango de fechas
  async getResumenCrecimiento(loteId: number, fechaInicio: string, fechaFin: string) {
    const { data: crecimientos, error } = await supabase
      .from('crecimiento')
      .select('*')
      .eq('lote_id', loteId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha');
    
    if (error) throw error;

    // Calcular estadísticas
    const pesoInicial = crecimientos[0]?.peso_promedio || 0;
    const pesoFinal = crecimientos[crecimientos.length - 1]?.peso_promedio || 0;
    const diasTranscurridos = crecimientos.length > 1 ? 
      Math.ceil((new Date(crecimientos[crecimientos.length - 1].fecha).getTime() - 
                new Date(crecimientos[0].fecha).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      pesoInicial,
      pesoFinal,
      gananciaTotal: pesoFinal - pesoInicial,
      diasTranscurridos,
      gananciaPromedioDiaria: diasTranscurridos > 0 ? (pesoFinal - pesoInicial) / diasTranscurridos : 0,
      uniformidadPromedio: crecimientos.reduce((sum, c) => sum + (c.uniformidad || 0), 0) / crecimientos.length,
      curvaEvolucion: crecimientos.map(c => ({
        fecha: c.fecha,
        peso: c.peso_promedio,
        ganancia: c.ganancia_diaria,
        uniformidad: c.uniformidad
      }))
    };
  },

  // Obtener últimos crecimientos de lotes activos
  async getUltimosCrecimientosPorLote() {
    const { data, error } = await supabase
      .from('crecimiento')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          estado,
          fecha_ingreso
        )
      `)
      .eq('lote.estado', 'activo')
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    
    // Agrupar por lote y obtener el último registro de cada uno
    const ultimosCrecimientos = data.reduce((acc, curr) => {
      if (!acc[curr.lote_id] || new Date(curr.fecha) > new Date(acc[curr.lote_id].fecha)) {
        acc[curr.lote_id] = curr;
      }
      return acc;
    }, {} as Record<number, Crecimiento>);

    return Object.values(ultimosCrecimientos) as (Crecimiento & {
      lote: {
        lote_id: number;
        codigo: string;
        estado: string;
        fecha_ingreso: string;
      };
    })[];
  },

  // Calcular proyección de crecimiento
  async calcularProyeccionCrecimiento(loteId: number) {
    const { data: crecimientos, error } = await supabase
      .from('crecimiento')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha');
    
    if (error) throw error;

    if (crecimientos.length < 2) {
      return null;
    }

    // Calcular tasa de crecimiento promedio
    const tasasCrecimiento = [];
    for (let i = 1; i < crecimientos.length; i++) {
      const diasEntreMediciones = Math.ceil(
        (new Date(crecimientos[i].fecha).getTime() - new Date(crecimientos[i-1].fecha).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      const tasaDiaria = (crecimientos[i].peso_promedio - crecimientos[i-1].peso_promedio) / diasEntreMediciones;
      tasasCrecimiento.push(tasaDiaria);
    }

    const tasaPromedio = tasasCrecimiento.reduce((a, b) => a + b, 0) / tasasCrecimiento.length;
    const ultimoPeso = crecimientos[crecimientos.length - 1].peso_promedio;
    const ultimaFecha = new Date(crecimientos[crecimientos.length - 1].fecha);

    // Proyectar para los próximos 7 días
    const proyeccion = Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(ultimaFecha);
      fecha.setDate(fecha.getDate() + i + 1);
      return {
        fecha: fecha.toISOString().split('T')[0],
        peso_proyectado: ultimoPeso + (tasaPromedio * (i + 1))
      };
    });

    return {
      tasaPromedioCrecimiento: tasaPromedio,
      proyeccion,
      confiabilidad: Math.min(100, (crecimientos.length / 10) * 100) // Confiabilidad basada en cantidad de mediciones
    };
  }
}; 