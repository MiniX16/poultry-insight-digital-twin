export interface Farm {
  granja_id: number;
  nombre: string;
  ubicacion?: string;
  capacidad: number;
  usuario_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface FarmWithOwner extends Farm {
  usuario?: {
    usuario_id: number;
    nombre: string;
    email: string;
  } | null;
}