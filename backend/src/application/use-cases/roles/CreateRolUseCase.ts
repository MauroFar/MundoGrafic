import { AppError } from "../../../shared/errors/AppError";
import { RolRepository } from "../../../domain/repositories/roles/RolRepository";

export class CreateRolUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute(input: any) {
    const nombre = String(input?.nombre || "").trim();
    const descripcion = input?.descripcion ?? "";

    if (!nombre) {
      throw new AppError("El nombre del rol es requerido", 400);
    }

    const exists = await this.rolRepository.existsByName(nombre);
    if (exists) {
      throw new AppError("Ya existe un rol con ese nombre", 400);
    }

    return this.rolRepository.create({ nombre, descripcion });
  }
}
