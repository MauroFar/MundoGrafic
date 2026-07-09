import { AppError } from "../../../shared/errors/AppError";
import { AreaRepository } from "../../../domain/repositories/areas/AreaRepository";

export class DeleteAreaUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de area invalido", 400);
    }

    const area = await this.areaRepository.findById(id);
    if (!area) {
      return { deleted: false, usersAffected: 0, missing: true };
    }

    const usersAffected = await this.areaRepository.countUsersByArea(id);
    if (usersAffected > 0) {
      return { deleted: false, usersAffected, missing: false };
    }

    await this.areaRepository.softDelete(id);
    return { deleted: true, usersAffected: 0, missing: false };
  }
}
