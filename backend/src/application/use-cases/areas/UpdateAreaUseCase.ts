import { AppError } from "../../../shared/errors/AppError";
import { AreaRepository } from "../../../domain/repositories/areas/AreaRepository";

export class UpdateAreaUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(id: number, input: any) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de area invalido", 400);
    }

    const current = await this.areaRepository.findById(id);
    if (!current) {
      return null;
    }

    const nombre = input?.nombre ? String(input.nombre).trim() : null;
    if (nombre && nombre.toLowerCase() !== String(current.nombre).toLowerCase()) {
      const exists = await this.areaRepository.existsByName(nombre, id);
      if (exists) {
        throw new AppError("Ya existe un area con ese nombre", 400);
      }
    }

    return this.areaRepository.update({
      id,
      nombre,
      descripcion: input?.descripcion,
      activo: typeof input?.activo === "boolean" ? input.activo : null,
    });
  }
}
