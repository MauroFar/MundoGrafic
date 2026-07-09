import { PgOrdenOffsetRepository } from '../../infrastructure/persistence/PgOrdenOffsetRepository';
import { DetalleOrdenOffsetData } from '../../domain/entities/types';

export class GetDetalleOffsetUseCase {
  constructor(private readonly repo: PgOrdenOffsetRepository) {}

  async execute(ordenTrabajoId: number): Promise<DetalleOrdenOffsetData | null> {
    return await this.repo.findDetalleByOrdenId(ordenTrabajoId);
  }
}
