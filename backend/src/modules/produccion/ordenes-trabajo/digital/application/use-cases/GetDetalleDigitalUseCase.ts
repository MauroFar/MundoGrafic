import { PgOrdenDigitalRepository } from '../../infrastructure/persistence/PgOrdenDigitalRepository';
import { DetalleOrdenDigitalData } from '../../domain/entities/types';

export class GetDetalleDigitalUseCase {
  constructor(private readonly repo: PgOrdenDigitalRepository) {}

  async execute(ordenTrabajoId: number): Promise<DetalleOrdenDigitalData | null> {
    return await this.repo.findDetalleByOrdenId(ordenTrabajoId);
  }
}
