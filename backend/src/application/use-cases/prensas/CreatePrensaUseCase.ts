import { AppError } from "../../../shared/errors/AppError";
import { PrensaRepository } from "../../../domain/repositories/prensas/PrensaRepository";

export class CreatePrensaUseCase {
  constructor(private readonly repo: PrensaRepository) {}
  async execute(nombre: string, descripcion?: string | null) {
    const trimmed = String(nombre ?? "").trim();
    if (!trimmed) throw new AppError("El nombre de la prensa es requerido", 400);
    if (await this.repo.existsByNombre(trimmed))
      throw new AppError("Ya existe una prensa con ese nombre", 400);
    return this.repo.create({ nombre: trimmed, descripcion: descripcion ?? null });
  }
}
