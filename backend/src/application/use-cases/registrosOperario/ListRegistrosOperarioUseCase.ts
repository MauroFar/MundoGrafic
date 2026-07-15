import { RegistroOperarioRepository } from "../../../domain/repositories/registrosOperario/RegistroOperarioRepository";
import { RegistroOperarioFilters } from "../../../domain/entities/registrosOperario/RegistroOperario";

export class ListRegistrosOperarioUseCase {
  constructor(private readonly repo: RegistroOperarioRepository) {}
  async execute(filters: RegistroOperarioFilters) {
    return this.repo.findByFilters(filters);
  }
}
