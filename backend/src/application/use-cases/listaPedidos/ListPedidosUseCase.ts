import { ListaPedidoRepository } from "../../../domain/repositories/listaPedidos/ListaPedidoRepository";

export class ListPedidosUseCase {
  constructor(private readonly repo: ListaPedidoRepository) {}
  async execute() {
    return this.repo.findAll();
  }
}
