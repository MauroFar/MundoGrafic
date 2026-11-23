import {
  CategoriaInstruccionOffset,
  InstruccionOffset,
  InstruccionOffsetCreateInput,
} from '../../entities/instruccionesOffset/InstruccionOffset';

export interface InstruccionOffsetRepository {
  findAll(categoria: CategoriaInstruccionOffset): Promise<InstruccionOffset[]>;
  existsByNombre(categoria: CategoriaInstruccionOffset, nombre: string): Promise<boolean>;
  create(
    categoria: CategoriaInstruccionOffset,
    input: InstruccionOffsetCreateInput,
  ): Promise<InstruccionOffset>;
}
