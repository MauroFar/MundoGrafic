export interface Permiso {
  id?: number;
  usuario_id: number;
  modulo: string;
  puede_crear: boolean;
  puede_leer: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
  updated_at?: Date;
}

export interface PermisoUpsertInput {
  modulo: string;
  puede_crear: boolean;
  puede_leer: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

export interface ModulosDisponiblesResult {
  esAdmin: boolean;
  modulos: string[];
}
