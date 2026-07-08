import { PedidoRepository } from "../../../domain/repositories/pedidos/PedidoRepository";

export class ListPedidosUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async execute() {
    return this.pedidoRepository.findAll();
  }
}
