import { PgProductoDigitalRepository } from '../../infrastructure/persistence/PgProductoDigitalRepository';
import { CreateProductoDigitalInput, ProductoOrdenDigitalData } from '../../domain/entities/types';

export class CreateProductoDigitalUseCase {
  constructor(private readonly repo: PgProductoDigitalRepository) {}

  async execute(input: CreateProductoDigitalInput): Promise<ProductoOrdenDigitalData> {
    return await this.repo.create(input);
  }
}
