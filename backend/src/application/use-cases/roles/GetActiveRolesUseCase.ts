import { RolRepository } from "../../../domain/repositories/roles/RolRepository";

export class GetActiveRolesUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute() {
    return this.rolRepository.findActive();
  }
}
