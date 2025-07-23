import { supabase } from '../supabase';
import type { Database } from '../database.types';

type MedicionAmbiental = Database['public']['Tables']['medicion_ambiental']['Row'];
type MedicionAmbientalInsert = Database['public']['Tables']['medicion_ambiental']['Insert'];
type MedicionAmbientalUpdate = Database['public']['Tables']['medicion_ambiental']['Update'];

export const medicionAmbientalService = {
  // Obtener todas las mediciones ambientales
  async getAllMediciones() {
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo
        )
      `)
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    return data as (MedicionAmbiental & {
      lote: {
        lote_id: number;
        codigo: string;
      };
    })[];
  },

  // Obtener últimas mediciones ambientales
  async getUltimaMedicion() {
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data as MedicionAmbiental;
  },

  // Obtener medición por ID
  async getMedicionById(id: number) {
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          fecha_ingreso
        )
      `)
      .eq('medicion_id', id)
      .single();
    
    if (error) throw error;
    return data as MedicionAmbiental & {
      lote: {
        lote_id: number;
        codigo: string;
        fecha_ingreso: string;
      };
    };
  },

  // Obtener mediciones por lote
  async getMedicionesByLote(loteId: number) {
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    return data as MedicionAmbiental[];
  },

  // Obtener mediciones por lote y rango de fechas
  async getMedicionesByLoteAndRango(
    loteId: number, 
    fechaInicio: string, 
    fechaFin: string
  ) {
    console.log('Consultando mediciones ambientales con parámetros:', {
      loteId,
      fechaInicio,
      fechaFin
    });
    
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .select('*')
      .eq('lote_id', loteId)
      .gte('fecha_hora', fechaInicio)
      .lte('fecha_hora', fechaFin)
      .order('fecha_hora');
    
    if (error) {
      console.error('Error al consultar mediciones ambientales:', error);
      throw error;
    }
    
    console.log('Mediciones encontradas:', data);
    return data as MedicionAmbiental[];
  },

  // Crear una nueva medición ambiental
  async createMedicion(medicion: MedicionAmbientalInsert) {
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .insert(medicion)
      .select()
      .single();
    
    if (error) throw error;
    return data as MedicionAmbiental;
  },

  // Actualizar una medición ambiental
  async updateMedicion(id: number, medicion: MedicionAmbientalUpdate) {
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .update(medicion)
      .eq('medicion_id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as MedicionAmbiental;
  },

  // Eliminar una medición ambiental
  async deleteMedicion(id: number) {
    const { error } = await supabase
      .from('medicion_ambiental')
      .delete()
      .eq('medicion_id', id);
    
    if (error) throw error;
    return true;
  },

  // Obtener resumen de mediciones por rango de fechas
  async getResumenMediciones(loteId: number, fechaInicio: string, fechaFin: string) {
    const { data: mediciones, error } = await supabase
      .from('medicion_ambiental')
      .select('*')
      .eq('lote_id', loteId)
      .gte('fecha_hora', fechaInicio)
      .lte('fecha_hora', fechaFin)
      .order('fecha_hora');
    
    if (error) throw error;

    const calcularEstadisticas = (valores: number[]) => {
      const valoresFiltrados = valores.filter(v => v !== null);
      if (valoresFiltrados.length === 0) return null;

      return {
        minimo: Math.min(...valoresFiltrados),
        maximo: Math.max(...valoresFiltrados),
        promedio: valoresFiltrados.reduce((a, b) => a + b, 0) / valoresFiltrados.length
      };
    };

    return {
      temperatura: calcularEstadisticas(mediciones.map(m => m.temperatura)),
      humedad: calcularEstadisticas(mediciones.map(m => m.humedad)),
      co2: calcularEstadisticas(mediciones.map(m => m.co2)),
      amoniaco: calcularEstadisticas(mediciones.map(m => m.amoniaco)),
      iluminacion: calcularEstadisticas(mediciones.map(m => m.iluminacion)),
      registros: mediciones
    };
  },

  // Obtener últimas mediciones de todos los lotes activos
  async getUltimasMedicionesPorLote() {
    const { data, error } = await supabase
      .from('medicion_ambiental')
      .select(`
        *,
        lote:lote_id(
          lote_id,
          codigo,
          estado
        )
      `)
      .eq('lote.estado', 'activo')
      .order('fecha_hora', { ascending: false });
    
    if (error) throw error;
    
    // Agrupar por lote y obtener la última medición de cada uno
    const ultimasMediciones = data.reduce((acc, curr) => {
      if (!acc[curr.lote_id] || new Date(curr.fecha_hora) > new Date(acc[curr.lote_id].fecha_hora)) {
        acc[curr.lote_id] = curr;
      }
      return acc;
    }, {} as Record<number, any>);

    return Object.values(ultimasMediciones) as (MedicionAmbiental & {
      lote: {
        lote_id: number;
        codigo: string;
        estado: string;
      };
    })[];
  },

  // Verificar alertas ambientales
  async verificarAlertas(loteId: number) {
    const { data: ultimaMedicion, error } = await supabase
      .from('medicion_ambiental')
      .select('*')
      .eq('lote_id', loteId)
      .order('fecha_hora', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;

    const alertas = [];
    
    // Rangos ideales (estos valores deberían ser configurables)
    const rangos = {
      temperatura: { min: 20, max: 26 },
      humedad: { min: 50, max: 70 },
      co2: { max: 3000 },
      amoniaco: { max: 25 },
      iluminacion: { min: 20, max: 50 }
    };

    if (ultimaMedicion.temperatura < rangos.temperatura.min) {
      alertas.push({ tipo: 'temperatura', mensaje: 'Temperatura por debajo del rango ideal' });
    }
    if (ultimaMedicion.temperatura > rangos.temperatura.max) {
      alertas.push({ tipo: 'temperatura', mensaje: 'Temperatura por encima del rango ideal' });
    }

    if (ultimaMedicion.humedad < rangos.humedad.min) {
      alertas.push({ tipo: 'humedad', mensaje: 'Humedad por debajo del rango ideal' });
    }
    if (ultimaMedicion.humedad > rangos.humedad.max) {
      alertas.push({ tipo: 'humedad', mensaje: 'Humedad por encima del rango ideal' });
    }

    if (ultimaMedicion.co2 && ultimaMedicion.co2 > rangos.co2.max) {
      alertas.push({ tipo: 'co2', mensaje: 'Nivel de CO2 por encima del límite recomendado' });
    }

    if (ultimaMedicion.amoniaco && ultimaMedicion.amoniaco > rangos.amoniaco.max) {
      alertas.push({ tipo: 'amoniaco', mensaje: 'Nivel de amoníaco por encima del límite recomendado' });
    }

    if (ultimaMedicion.iluminacion && 
        (ultimaMedicion.iluminacion < rangos.iluminacion.min || 
         ultimaMedicion.iluminacion > rangos.iluminacion.max)) {
      alertas.push({ tipo: 'iluminacion', mensaje: 'Nivel de iluminación fuera del rango ideal' });
    }

    return {
      medicion: ultimaMedicion,
      alertas,
      timestamp: new Date().toISOString()
    };
  }
}; 
