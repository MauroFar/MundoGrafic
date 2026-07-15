export interface Prensa {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export interface PrensaCreateInput {
  nombre: string;
  descripcion?: string | null;
}

export interface PrensaUpdateInput {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}
