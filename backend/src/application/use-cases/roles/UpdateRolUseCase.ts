import { AppError } from "../../../shared/errors/AppError";
import { RolRepository } from "../../../domain/repositories/roles/RolRepository";

export class UpdateRolUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute(id: number, input: any) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de rol invalido", 400);
    }

    const current = await this.rolRepository.findById(id);
    if (!current) {
      return null;
    }

    const nombre = input?.nombre ? String(input.nombre).trim() : null;
    if (current.es_sistema && nombre && nombre !== current.nombre) {
      throw new AppError("No se puede cambiar el nombre de un rol del sistema", 400);
    }

    if (nombre && nombre.toLowerCase() !== String(current.nombre).toLowerCase()) {
      const exists = await this.rolRepository.existsByName(nombre, id);
      if (exists) {
        throw new AppError("Ya existe un rol con ese nombre", 400);
      }
    }

    return this.rolRepository.update({
      id,
      nombre,
      descripcion: input?.descripcion,
      activo: typeof input?.activo === "boolean" ? input.activo : null,
    });
  }
}
