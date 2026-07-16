import { ListaPedido, ListaPedidoCreateInput, ListaPedidoUpdateInput, TipoPedido } from "../../entities/listaPedidos/ListaPedido";

export interface ListaPedidoRepository {
  findAll(tipo?: TipoPedido): Promise<ListaPedido[]>;
  findById(id: number): Promise<ListaPedido | null>;
  create(input: ListaPedidoCreateInput): Promise<ListaPedido>;
  update(input: ListaPedidoUpdateInput): Promise<ListaPedido | null>;
  delete(id: number): Promise<boolean>;
}
