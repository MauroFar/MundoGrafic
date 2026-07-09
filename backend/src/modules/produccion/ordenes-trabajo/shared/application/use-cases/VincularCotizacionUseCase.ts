import { IOrdenCommandRepository } from '../../domain/repositories/IOrdenCommandRepository';

export class VincularCotizacionUseCase {
  constructor(private readonly ordenCommandRepo: IOrdenCommandRepository) {}

  async execute(ordenId: number, cotizacionId: number, updatedBy: number): Promise<void> {
    return await this.ordenCommandRepo.vincularCotizacion(ordenId, cotizacionId, updatedBy);
  }
}
