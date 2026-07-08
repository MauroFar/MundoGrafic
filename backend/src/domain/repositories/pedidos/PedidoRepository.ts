import { Pedido } from "../../entities/pedidos/Pedido";

export interface PedidoRepository {
  findAll(): Promise<Pedido[]>;
  findById(id: number): Promise<Pedido | null>;
  save(pedido: Omit<Pedido, "id">): Promise<Pedido>;
  update(id: number, pedido: Partial<Omit<Pedido, "id">>): Promise<Pedido | null>;
  delete(id: number): Promise<boolean>;
}
