import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { GetModulosDisponiblesUseCase } from "../../../application/use-cases/permisos/GetModulosDisponiblesUseCase";
import { GetPermisosUsuarioUseCase } from "../../../application/use-cases/permisos/GetPermisosUsuarioUseCase";
import { UpdatePermisosUsuarioUseCase } from "../../../application/use-cases/permisos/UpdatePermisosUsuarioUseCase";
import { VerificarPermisoUseCase } from "../../../application/use-cases/permisos/VerificarPermisoUseCase";
import { PermisoRepository } from "../../../domain/repositories/permisos/PermisoRepository";
import { getCrudModules } from "../../../config/permissionCatalog";

export class PermisoController {
  constructor(
    private readonly modulosUseCase: GetModulosDisponiblesUseCase,
    private readonly getPermisosUseCase: GetPermisosUsuarioUseCase,
    private readonly updateUseCase: UpdatePermisosUsuarioUseCase,
    private readonly verificarUseCase: VerificarPermisoUseCase,
    private readonly repo: PermisoRepository,
  ) {}

  modulosDisponibles = async (req: any, res: Response) => {
    try {
      const result = await this.modulosUseCase.execute(req.user.id, req.user.rol);
      res.json(result);
    } catch (e) { this._handle(res, e); }
  };

  catalogo = async (_req: Request, res: Response) => {
    res.json(getCrudModules());
  };

  getByUsuario = async (req: any, res: Response) => {
    try {
      const usuarioId = Number.parseInt(req.params.usuarioId, 10);
      res.json(await this.repo.findByUsuario(usuarioId));
    } catch (e) { this._handle(res, e); }
  };

  misPermisos = async (req: any, res: Response) => {
    try {
      const esAdmin = req.user?.rol === "admin";
      res.json(await this.getPermisosUseCase.execute(req.user.id, esAdmin));
    } catch (e) { this._handle(res, e); }
  };

  update = async (req: any, res: Response) => {
    try {
      const usuarioId = Number.parseInt(req.params.usuarioId, 10);
      await this.updateUseCase.execute(usuarioId, req.body.permisos);
      res.json({ message: "Permisos actualizados exitosamente" });
    } catch (e) { this._handle(res, e); }
  };

  verificar = async (req: any, res: Response) => {
    try {
      const { modulo, accion } = req.body;
      const esAdmin = req.user?.rol === "admin";
      const tiene = await this.verificarUseCase.execute(req.user.id, modulo, accion, esAdmin);
      res.json({ tiene_permiso: tiene });
    } catch (e) { this._handle(res, e); }
  };

  private _handle(res: Response, e: unknown) {
    if (e instanceof AppError) return res.status(e.statusCode).json({ error: e.message });
    const msg = e instanceof Error ? e.message : "Error interno";
    res.status(500).json({ error: msg });
  }
}
