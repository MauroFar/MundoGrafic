import { Response, Request } from "express";
import { PgDigitalCostosRepository } from "../../../infrastructure/persistence/repositories/digitalCostos/PgDigitalCostosRepository";

export class DigitalCostosController {
  constructor(private readonly repo: PgDigitalCostosRepository) {}

  listarMateriales = async (_req: Request, res: Response) => {
    try {
      const materiales = await this.repo.listarMateriales();
      return res.json(materiales);
    } catch (error) {
      console.error("Error listando materiales digitales:", error);
      return res.status(500).json({ error: "Error listando materiales digitales" });
    }
  };

  crearMaterial = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const material = await this.repo.crearMaterial(req.body || {}, usuarioId);
      return res.status(201).json(material);
    } catch (error) {
      console.error("Error creando material digital:", error);
      return res.status(500).json({ error: "Error creando material digital" });
    }
  };

  actualizarMaterial = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const material = await this.repo.actualizarMaterial(Number(req.params.id), req.body || {}, usuarioId);
      if (!material) {
        return res.status(404).json({ error: "Material no encontrado" });
      }
      return res.json(material);
    } catch (error) {
      console.error("Error actualizando material digital:", error);
      return res.status(500).json({ error: "Error actualizando material digital" });
    }
  };

  eliminarMaterial = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const ok = await this.repo.eliminarMaterial(Number(req.params.id), usuarioId);
      if (!ok) {
        return res.status(404).json({ error: "Material no encontrado" });
      }
      return res.json({ message: "Material eliminado" });
    } catch (error) {
      console.error("Error eliminando material digital:", error);
      return res.status(500).json({ error: "Error eliminando material digital" });
    }
  };

  listarProcesos = async (_req: Request, res: Response) => {
    try {
      const procesos = await this.repo.listarProcesos();
      return res.json(procesos);
    } catch (error) {
      console.error("Error listando procesos digitales:", error);
      return res.status(500).json({ error: "Error listando procesos digitales" });
    }
  };

  crearProceso = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const proceso = await this.repo.crearProceso(req.body || {}, usuarioId);
      return res.status(201).json(proceso);
    } catch (error) {
      console.error("Error creando proceso digital:", error);
      return res.status(500).json({ error: "Error creando proceso digital" });
    }
  };

  actualizarProceso = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const proceso = await this.repo.actualizarProceso(Number(req.params.id), req.body || {}, usuarioId);
      if (!proceso) {
        return res.status(404).json({ error: "Proceso no encontrado" });
      }
      return res.json(proceso);
    } catch (error) {
      console.error("Error actualizando proceso digital:", error);
      return res.status(500).json({ error: "Error actualizando proceso digital" });
    }
  };

  eliminarProceso = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const ok = await this.repo.eliminarProceso(Number(req.params.id), usuarioId);
      if (!ok) {
        return res.status(404).json({ error: "Proceso no encontrado" });
      }
      return res.json({ message: "Proceso eliminado" });
    } catch (error) {
      console.error("Error eliminando proceso digital:", error);
      return res.status(500).json({ error: "Error eliminando proceso digital" });
    }
  };

  listarCostosOperativos = async (_req: Request, res: Response) => {
    try {
      const costos = await this.repo.listarCostosOperativos();
      return res.json(costos);
    } catch (error) {
      console.error("Error listando costos operativos digitales:", error);
      return res.status(500).json({ error: "Error listando costos operativos digitales" });
    }
  };

  crearCostoOperativo = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const costo = await this.repo.crearCostoOperativo(req.body || {}, usuarioId);
      return res.status(201).json(costo);
    } catch (error) {
      console.error("Error creando costo operativo digital:", error);
      return res.status(500).json({ error: "Error creando costo operativo digital" });
    }
  };

  actualizarCostoOperativo = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const costo = await this.repo.actualizarCostoOperativo(Number(req.params.id), req.body || {}, usuarioId);
      if (!costo) {
        return res.status(404).json({ error: "Costo operativo no encontrado" });
      }
      return res.json(costo);
    } catch (error) {
      console.error("Error actualizando costo operativo digital:", error);
      return res.status(500).json({ error: "Error actualizando costo operativo digital" });
    }
  };

  eliminarCostoOperativo = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const ok = await this.repo.eliminarCostoOperativo(Number(req.params.id), usuarioId);
      if (!ok) {
        return res.status(404).json({ error: "Costo operativo no encontrado" });
      }
      return res.json({ message: "Costo operativo eliminado" });
    } catch (error) {
      console.error("Error eliminando costo operativo digital:", error);
      return res.status(500).json({ error: "Error eliminando costo operativo digital" });
    }
  };

  obtenerConfiguracionComercial = async (_req: Request, res: Response) => {
    try {
      const data = await this.repo.obtenerConfiguracionComercial();
      const configuracion = data.configuracion ?? await this.repo.crearConfiguracionComercial(((_req as any).user?.id) ?? null);
      const payload = await this.repo.obtenerConfiguracionComercial();
      return res.json({
        configuracion: payload.configuracion,
        margenes: payload.margenes,
        plazos: payload.plazos,
      });
    } catch (error) {
      console.error("Error obteniendo configuración comercial:", error);
      return res.status(500).json({ error: "Error obteniendo configuración comercial" });
    }
  };

  crearMargen = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const margen = await this.repo.crearMargen(req.body || {}, usuarioId);
      return res.status(201).json(margen);
    } catch (error) {
      console.error("Error creando margen comercial:", error);
      return res.status(500).json({ error: "Error creando margen comercial" });
    }
  };

  actualizarMargen = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const margen = await this.repo.actualizarMargen(Number(req.params.id), req.body || {}, usuarioId);
      if (!margen) {
        return res.status(404).json({ error: "Margen no encontrado" });
      }
      return res.json(margen);
    } catch (error) {
      console.error("Error actualizando margen comercial:", error);
      return res.status(500).json({ error: "Error actualizando margen comercial" });
    }
  };

  eliminarMargen = async (req: Request, res: Response) => {
    try {
      const ok = await this.repo.eliminarMargen(Number(req.params.id));
      if (!ok) {
        return res.status(404).json({ error: "Margen no encontrado" });
      }
      return res.json({ message: "Margen eliminado" });
    } catch (error) {
      console.error("Error eliminando margen comercial:", error);
      return res.status(500).json({ error: "Error eliminando margen comercial" });
    }
  };

  crearPlazo = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const plazo = await this.repo.crearPlazo(req.body || {}, usuarioId);
      return res.status(201).json(plazo);
    } catch (error) {
      console.error("Error creando plazo comercial:", error);
      return res.status(500).json({ error: "Error creando plazo comercial" });
    }
  };

  actualizarPlazo = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id ?? null;
      const plazo = await this.repo.actualizarPlazo(Number(req.params.id), req.body || {}, usuarioId);
      if (!plazo) {
        return res.status(404).json({ error: "Plazo no encontrado" });
      }
      return res.json(plazo);
    } catch (error) {
      console.error("Error actualizando plazo comercial:", error);
      return res.status(500).json({ error: "Error actualizando plazo comercial" });
    }
  };

  eliminarPlazo = async (req: Request, res: Response) => {
    try {
      const ok = await this.repo.eliminarPlazo(Number(req.params.id));
      if (!ok) {
        return res.status(404).json({ error: "Plazo no encontrado" });
      }
      return res.json({ message: "Plazo eliminado" });
    } catch (error) {
      console.error("Error eliminando plazo comercial:", error);
      return res.status(500).json({ error: "Error eliminando plazo comercial" });
    }
  };
}
