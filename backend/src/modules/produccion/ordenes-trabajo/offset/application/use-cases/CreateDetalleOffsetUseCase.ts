import { PgOrdenOffsetRepository } from '../../infrastructure/persistence/PgOrdenOffsetRepository';
import { CreateDetalleOffsetInput, DetalleOrdenOffsetData } from '../../domain/entities/types';

export class CreateDetalleOffsetUseCase {
  constructor(private readonly repo: PgOrdenOffsetRepository) {}

  async execute(input: CreateDetalleOffsetInput): Promise<DetalleOrdenOffsetData> {
    return await this.repo.createDetalle(input);
  }
}
