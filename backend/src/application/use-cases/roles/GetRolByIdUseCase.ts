import { AppError } from "../../../shared/errors/AppError";
import { RolRepository } from "../../../domain/repositories/roles/RolRepository";

export class GetRolByIdUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de rol invalido", 400);
    }

    return this.rolRepository.findById(id);
  }
}
