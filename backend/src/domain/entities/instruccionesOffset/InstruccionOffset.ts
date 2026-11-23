export type CategoriaInstruccionOffset = 'impresion' | 'acabados' | 'empacado';

export interface InstruccionOffset {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface InstruccionOffsetCreateInput {
  nombre: string;
  descripcion: string | null;
}
