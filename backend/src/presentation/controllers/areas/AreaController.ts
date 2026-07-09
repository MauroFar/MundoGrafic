import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { GetActiveAreasUseCase } from "../../../application/use-cases/areas/GetActiveAreasUseCase";
import { GetAllAreasUseCase } from "../../../application/use-cases/areas/GetAllAreasUseCase";
import { GetAreaByIdUseCase } from "../../../application/use-cases/areas/GetAreaByIdUseCase";
import { CreateAreaUseCase } from "../../../application/use-cases/areas/CreateAreaUseCase";
import { UpdateAreaUseCase } from "../../../application/use-cases/areas/UpdateAreaUseCase";
import { DeleteAreaUseCase } from "../../../application/use-cases/areas/DeleteAreaUseCase";

export class AreaController {
  constructor(
    private readonly getActiveAreasUseCase: GetActiveAreasUseCase,
    private readonly getAllAreasUseCase: GetAllAreasUseCase,
    private readonly getAreaByIdUseCase: GetAreaByIdUseCase,
    private readonly createAreaUseCase: CreateAreaUseCase,
    private readonly updateAreaUseCase: UpdateAreaUseCase,
    private readonly deleteAreaUseCase: DeleteAreaUseCase,
  ) {}

  listarActivas = async (_req: Request, res: Response) => {
    try {
      const areas = await this.getActiveAreasUseCase.execute();
      return res.json(areas);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error obteniendo areas";
      return res.status(500).json({ error: "Error obteniendo áreas", details: message });
    }
  };

  listarTodas = async (_req: Request, res: Response) => {
    try {
      const areas = await this.getAllAreasUseCase.execute();
      return res.json(areas);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error obteniendo areas";
      return res.status(500).json({ error: "Error obteniendo áreas", details: message });
    }
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const area = await this.getAreaByIdUseCase.execute(id);
      if (!area) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      return res.json(area);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error obteniendo area";
      return res.status(500).json({ error: "Error obteniendo área", details: message });
    }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const area = await this.createAreaUseCase.execute(req.body || {});
      return res.status(201).json(area);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error creando area";
      return res.status(500).json({ error: "Error creando área", details: message });
    }
  };

  editar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const area = await this.updateAreaUseCase.execute(id, req.body || {});
      if (!area) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      return res.json(area);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error actualizando area";
      return res.status(500).json({ error: "Error actualizando área", details: message });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      const result = await this.deleteAreaUseCase.execute(id);
      if (result.missing) {
        return res.status(404).json({ error: "Área no encontrada" });
      }

      if (!result.deleted) {
        return res.status(400).json({
          error: "No se puede eliminar el área porque hay usuarios asignados a ella",
          usuarios_afectados: result.usersAffected,
        });
      }

      return res.json({ message: "Área eliminada correctamente" });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error eliminando area";
      return res.status(500).json({ error: "Error eliminando área", details: message });
    }
  };
}
