import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ListReportesUseCase } from "../../../application/use-cases/reportesTrabajo/ListReportesUseCase";
import { CreateReporteUseCase } from "../../../application/use-cases/reportesTrabajo/CreateReporteUseCase";
import { UpdateReporteUseCase } from "../../../application/use-cases/reportesTrabajo/UpdateReporteUseCase";
import { DeleteReporteUseCase } from "../../../application/use-cases/reportesTrabajo/DeleteReporteUseCase";
import { GetFechasReporteUseCase } from "../../../application/use-cases/reportesTrabajo/GetFechasReporteUseCase";
import { ReporteTrabajoRepository } from "../../../domain/repositories/reportesTrabajo/ReporteTrabajoRepository";

export class ReporteTrabajoController {
  constructor(
    private readonly listUseCase: ListReportesUseCase,
    private readonly createUseCase: CreateReporteUseCase,
    private readonly updateUseCase: UpdateReporteUseCase,
    private readonly deleteUseCase: DeleteReporteUseCase,
    private readonly fechasUseCase: GetFechasReporteUseCase,
    private readonly repo: ReporteTrabajoRepository,
  ) {}

  catalogos = async (_req: Request, res: Response) => {
    try {
      res.json(await this.repo.getCatalogos());
    } catch (e) { this._handle(res, e); }
  };

  miContexto = async (req: any, res: Response) => {
    try {
      if (!req.user?.id) return res.status(401).json({ error: "Usuario no autenticado" });
      const ctx = await this.repo.getContextoUsuario(req.user.id);
      res.json(ctx ?? null);
    } catch (e) { this._handle(res, e); }
  };

  listar = async (req: Request, res: Response) => {
    try {
      const { area_id, operador_id, fecha, fecha_desde, fecha_hasta } = req.query as any;
      res.json(await this.listUseCase.execute({
        area_id:     area_id     ? Number(area_id)     : undefined,
        operador_id: operador_id ? Number(operador_id) : undefined,
        fecha:       fecha       ? String(fecha)       : undefined,
        fecha_desde: fecha_desde ? String(fecha_desde) : undefined,
        fecha_hasta: fecha_hasta ? String(fecha_hasta) : undefined,
      }));
    } catch (e) { this._handle(res, e); }
  };

  crear = async (req: any, res: Response) => {
    try {
      res.json(await this.createUseCase.execute(req.body, req.user?.id));
    } catch (e) { this._handle(res, e); }
  };

  editar = async (req: any, res: Response) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      res.json(await this.updateUseCase.execute(id, req.body, req.user?.id));
    } catch (e) { this._handle(res, e); }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      await this.deleteUseCase.execute(Number.parseInt(req.params.id, 10));
      res.json({ ok: true });
    } catch (e) { this._handle(res, e); }
  };

  fechas = async (req: any, res: Response) => {
    try {
      const { operador_id, area_id, fecha_desde, fecha_hasta } = req.query as any;
      if (!operador_id) return res.status(400).json({ error: "operador_id es requerido" });
      res.json(await this.fechasUseCase.execute(Number(operador_id), {
        area_id:     area_id     ? Number(area_id)     : undefined,
        fecha_desde: fecha_desde ? String(fecha_desde) : undefined,
        fecha_hasta: fecha_hasta ? String(fecha_hasta) : undefined,
      }));
    } catch (e) { this._handle(res, e); }
  };

  private _handle(res: Response, e: unknown) {
    if (e instanceof AppError) return res.status(e.statusCode).json({ error: e.message });
    const msg = e instanceof Error ? e.message : "Error interno";
    res.status(500).json({ error: msg });
  }
}
