import { PgOrdenDigitalRepository } from '../../infrastructure/persistence/PgOrdenDigitalRepository';
import { CreateDetalleDigitalInput, DetalleOrdenDigitalData } from '../../domain/entities/types';

export class CreateDetalleDigitalUseCase {
  constructor(private readonly repo: PgOrdenDigitalRepository) {}

  async execute(input: CreateDetalleDigitalInput): Promise<DetalleOrdenDigitalData> {
    return await this.repo.createDetalle(input);
  }
}
