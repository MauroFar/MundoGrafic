import { ClienteRepository } from "../../../domain/repositories/clientes/ClienteRepository";

export class ListClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute() {
    return this.clienteRepository.findAll();
  }
}
