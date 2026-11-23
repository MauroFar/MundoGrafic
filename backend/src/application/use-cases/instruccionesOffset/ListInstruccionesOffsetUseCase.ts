import { CategoriaInstruccionOffset } from '../../../domain/entities/instruccionesOffset/InstruccionOffset';
import { InstruccionOffsetRepository } from '../../../domain/repositories/instruccionesOffset/InstruccionOffsetRepository';

export class ListInstruccionesOffsetUseCase {
  constructor(private readonly repo: InstruccionOffsetRepository) {}

  execute(categoria: CategoriaInstruccionOffset) {
    return this.repo.findAll(categoria);
  }
}
