import { AppError } from "../../../shared/errors/AppError";
import { ListaPedidoRepository } from "../../../domain/repositories/listaPedidos/ListaPedidoRepository";

export class DeletePedidoUseCase {
  constructor(private readonly repo: ListaPedidoRepository) {}
  async execute(id: number) {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new AppError("Pedido no encontrado.", 404);
  }
}
