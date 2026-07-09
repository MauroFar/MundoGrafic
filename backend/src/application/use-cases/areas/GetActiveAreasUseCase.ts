import { AreaRepository } from "../../../domain/repositories/areas/AreaRepository";

export class GetActiveAreasUseCase {
  constructor(private readonly areaRepository: AreaRepository) {}

  async execute() {
    return this.areaRepository.findActive();
  }
}
