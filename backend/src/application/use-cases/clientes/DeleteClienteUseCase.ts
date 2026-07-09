import { AppError } from "../../../shared/errors/AppError";
import { ClienteRepository } from "../../../domain/repositories/clientes/ClienteRepository";

export class DeleteClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de cliente invalido", 400);
    }

    const hasRelations = await this.clienteRepository.hasRelatedDocuments(id);
    if (hasRelations) {
      throw new AppError("El cliente tiene cotizaciones u órdenes de trabajo asociadas", 409);
    }

    return this.clienteRepository.delete(id);
  }
}
