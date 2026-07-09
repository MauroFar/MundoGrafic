import { CotizacionCommandRepository, UpdateCotizacionInput } from "../../domain/repositories/CotizacionCommandRepository";

export class UpdateCotizacionUseCase {
  constructor(private readonly cotizacionCommandRepository: CotizacionCommandRepository) {}

  async execute(input: UpdateCotizacionInput) {
    return this.cotizacionCommandRepository.updateCotizacion(input);
  }
}
