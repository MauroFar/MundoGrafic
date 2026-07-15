import { PrensaRepository } from "../../../domain/repositories/prensas/PrensaRepository";

export class ListPrensasUseCase {
  constructor(private readonly repo: PrensaRepository) {}
  async execute(soloActivas = true) {
    return soloActivas ? this.repo.findAllActive() : this.repo.findAll();
  }
}
