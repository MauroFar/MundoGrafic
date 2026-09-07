import { AppError } from "../../../shared/errors/AppError";
import { ListaPedidoRepository } from "../../../domain/repositories/listaPedidos/ListaPedidoRepository";

export class GetPedidoByIdUseCase {
  constructor(private readonly repo: ListaPedidoRepository) {}

  async execute(id: number) {
    const pedido = await this.repo.findById(id);
    if (!pedido) throw new AppError("Pedido no encontrado.", 404);
    return pedido;
  }
}
