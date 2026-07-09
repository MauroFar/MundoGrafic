import { Request, Response } from "express";
import { GetCotizacionDetallesUseCase } from "../../application/use-cases/GetCotizacionDetallesUseCase";
import { CreateCotizacionDetalleUseCase } from "../../application/use-cases/CreateCotizacionDetalleUseCase";
import { ReplaceCotizacionDetallesUseCase } from "../../application/use-cases/ReplaceCotizacionDetallesUseCase";

export class CotizacionDetalleController {
  constructor(
    private readonly getCotizacionDetallesUseCase: GetCotizacionDetallesUseCase,
    private readonly createCotizacionDetalleUseCase: CreateCotizacionDetalleUseCase,
    private readonly replaceCotizacionDetallesUseCase: ReplaceCotizacionDetallesUseCase,
  ) {}

  obtenerPorCotizacionId = async (req: Request, res: Response) => {
    try {
      const cotizacionId = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(cotizacionId) || cotizacionId <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const detalles = await this.getCotizacionDetallesUseCase.execute(cotizacionId);
      return res.json(detalles);
    } catch (error) {
      console.error("Error al obtener detalles de la cotización:", error);
      return res.status(500).json({ error: "Error al obtener los detalles de la cotización" });
    }
  };

  crear = async (req: Request, res: Response) => {
    try {
      const detalle = await this.createCotizacionDetalleUseCase.execute(req.body as any);
      return res.json(detalle);
    } catch (error: any) {
      const message = error?.message || "Error al insertar detalle de cotización";
      if (message.startsWith("Faltan") || message.startsWith("Debe agregar")) {
        return res.status(400).json({ error: message });
      }

      console.error("Error al insertar detalle de cotización:", error);
      return res.status(500).json({ error: "Error al insertar detalle de cotización" });
    }
  };

  reemplazarPorCotizacionId = async (req: Request, res: Response) => {
    try {
      const cotizacionId = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(cotizacionId) || cotizacionId <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const detalles = (req.body as any)?.detalles;
      const resultados = await this.replaceCotizacionDetallesUseCase.execute(cotizacionId, detalles);
      return res.json(resultados);
    } catch (error: any) {
      const message = error?.message || "Error al actualizar los detalles de la cotización";
      if (
        message.startsWith("Se requiere")
        || message.startsWith("Falta")
        || message.startsWith("Cada detalle")
        || message.startsWith("Faltan")
      ) {
        return res.status(400).json({ error: message });
      }

      console.error("Error al actualizar los detalles de la cotización:", error);
      return res.status(500).json({ error: message || "Error al actualizar los detalles de la cotización" });
    }
  };
}
