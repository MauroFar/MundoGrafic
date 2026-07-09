import { PgEstadoOrdenOffsetRepository } from '../../infrastructure/persistence/PgEstadoOrdenOffsetRepository';
import { EstadoOrdenOffsetData } from '../../domain/entities/types';

export class GetOffsetEstadosUseCase {
  constructor(private readonly repo: PgEstadoOrdenOffsetRepository) {}

  async execute(): Promise<EstadoOrdenOffsetData[]> {
    return await this.repo.getActiveStates();
  }
}
