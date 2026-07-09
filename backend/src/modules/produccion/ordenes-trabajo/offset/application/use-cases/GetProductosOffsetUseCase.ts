import { PgProductoOffsetRepository } from '../../infrastructure/persistence/PgProductoOffsetRepository';
import { ProductoOrdenOffsetData } from '../../domain/entities/types';

export class GetProductosOffsetUseCase {
  constructor(private readonly repo: PgProductoOffsetRepository) {}

  async execute(ordenTrabajoId: number): Promise<ProductoOrdenOffsetData[]> {
    return await this.repo.listByOrden(ordenTrabajoId);
  }
}
