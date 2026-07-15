import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ListRegistrosOperarioUseCase } from "../../../application/use-cases/registrosOperario/ListRegistrosOperarioUseCase";
import { CreateRegistroOperarioUseCase } from "../../../application/use-cases/registrosOperario/CreateRegistroOperarioUseCase";

export class RegistroOperarioController {
  constructor(
    private readonly listUseCase: ListRegistrosOperarioUseCase,
    private readonly createUseCase: CreateRegistroOperarioUseCase,
  ) {}

  listar = async (req: Request, res: Response) => {
    try {
      const { fechaDesde, fechaHasta, operario, maquina, actividad, limit } = req.query as any;
      const registros = await this.listUseCase.execute({
        fechaDesde: fechaDesde ? String(fechaDesde) : undefined,
        fechaHasta: fechaHasta ? String(fechaHasta) : undefined,
        operario:   operario   ? String(operario)   : undefined,
        maquina:    maquina    ? String(maquina)     : undefined,
        actividad:  actividad  ? String(actividad)   : undefined,
        limit:      limit      ? Number(limit)       : undefined,
      });
      res.json({ success: true, registros });
    } catch (e) { this._handle(res, e); }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const registro = await this.createUseCase.execute(req.body);
      res.status(201).json({ success: true, registro });
    } catch (e) { this._handle(res, e); }
  };

  private _handle(res: Response, e: unknown) {
    if (e instanceof AppError) return res.status(e.statusCode).json({ error: e.message });
    const msg = e instanceof Error ? e.message : "Error interno";
    res.status(500).json({ error: msg });
  }
}
