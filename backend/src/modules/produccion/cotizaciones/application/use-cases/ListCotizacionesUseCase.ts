import { CotizacionQueryRepository, ListCotizacionesInput } from "../../domain/repositories/CotizacionQueryRepository";

export class ListCotizacionesUseCase {
  constructor(private readonly cotizacionQueryRepository: CotizacionQueryRepository) {}

  async execute(input: ListCotizacionesInput) {
    return this.cotizacionQueryRepository.listCotizaciones(input);
  }
}
