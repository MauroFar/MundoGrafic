import { PgEstadoOrdenOffsetRepository } from '../../infrastructure/persistence/PgEstadoOrdenOffsetRepository';
import { EstadoOrdenOffsetHistorialData } from '../../domain/entities/types';

export class GetOffsetEstadoHistorialUseCase {
  constructor(private readonly repo: PgEstadoOrdenOffsetRepository) {}

  async execute(ordenTrabajoId: number): Promise<EstadoOrdenOffsetHistorialData[]> {
    return await this.repo.getHistoryByOrdenId(ordenTrabajoId);
  }
}
