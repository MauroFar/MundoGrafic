export interface Area {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface AreaCreateInput {
  nombre: string;
  descripcion?: string | null;
}

export interface AreaUpdateInput {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  activo?: boolean | null;
}
