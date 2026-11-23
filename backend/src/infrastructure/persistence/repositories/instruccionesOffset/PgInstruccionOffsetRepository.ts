import { Client } from 'pg';
import {
  CategoriaInstruccionOffset,
  InstruccionOffset,
  InstruccionOffsetCreateInput,
} from '../../../../domain/entities/instruccionesOffset/InstruccionOffset';
import { InstruccionOffsetRepository } from '../../../../domain/repositories/instruccionesOffset/InstruccionOffsetRepository';

const TABLE_BY_CATEGORY: Record<CategoriaInstruccionOffset, string> = {
  impresion: 'instrucciones_offset_impresion',
  acabados: 'instrucciones_offset_acabados_terminados',
  empacado: 'instrucciones_offset_empacado',
};

export class PgInstruccionOffsetRepository implements InstruccionOffsetRepository {
  constructor(private readonly client: Client) {}

  async findAll(categoria: CategoriaInstruccionOffset): Promise<InstruccionOffset[]> {
    const table = TABLE_BY_CATEGORY[categoria];
    const result = await this.client.query(
      `SELECT id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion
       FROM ${table} WHERE activo = true ORDER BY nombre`,
    );
    return result.rows;
  }

  async existsByNombre(categoria: CategoriaInstruccionOffset, nombre: string): Promise<boolean> {
    const table = TABLE_BY_CATEGORY[categoria];
    const result = await this.client.query(
      `SELECT 1 FROM ${table} WHERE LOWER(nombre) = LOWER($1)`,
      [nombre],
    );
    return result.rows.length > 0;
  }

  async create(
    categoria: CategoriaInstruccionOffset,
    input: InstruccionOffsetCreateInput,
  ): Promise<InstruccionOffset> {
    const table = TABLE_BY_CATEGORY[categoria];
    const result = await this.client.query(
      `INSERT INTO ${table} (nombre, descripcion, activo)
       VALUES ($1, $2, true)
       RETURNING id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion`,
      [input.nombre, input.descripcion],
    );
    return result.rows[0];
  }
}
