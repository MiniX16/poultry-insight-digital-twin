export type Database = {
  public: {
    Tables: {
      usuario: {
        Row: {
          usuario_id: number
          email: string
          nombre: string
          telefono?: string
          direccion?: string
          contraseña: string
          created_at: string
          updated_at: string
        }
        Insert: {
          usuario_id?: number
          email: string
          nombre: string
          telefono?: string
          direccion?: string
          contraseña: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          usuario_id?: number
          email?: string
          nombre?: string
          telefono?: string
          direccion?: string
          contraseña?: string
          created_at?: string
          updated_at?: string
        }
      }
      granja: {
        Row: {
          granja_id: number
          nombre: string
          ubicacion?: string
          capacidad: number
          usuario_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          granja_id?: number
          nombre: string
          ubicacion?: string
          capacidad: number
          usuario_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          granja_id?: number
          nombre?: string
          ubicacion?: string
          capacidad?: number
          usuario_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      nave: {
        Row: {
          nave_id: number
          nombre: string
          capacidad: number
          ubicacion: string
          estado: string
          area: number
          created_at: string
          updated_at: string
        }
        Insert: {
          nave_id?: number
          nombre: string
          capacidad: number
          ubicacion: string
          estado: string
          area: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          nave_id?: number
          nombre?: string
          capacidad?: number
          ubicacion?: string
          estado?: string
          area?: number
          created_at?: string
          updated_at?: string
        }
      }
      lote: {
        Row: {
          lote_id: number
          codigo: string
          fecha_ingreso: string
          cantidad_inicial: number
          raza: string
          nave_id: number | null
          granja_id: number
          proveedor_id: number | null
          estado: string
          fecha_salida: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          lote_id?: number
          codigo: string
          fecha_ingreso: string
          cantidad_inicial: number
          raza: string
          nave_id?: number | null
          granja_id: number
          proveedor_id?: number | null
          estado: string
          fecha_salida?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          lote_id?: number
          codigo?: string
          fecha_ingreso?: string
          cantidad_inicial?: number
          raza?: string
          nave_id?: number | null
          granja_id?: number
          proveedor_id?: number | null
          estado?: string
          fecha_salida?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      proveedor: {
        Row: {
          proveedor_id: number
          nombre: string
          contacto: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          proveedor_id?: number
          nombre: string
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          proveedor_id?: number
          nombre?: string
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      consumo: {
        Row: {
          consumo_id: number
          lote_id: number
          fecha_hora: string
          cantidad_agua: number
          cantidad_alimento: number
          tipo_alimento: string
          desperdicio: number
          kwh: number
          created_at: string
          updated_at: string
        }
        Insert: {
          consumo_id?: number
          lote_id: number
          fecha_hora: string
          cantidad_agua: number
          cantidad_alimento: number
          tipo_alimento: string
          desperdicio?: number
          kwh?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          consumo_id?: number
          lote_id?: number
          fecha_hora?: string
          cantidad_agua?: number
          cantidad_alimento?: number
          tipo_alimento?: string
          desperdicio?: number
          kwh?: number
          created_at?: string
          updated_at?: string
        }
      }
      alimentacion: {
        Row: {
          alimentacion_id: number
          lote_id: number
          fecha: string
          tipo_alimento: string
          cantidad_suministrada: number
          responsable: string
          created_at: string
          updated_at: string
        }
        Insert: {
          alimentacion_id?: number
          lote_id: number
          fecha: string
          tipo_alimento: string
          cantidad_suministrada: number
          responsable: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          alimentacion_id?: number
          lote_id?: number
          fecha?: string
          tipo_alimento?: string
          cantidad_suministrada?: number
          responsable?: string
          created_at?: string
          updated_at?: string
        }
      }
      mortalidad: {
        Row: {
          mortalidad_id: number
          lote_id: number
          fecha: string
          cantidad: number
          causa: string
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          mortalidad_id?: number
          lote_id: number
          fecha: string
          cantidad: number
          causa: string
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          mortalidad_id?: number
          lote_id?: number
          fecha?: string
          cantidad?: number
          causa?: string
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      medicion_ambiental: {
        Row: {
          medicion_id: number
          lote_id: number
          fecha_hora: string
          temperatura: number
          humedad: number
          co2: number | null
          amoniaco: number | null
          iluminacion: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          medicion_id?: number
          lote_id: number
          fecha_hora: string
          temperatura: number
          humedad: number
          co2?: number | null
          amoniaco?: number | null
          iluminacion?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          medicion_id?: number
          lote_id?: number
          fecha_hora?: string
          temperatura?: number
          humedad?: number
          co2?: number | null
          amoniaco?: number | null
          iluminacion?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      mapa_termico: {
        Row: {
          id: number
          lote_id: number
          fecha: string
          temperaturas: number[][]
          min_temp: number | null
          max_temp: number | null
        }
        Insert: {
          id?: number
          lote_id: number
          fecha?: string
          temperaturas: number[][]
          min_temp?: number | null
          max_temp?: number | null
        }
        Update: {
          id?: number
          lote_id?: number
          fecha?: string
          temperaturas?: number[][]
          min_temp?: number | null
          max_temp?: number | null
        }
      }
      crecimiento: {
        Row: {
          crecimiento_id: number
          lote_id: number
          fecha: string
          peso_promedio: number
          ganancia_diaria: number | null
          uniformidad: number | null
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          crecimiento_id?: number
          lote_id: number
          fecha: string
          peso_promedio: number
          ganancia_diaria?: number | null
          uniformidad?: number | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          crecimiento_id?: number
          lote_id?: number
          fecha?: string
          peso_promedio?: number
          ganancia_diaria?: number | null
          uniformidad?: number | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pollo: {
        Row: {
          pollo_id: number
          lote_id: number
          identificador: string
          peso: number
          estado_salud: string
          fecha_registro: string
          created_at: string
          updated_at: string
        }
        Insert: {
          pollo_id?: number
          lote_id: number
          identificador: string
          peso: number
          estado_salud: string
          fecha_registro: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          pollo_id?: number
          lote_id?: number
          identificador?: string
          peso?: number
          estado_salud?: string
          fecha_registro?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 