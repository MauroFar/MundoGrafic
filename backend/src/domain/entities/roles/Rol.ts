export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  es_sistema: boolean;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface RolCreateInput {
  nombre: string;
  descripcion?: string | null;
}

export interface RolUpdateInput {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  activo?: boolean | null;
}
