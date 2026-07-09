import { CotizacionQueryRepository } from "../../domain/repositories/CotizacionQueryRepository";

export class GetCotizacionByIdUseCase {
  constructor(private readonly cotizacionQueryRepository: CotizacionQueryRepository) {}

  async execute(id: number) {
    return this.cotizacionQueryRepository.getCotizacionById(id);
  }
}
