import { CotizacionCommandRepository, CreateCotizacionInput } from "../../domain/repositories/CotizacionCommandRepository";

export class CreateCotizacionUseCase {
  constructor(private readonly cotizacionCommandRepository: CotizacionCommandRepository) {}

  async execute(input: CreateCotizacionInput) {
    return this.cotizacionCommandRepository.createCotizacion(input);
  }
}
