import { RucRepository } from "../../../domain/repositories/rucs/RucRepository";

export class ListRucsUseCase {
  constructor(private readonly repo: RucRepository) {}
  async execute() {
    return this.repo.findAll();
  }
}
