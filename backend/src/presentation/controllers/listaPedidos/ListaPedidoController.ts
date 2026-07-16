import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ListPedidosUseCase } from "../../../application/use-cases/listaPedidos/ListPedidosUseCase";
import { CreatePedidoUseCase } from "../../../application/use-cases/listaPedidos/CreatePedidoUseCase";
import { UpdatePedidoUseCase } from "../../../application/use-cases/listaPedidos/UpdatePedidoUseCase";
import { DeletePedidoUseCase } from "../../../application/use-cases/listaPedidos/DeletePedidoUseCase";

export class ListaPedidoController {
  constructor(
    private readonly listUseCase: ListPedidosUseCase,
    private readonly createUseCase: CreatePedidoUseCase,
    private readonly updateUseCase: UpdatePedidoUseCase,
    private readonly deleteUseCase: DeletePedidoUseCase,
  ) {}

  listar = async (req: Request, res: Response) => {
    try {
      const tipo = req.query.tipo as string | undefined;
      const tipoValidado = tipo === "offset" || tipo === "digital" ? tipo : undefined;
      const pedidos = await this.listUseCase.execute(tipoValidado);
      res.json({ success: true, pedidos });
    } catch (e) { this._handle(res, e); }
  };

  crear = async (req: any, res: Response) => {
    try {
      const pedido = await this.createUseCase.execute(req.body, req.user?.id ?? null);
      res.status(201).json({ success: true, pedido });
    } catch (e) { this._handle(res, e); }
  };

  editar = async (req: any, res: Response) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ error: "ID inválido." });
      const pedido = await this.updateUseCase.execute(id, req.body, req.user?.id ?? null);
      res.json({ success: true, pedido });
    } catch (e) { this._handle(res, e); }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0)
        return res.status(400).json({ error: "ID inválido." });
      await this.deleteUseCase.execute(id);
      res.json({ success: true, id });
    } catch (e) { this._handle(res, e); }
  };

  private _handle(res: Response, e: unknown) {
    if (e instanceof AppError) return res.status(e.statusCode).json({ error: e.message });
    const msg = e instanceof Error ? e.message : "Error interno";
    res.status(500).json({ error: msg });
  }
}
