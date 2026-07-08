import { Request, Response } from "express";
import { ListPedidosUseCase } from "../../../application/use-cases/pedidos/ListPedidosUseCase";

export class PedidoController {
  constructor(private readonly listPedidosUseCase: ListPedidosUseCase) {}

  async listar(req: Request, res: Response) {
    const pedidos = await this.listPedidosUseCase.execute();
    res.json({ pedidos });
  }
}
