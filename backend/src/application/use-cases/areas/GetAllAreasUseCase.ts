import { AreaRepository } from "../../../domain/repositories/areas/AreaRepository";

export class GetAllAreasUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute() {
    return this.areaRepository.findAll();
  }
}
