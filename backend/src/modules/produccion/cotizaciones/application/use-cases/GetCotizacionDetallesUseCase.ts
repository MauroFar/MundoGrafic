import { CotizacionDetalleRepository } from "../../domain/repositories/CotizacionDetalleRepository";

export class GetCotizacionDetallesUseCase {
  constructor(private readonly cotizacionDetalleRepository: CotizacionDetalleRepository) {}

  async execute(cotizacionId: number) {
    return this.cotizacionDetalleRepository.getDetallesByCotizacionId(cotizacionId);
  }
}
