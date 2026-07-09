import { PgEstadoOrdenDigitalRepository } from '../../infrastructure/persistence/PgEstadoOrdenDigitalRepository';
import { EstadoOrdenDigitalData } from '../../domain/entities/types';

export class GetDigitalEstadosUseCase {
  constructor(private readonly repo: PgEstadoOrdenDigitalRepository) {}

  async execute(): Promise<EstadoOrdenDigitalData[]> {
    return await this.repo.getActiveStates();
  }
}
