import express from "express";
import { Request, Response } from "express";
import db from "../db/knex";
// import puppeteer from "puppeteer";

const router = express.Router();

// Obtener todas las cotizaciones
router.get("/", async (req: Request, res: Response) => {
  try {
    const cotizaciones = await db("cotizaciones")
      .select("*")
      .orderBy("fecha_creacion", "desc");
    res.json(cotizaciones);
  } catch (error) {
    console.error("Error obteniendo cotizaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Obtener cotización por ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cotizacion = await db("cotizaciones")
      .where("id", id)
      .first();

    if (!cotizacion) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    // Obtener detalles de la cotización
    const detalles = await db("cotizaciones_detalles")
      .where("cotizacion_id", id);

    res.json({
      ...cotizacion,
      detalles
    });
  } catch (error) {
    console.error("Error obteniendo cotización:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Crear nueva cotización
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      cliente_id,
      fecha_vencimiento,
      subtotal,
      iva,
      total,
      detalles,
      observaciones
    } = req.body;

    // Insertar cotización principal
    const [cotizacionId] = await db("cotizaciones").insert({
      cliente_id,
      fecha_creacion: new Date(),
      fecha_vencimiento,
      subtotal,
      iva,
      total,
      observaciones,
      estado: "pendiente"
    });

    // Insertar detalles
    if (detalles && detalles.length > 0) {
      const detallesConCotizacionId = detalles.map((detalle: any) => ({
        ...detalle,
        cotizacion_id: cotizacionId
      }));
      await db("cotizaciones_detalles").insert(detallesConCotizacionId);
    }

    res.status(201).json({
      id: cotizacionId,
      message: "Cotización creada exitosamente"
    });
  } catch (error) {
    console.error("Error creando cotización:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Actualizar cotización
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      fecha_vencimiento,
      subtotal,
      iva,
      total,
      detalles,
      observaciones,
      estado
    } = req.body;

    // Actualizar cotización principal
    await db("cotizaciones")
      .where("id", id)
      .update({
        cliente_id,
        fecha_vencimiento,
        subtotal,
        iva,
        total,
        observaciones,
        estado,
        fecha_actualizacion: new Date()
      });

    // Actualizar detalles si se proporcionan
    if (detalles) {
      // Eliminar detalles existentes
      await db("cotizaciones_detalles")
        .where("cotizacion_id", id)
        .del();

      // Insertar nuevos detalles
      if (detalles.length > 0) {
        const detallesConCotizacionId = detalles.map((detalle: any) => ({
          ...detalle,
          cotizacion_id: id
        }));
        await db("cotizaciones_detalles").insert(detallesConCotizacionId);
      }
    }

    res.json({ message: "Cotización actualizada exitosamente" });
  } catch (error) {
    console.error("Error actualizando cotización:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Eliminar cotización
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Eliminar detalles primero
    await db("cotizaciones_detalles")
      .where("cotizacion_id", id)
      .del();

    // Eliminar cotización
    await db("cotizaciones")
      .where("id", id)
      .del();

    res.json({ message: "Cotización eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando cotización:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Generar PDF de cotización (TEMPORALMENTE COMENTADO)
router.get("/:id/pdf", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obtener datos de la cotización
    const cotizacion = await db("cotizaciones")
      .where("id", id)
      .first();

    if (!cotizacion) {
      return res.status(404).json({ error: "Cotización no encontrada" });
    }

    // Obtener detalles
    const detalles = await db("cotizaciones_detalles")
      .where("cotizacion_id", id);

    // Obtener datos del cliente
    const cliente = await db("clientes")
      .where("id", cotizacion.cliente_id)
      .first();

    // TEMPORALMENTE COMENTADO - Generar PDF usando Puppeteer
    // browser = await puppeteer.launch({
    //   headless: "new",
    //   args: ['--no-sandbox', '--disable-setuid-sandbox']
    // });
    
    // Por ahora, retornar datos en lugar de PDF
    res.json({
      message: "Generación de PDF temporalmente deshabilitada",
      cotizacion: {
        ...cotizacion,
        detalles,
        cliente
      }
    });

  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
