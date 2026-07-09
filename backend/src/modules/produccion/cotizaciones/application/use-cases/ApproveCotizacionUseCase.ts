import { CotizacionCommandRepository } from "../../domain/repositories/CotizacionCommandRepository";

export class ApproveCotizacionUseCase {
  constructor(private readonly cotizacionCommandRepository: CotizacionCommandRepository) {}

  async execute(id: number, observacion: string | null) {
    return this.cotizacionCommandRepository.approveCotizacion(id, observacion);
  }
}
