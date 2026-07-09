import { PgProductoDigitalRepository } from '../../infrastructure/persistence/PgProductoDigitalRepository';
import { ProductoOrdenDigitalData } from '../../domain/entities/types';

export class GetProductosDigitalUseCase {
  constructor(private readonly repo: PgProductoDigitalRepository) {}

  async execute(ordenTrabajoId: number): Promise<ProductoOrdenDigitalData[]> {
    return await this.repo.listByOrden(ordenTrabajoId);
  }
}
