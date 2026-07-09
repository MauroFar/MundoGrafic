import { AppError } from "../../../shared/errors/AppError";
import { RolRepository } from "../../../domain/repositories/roles/RolRepository";

export class DeleteRolUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de rol invalido", 400);
    }

    const rol = await this.rolRepository.findById(id);
    if (!rol) {
      return { deleted: false, usersAffected: 0, missing: true };
    }

    if (rol.es_sistema) {
      throw new AppError("No se puede eliminar un rol del sistema", 400);
    }

    const usersAffected = await this.rolRepository.countUsersByRol(id);
    if (usersAffected > 0) {
      return { deleted: false, usersAffected, missing: false };
    }

    await this.rolRepository.softDelete(id);
    return { deleted: true, usersAffected: 0, missing: false };
  }
}
