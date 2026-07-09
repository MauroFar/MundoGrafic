import { CotizacionCommandRepository } from "../../domain/repositories/CotizacionCommandRepository";

export class RejectCotizacionUseCase {
  constructor(private readonly cotizacionCommandRepository: CotizacionCommandRepository) {}

  async execute(id: number, motivo: string) {
    return this.cotizacionCommandRepository.rejectCotizacion(id, motivo);
  }
}
