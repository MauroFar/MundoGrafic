import { AppError } from "../../../shared/errors/AppError";
import { PrensaRepository } from "../../../domain/repositories/prensas/PrensaRepository";

export class UpdatePrensaUseCase {
  constructor(private readonly repo: PrensaRepository) {}
  async execute(id: number, nombre: string, descripcion?: string | null, activo?: boolean) {
    const trimmed = String(nombre ?? "").trim();
    if (!trimmed) throw new AppError("El nombre de la prensa es requerido", 400);
    if (await this.repo.existsByNombre(trimmed, id))
      throw new AppError("Ya existe otra prensa con ese nombre", 400);
    const result = await this.repo.update({ id, nombre: trimmed, descripcion: descripcion ?? null, activo });
    if (!result) throw new AppError("Prensa no encontrada", 404);
    return result;
  }
}
