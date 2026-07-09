import { CotizacionDetalleRepository, CreateCotizacionDetalleInput } from "../../domain/repositories/CotizacionDetalleRepository";

export class CreateCotizacionDetalleUseCase {
  constructor(private readonly cotizacionDetalleRepository: CotizacionDetalleRepository) {}

  async execute(input: CreateCotizacionDetalleInput) {
    return this.cotizacionDetalleRepository.createDetalle(input);
  }
}
