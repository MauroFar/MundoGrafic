import { ListaPedidoRepository } from "../../../domain/repositories/listaPedidos/ListaPedidoRepository";
import { TipoPedido } from "../../../domain/entities/listaPedidos/ListaPedido";

export class ListPedidosUseCase {
  constructor(private readonly repo: ListaPedidoRepository) {}
  async execute(tipo?: TipoPedido) {
    return this.repo.findAll(tipo);
  }
}
