import { RolRepository } from "../../../domain/repositories/roles/RolRepository";

export class GetAllRolesUseCase {
  constructor(private readonly rolRepository: RolRepository) {}

  async execute() {
    return this.rolRepository.findAll();
  }
}
