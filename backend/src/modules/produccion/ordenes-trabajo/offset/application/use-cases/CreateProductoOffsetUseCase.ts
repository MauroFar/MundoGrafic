import { PgProductoOffsetRepository } from '../../infrastructure/persistence/PgProductoOffsetRepository';
import { CreateProductoOffsetInput, ProductoOrdenOffsetData } from '../../domain/entities/types';

export class CreateProductoOffsetUseCase {
  constructor(private readonly repo: PgProductoOffsetRepository) {}

  async execute(input: CreateProductoOffsetInput): Promise<ProductoOrdenOffsetData> {
    return await this.repo.create(input);
  }
}
