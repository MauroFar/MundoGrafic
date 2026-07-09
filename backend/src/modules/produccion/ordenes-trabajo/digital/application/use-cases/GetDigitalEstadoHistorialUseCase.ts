import { PgEstadoOrdenDigitalRepository } from '../../infrastructure/persistence/PgEstadoOrdenDigitalRepository';
import { EstadoOrdenDigitalHistorialData } from '../../domain/entities/types';

export class GetDigitalEstadoHistorialUseCase {
  constructor(private readonly repo: PgEstadoOrdenDigitalRepository) {}

  async execute(ordenTrabajoId: number): Promise<EstadoOrdenDigitalHistorialData[]> {
    return await this.repo.getHistoryByOrdenId(ordenTrabajoId);
  }
}
