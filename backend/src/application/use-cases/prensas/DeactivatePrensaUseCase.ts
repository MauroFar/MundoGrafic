import { AppError } from "../../../shared/errors/AppError";
import { PrensaRepository } from "../../../domain/repositories/prensas/PrensaRepository";

export class DeactivatePrensaUseCase {
  constructor(private readonly repo: PrensaRepository) {}
  async execute(id: number) {
    const result = await this.repo.deactivate(id);
    if (!result) throw new AppError("Prensa no encontrada", 404);
    return result;
  }
}
