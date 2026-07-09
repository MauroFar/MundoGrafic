import { AppError } from "../../../shared/errors/AppError";
import { AreaRepository } from "../../../domain/repositories/areas/AreaRepository";

export class CreateAreaUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(input: any) {
    const nombre = String(input?.nombre || "").trim();
    const descripcion = input?.descripcion ?? "";

    if (!nombre) {
      throw new AppError("El nombre del area es requerido", 400);
    }

    const exists = await this.areaRepository.existsByName(nombre);
    if (exists) {
      throw new AppError("Ya existe un area con ese nombre", 400);
    }

    return this.areaRepository.create({ nombre, descripcion });
  }
}
