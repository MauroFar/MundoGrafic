export interface Certificado {
  id: number;
  numero_certificado: string | null;
  numero_secuencia?: number | null;
  fecha_creacion: Date | null;
  fecha_elaboracion: Date | null;
  fecha_caducidad: Date | null;
  cliente_nombre: string | null;
  referencia: string | null;
  material: string | null;
  descripcion: string | null;
  cantidad: string | null;
  codigo: string | null;
  lote: string | null;
  cantidad_despachada: string | null;
  lote_despacho: string | null;
  tamano_cm: string | null;
  orden_compra: string | null;
  inspeccionado_por: string | null;
  observaciones: string | null;
  aprobado_area: string | null;
  recepcion_area: string | null;
  espesor_mm?: string | null;
  espesor_micras4?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
  // populated on read
  caracteristicas?: CertificadoMedicion[];
}

export interface CertificadoMedicion {
  id?: number;
  certificado_id?: number;
  caracteristica_id: number | null;
  nombre?: string | null;
  unidad?: string | null;
  minimo: string | null;
  nominal: string | null;
  maximo: string | null;
  orden: number;
}

export interface Caracteristica {
  id: number;
  nombre: string;
  unidad: string | null;
}

export interface CertificadoCreateInput {
  numero_certificado?: string | null;
  fecha_creacion?: string | null;
  fecha_elaboracion?: string | null;
  fecha_caducidad?: string | null;
  cliente_nombre?: string | null;
  referencia?: string | null;
  material?: string | null;
  descripcion?: string | null;
  cantidad?: string | null;
  codigo?: string | null;
  lote?: string | null;
  cantidad_despachada?: string | null;
  lote_despacho?: string | null;
  tamano_cm?: string | null;
  orden_compra?: string | null;
  inspeccionado_por?: string | null;
  observaciones?: string | null;
  aprobado_area?: string | null;
  recepcion_area?: string | null;
  espesor_mm?: string | null;
  created_by?: number | null;
  caracteristicas?: CertificadoMedicionInput[];
}

export interface CertificadoUpdateInput extends CertificadoCreateInput {
  updated_by?: number | null;
}

export interface CertificadoMedicionInput {
  caracteristica_id?: number | null;
  nombre?: string | null;
  /** alias aceptado desde el frontend */
  name?: string | null;
  unidad?: string | null;
  minimo?: string | null;
  nominal?: string | null;
  maximo?: string | null;
  orden?: number;
}
