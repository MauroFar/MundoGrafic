import { CotizacionDetalleRepository } from "../../domain/repositories/CotizacionDetalleRepository";

export class ReplaceCotizacionDetallesUseCase {
  constructor(private readonly cotizacionDetalleRepository: CotizacionDetalleRepository) {}

  async execute(cotizacionId: number, detalles: any[]) {
    return this.cotizacionDetalleRepository.replaceDetalles({ cotizacionId, detalles });
  }
}
