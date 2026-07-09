import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { GetActiveRolesUseCase } from "../../../application/use-cases/roles/GetActiveRolesUseCase";
import { GetAllRolesUseCase } from "../../../application/use-cases/roles/GetAllRolesUseCase";
import { GetRolByIdUseCase } from "../../../application/use-cases/roles/GetRolByIdUseCase";
import { CreateRolUseCase } from "../../../application/use-cases/roles/CreateRolUseCase";
import { UpdateRolUseCase } from "../../../application/use-cases/roles/UpdateRolUseCase";
import { DeleteRolUseCase } from "../../../application/use-cases/roles/DeleteRolUseCase";

export class RolController {
  constructor(
    private readonly getActiveRolesUseCase: GetActiveRolesUseCase,
    private readonly getAllRolesUseCase: GetAllRolesUseCase,
    private readonly getRolByIdUseCase: GetRolByIdUseCase,
    private readonly createRolUseCase: CreateRolUseCase,
    private readonly updateRolUseCase: UpdateRolUseCase,
    private readonly deleteRolUseCase: DeleteRolUseCase,
  ) {}

  listarActivos = async (_req: Request, res: Response) => {
    try {
      const roles = await this.getActiveRolesUseCase.execute();
      return res.json(roles);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error obteniendo roles";
      return res.status(500).json({ error: "Error obteniendo roles", details: message });
    }
  };

  listarTodos = async (_req: Request, res: Response) => {
    try {
      const roles = await this.getAllRolesUseCase.execute();
      return res.json(roles);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error obteniendo roles";
      return res.status(500).json({ error: "Error obteniendo roles", details: message });
    }
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const rol = await this.getRolByIdUseCase.execute(id);
      if (!rol) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      return res.json(rol);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error obteniendo rol";
      return res.status(500).json({ error: "Error obteniendo rol", details: message });
    }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const rol = await this.createRolUseCase.execute(req.body || {});
      return res.status(201).json(rol);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error creando rol";
      return res.status(500).json({ error: "Error creando rol", details: message });
    }
  };

  editar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const rol = await this.updateRolUseCase.execute(id, req.body || {});
      if (!rol) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      return res.json(rol);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error actualizando rol";
      return res.status(500).json({ error: "Error actualizando rol", details: message });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const result = await this.deleteRolUseCase.execute(id);
      if (result.missing) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }

      if (!result.deleted) {
        return res.status(400).json({
          error: "No se puede eliminar el rol porque hay usuarios asignados a él",
          usuarios_afectados: result.usersAffected,
        });
      }

      return res.json({ message: "Rol eliminado correctamente" });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error eliminando rol";
      return res.status(500).json({ error: "Error eliminando rol", details: message });
    }
  };
}
