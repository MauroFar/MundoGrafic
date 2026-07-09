import { CotizacionCommandRepository } from "../../domain/repositories/CotizacionCommandRepository";

export class DeleteCotizacionUseCase {
  constructor(private readonly cotizacionCommandRepository: CotizacionCommandRepository) {}

  async execute(id: number) {
    return this.cotizacionCommandRepository.deleteCotizacion(id);
  }
}
