import { AppError } from "../../../shared/errors/AppError";
import { AreaRepository } from "../../../domain/repositories/areas/AreaRepository";

export class GetAreaByIdUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de area invalido", 400);
    }

    return this.areaRepository.findById(id);
  }
}
