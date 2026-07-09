import { AppError } from "../../../shared/errors/AppError";
import { ClienteRepository } from "../../../domain/repositories/clientes/ClienteRepository";

export class GetClienteByIdUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de cliente invalido", 400);
    }

    return this.clienteRepository.findById(id);
  }
}
