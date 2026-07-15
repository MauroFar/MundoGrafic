import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ListPrensasUseCase } from "../../../application/use-cases/prensas/ListPrensasUseCase";
import { CreatePrensaUseCase } from "../../../application/use-cases/prensas/CreatePrensaUseCase";
import { UpdatePrensaUseCase } from "../../../application/use-cases/prensas/UpdatePrensaUseCase";
import { DeactivatePrensaUseCase } from "../../../application/use-cases/prensas/DeactivatePrensaUseCase";

export class PrensaController {
  constructor(
    private readonly listUseCase: ListPrensasUseCase,
    private readonly createUseCase: CreatePrensaUseCase,
    private readonly updateUseCase: UpdatePrensaUseCase,
    private readonly deactivateUseCase: DeactivatePrensaUseCase,
  ) {}

  listar = async (_req: Request, res: Response) => {
    try {
      res.json(await this.listUseCase.execute(true));
    } catch (e) { this._handle(res, e); }
  };

  listarTodas = async (req: any, res: Response) => {
    try {
      if (req.user?.rol !== "admin") return res.status(403).json({ error: "No autorizado" });
      res.json(await this.listUseCase.execute(false));
    } catch (e) { this._handle(res, e); }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const { nombre, descripcion } = req.body;
      const prensa = await this.createUseCase.execute(nombre, descripcion);
      res.status(201).json(prensa);
    } catch (e) { this._handle(res, e); }
  };

  editar = async (req: any, res: Response) => {
    try {
      if (req.user?.rol !== "admin") return res.status(403).json({ error: "No autorizado" });
      const id = Number.parseInt(req.params.id, 10);
      const { nombre, descripcion, activo } = req.body;
      res.json(await this.updateUseCase.execute(id, nombre, descripcion, activo));
    } catch (e) { this._handle(res, e); }
  };

  desactivar = async (req: any, res: Response) => {
    try {
      if (req.user?.rol !== "admin") return res.status(403).json({ error: "No autorizado" });
      const id = Number.parseInt(req.params.id, 10);
      await this.deactivateUseCase.execute(id);
      res.json({ message: "Prensa desactivada correctamente" });
    } catch (e) { this._handle(res, e); }
  };

  private _handle(res: Response, e: unknown) {
    if (e instanceof AppError) return res.status(e.statusCode).json({ error: e.message });
    const msg = e instanceof Error ? e.message : "Error interno";
    res.status(500).json({ error: msg });
  }
}
