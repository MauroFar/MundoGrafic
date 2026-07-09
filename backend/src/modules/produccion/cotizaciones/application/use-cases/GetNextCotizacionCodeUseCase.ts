import { CotizacionCodeRepository } from "../../domain/repositories/CotizacionCodeRepository";

export class GetNextCotizacionCodeUseCase {
  constructor(private readonly cotizacionCodeRepository: CotizacionCodeRepository) {}

  async execute() {
    return this.cotizacionCodeRepository.getNextCotizacionCode();
  }
}
