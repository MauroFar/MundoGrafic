export interface ClienteListado {
  id: number;
  codigo: string | null;
  nombre: string;
  empresa: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ruc_cedula: string;
  estado: string;
  notas: string;
  fechaRegistro: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface ClienteBuscarItem {
  id: number;
  nombre_cliente: string;
  empresa_cliente: string | null;
  email_cliente: string | null;
}

export interface ClienteCreateInput {
  nombre: string;
  empresa?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  ruc_cedula?: string | null;
  estado?: string | null;
  notas?: string | null;
  userId?: number | null;
}

export interface ClienteUpdateInput {
  id: number;
  nombre: string;
  empresa?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  ruc_cedula?: string | null;
  estado?: string | null;
  notas?: string | null;
  userId?: number | null;
}
