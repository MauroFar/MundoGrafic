import { Request, Response } from "express";
import { ListCotizacionesUseCase } from "../../application/use-cases/ListCotizacionesUseCase";
import { GetCotizacionByIdUseCase } from "../../application/use-cases/GetCotizacionByIdUseCase";

export class CotizacionQueryController {
  constructor(
    private readonly listCotizacionesUseCase: ListCotizacionesUseCase,
    private readonly getCotizacionByIdUseCase: GetCotizacionByIdUseCase,
  ) {}

  listarTodas = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user || {};
      const { busqueda, fechaDesde, fechaHasta, limite, offset, tipo } = req.query as any;
      const tipoNormalizado = typeof tipo === "string" ? tipo.trim().toLowerCase() : undefined;

      const cotizaciones = await this.listCotizacionesUseCase.execute({
        busqueda,
        fechaDesde,
        fechaHasta,
        limite: limite ? Number(limite) : 20,
        offset: offset ? Number(offset) : 0,
        tipo: tipoNormalizado,
        userId: user?.id,
        userRol: user?.rol,
      });

      return res.json(cotizaciones);
    } catch (error: any) {
      return res.status(500).json({ error: `Error al obtener las cotizaciones: ${error?.message || "desconocido"}` });
    }
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID de cotización inválido" });
      }

      const cotizacion = await this.getCotizacionByIdUseCase.execute(id);
      if (!cotizacion) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      return res.json(cotizacion);
    } catch (_) {
      return res.status(500).json({ error: "Error al obtener cotización por ID" });
    }
  };
}
