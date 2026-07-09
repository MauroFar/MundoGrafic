import { Request, Response } from "express";
import { CreateCotizacionUseCase } from "../../application/use-cases/CreateCotizacionUseCase";
import { UpdateCotizacionUseCase } from "../../application/use-cases/UpdateCotizacionUseCase";
import { DeleteCotizacionUseCase } from "../../application/use-cases/DeleteCotizacionUseCase";
import { ApproveCotizacionUseCase } from "../../application/use-cases/ApproveCotizacionUseCase";
import { RejectCotizacionUseCase } from "../../application/use-cases/RejectCotizacionUseCase";

export class CotizacionCommandController {
  constructor(
    private readonly createCotizacionUseCase: CreateCotizacionUseCase,
    private readonly updateCotizacionUseCase: UpdateCotizacionUseCase,
    private readonly deleteCotizacionUseCase: DeleteCotizacionUseCase,
    private readonly approveCotizacionUseCase: ApproveCotizacionUseCase,
    private readonly rejectCotizacionUseCase: RejectCotizacionUseCase,
  ) {}

  crear = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user || {};
      const cotizacion = await this.createCotizacionUseCase.execute({
        ...req.body,
        userId: user.id,
        userNombre: user.nombre,
      });

      return res.json(cotizacion);
    } catch (error) {
      console.error("Error al insertar cotización:", error);
      return res.status(500).json({ error: "Error al insertar cotización" });
    }
  };

  actualizar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const user = (req as any).user || {};
      const result = await this.updateCotizacionUseCase.execute({
        id,
        ...req.body,
        updatedBy: user.id,
      });

      if (result.type === "not_found") {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      if (result.type === "blocked") {
        return res.status(400).json({
          error: "No se puede actualizar una cotización aprobada o rechazada. Debe guardarse como nueva.",
        });
      }

      return res.json(result.cotizacion);
    } catch (error) {
      console.error("Error al actualizar la cotización:", error);
      return res.status(500).json({ error: "Error al actualizar la cotización" });
    }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const result = await this.deleteCotizacionUseCase.execute(id);

      if (result.type === "not_found") {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      if (result.type === "blocked") {
        return res.status(400).json({
          error: "No se puede eliminar una cotización aprobada o rechazada.",
        });
      }

      return res.json({
        success: true,
        message: "Cotización eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar la cotización:", error);
      return res.status(500).json({ error: "Error al eliminar la cotización" });
    }
  };

  aprobar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const observacionNormalizada = String((req.body as any)?.observacion || "").trim();
      const result = await this.approveCotizacionUseCase.execute(id, observacionNormalizada || null);

      if (result.type === "not_found") {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      return res.json(result.cotizacion);
    } catch (error) {
      console.error("Error al aprobar la cotización:", error);
      return res.status(500).json({ error: "Error al aprobar la cotización" });
    }
  };

  rechazar = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const motivoNormalizado = String((req.body as any)?.motivo || "").trim();
      if (!motivoNormalizado) {
        return res.status(400).json({ error: "El motivo de rechazo es obligatorio" });
      }

      const result = await this.rejectCotizacionUseCase.execute(id, motivoNormalizado);
      if (result.type === "not_found") {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      return res.json(result.cotizacion);
    } catch (error) {
      console.error("Error al rechazar la cotización:", error);
      return res.status(500).json({ error: "Error al rechazar la cotización" });
    }
  };
}
