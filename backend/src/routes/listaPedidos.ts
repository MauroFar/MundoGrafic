import express from "express";
import authRequired from "../middleware/auth";

const ESTADOS_PERMITIDOS = [
  "Sin empezar",
  "En proceso",
  "Atrasado",
  "Completo",
  "Rechazado",
] as const;

const FASES_PERMITIDAS = [
  "Aprobacion de ficha tecnica",
  "Preprensa",
  "Guillotinado",
  "Prensa",
  "Barnizado",
  "Plastificado",
  "Troquelado",
  "Pegado",
  "Terminados MG",
  "Terminados externos",
  "Empaque",
  "Liberado",
  "Facturado",
  "Entregado",
  "Entrega incompleta",
] as const;

function sanitizeText(value: unknown, maxLength = 2000): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeCatalog(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

const estadoMap = new Map<string, string>(
  ESTADOS_PERMITIDOS.map((estado) => [normalizeCatalog(estado), estado])
);

const faseMap = new Map<string, string>(
  FASES_PERMITIDAS.map((fase) => [normalizeCatalog(fase), fase])
);

type PedidoPayload = {
  fecha_ingreso_pedido: string;
  fecha_entrega: string | null;
  responsable_nombre: string;
  cliente: string;
  descripcion_producto: string;
  cantidad: number;
  no_oc: string | null;
  no_op: string | null;
  estado: string;
  fase: string | null;
  no_factura: string | null;
  observaciones: string | null;
};

function validarPayload(body: any): { valid: true; data: PedidoPayload } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  const fechaIngreso = sanitizeText(body?.fecha_ingreso_pedido, 10);
  const fechaEntregaRaw = sanitizeText(body?.fecha_entrega, 10);
  const responsable = sanitizeText(body?.responsable_nombre, 180);
  const cliente = sanitizeText(body?.cliente, 180);
  const descripcion = sanitizeText(body?.descripcion_producto, 2000);
  const noOc = sanitizeText(body?.no_oc, 100);
  const noOp = sanitizeText(body?.no_op, 100);
  const noFactura = sanitizeText(body?.no_factura, 100);
  const observaciones = sanitizeText(body?.observaciones, 4000);

  const estadoRaw = sanitizeText(body?.estado, 80);
  const faseRaw = sanitizeText(body?.fase, 120);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaIngreso)) {
    errors.push("fecha_ingreso_pedido debe tener formato YYYY-MM-DD.");
  }

  if (fechaEntregaRaw && !/^\d{4}-\d{2}-\d{2}$/.test(fechaEntregaRaw)) {
    errors.push("fecha_entrega debe tener formato YYYY-MM-DD.");
  }

  if (!responsable) errors.push("responsable_nombre es obligatorio.");
  if (!cliente) errors.push("cliente es obligatorio.");
  if (!descripcion) errors.push("descripcion_producto es obligatorio.");

  const cantidadNum = Number(body?.cantidad);
  if (!Number.isFinite(cantidadNum) || cantidadNum < 0) {
    errors.push("cantidad debe ser un numero mayor o igual a 0.");
  }

  const estado = estadoRaw ? estadoMap.get(normalizeCatalog(estadoRaw)) : "Sin empezar";
  if (!estado) errors.push("estado invalido.");

  const fase = faseRaw ? faseMap.get(normalizeCatalog(faseRaw)) : null;
  if (faseRaw && !fase) errors.push("fase invalida.");

  if (errors.length) return { valid: false, errors };

  return {
    valid: true,
    data: {
      fecha_ingreso_pedido: fechaIngreso,
      fecha_entrega: fechaEntregaRaw || null,
      responsable_nombre: responsable,
      cliente,
      descripcion_producto: descripcion,
      cantidad: Number(cantidadNum.toFixed(2)),
      no_oc: noOc || null,
      no_op: noOp || null,
      estado: estado || "Sin empezar",
      fase: fase || null,
      no_factura: noFactura || null,
      observaciones: observaciones || null,
    },
  };
}

export default (client: any) => {
  const router = express.Router();

  router.get("/", authRequired(["admin", "ejecutivo", "impresion"]), async (_req: any, res: any) => {
    try {
      const result = await client.query(
        `SELECT *
         FROM lista_pedidos
         ORDER BY created_at DESC, id DESC`
      );
      return res.json({ success: true, pedidos: result.rows });
    } catch (error: any) {
      console.error("Error listando pedidos:", error);
      return res.status(500).json({ error: "Error interno al listar pedidos." });
    }
  });

  router.post("/", authRequired(["admin", "ejecutivo", "impresion"]), async (req: any, res: any) => {
    const parsed = validarPayload(req.body || {});
    if ("errors" in parsed) {
      return res.status(400).json({ error: "Datos invalidos.", detalles: parsed.errors });
    }

    try {
      const userId = req.user?.id || null;
      const p = parsed.data;
      const result = await client.query(
        `INSERT INTO lista_pedidos (
           fecha_ingreso_pedido, fecha_entrega,
           responsable_nombre, cliente, descripcion_producto,
           cantidad, no_oc, no_op, estado, fase, no_factura, observaciones,
           created_by, updated_by
         ) VALUES (
           $1, $2,
           $3, $4, $5,
           $6, $7, $8, $9, $10, $11, $12,
           $13, $14
         )
         RETURNING *`,
        [
          p.fecha_ingreso_pedido,
          p.fecha_entrega,
          p.responsable_nombre,
          p.cliente,
          p.descripcion_producto,
          p.cantidad,
          p.no_oc,
          p.no_op,
          p.estado,
          p.fase,
          p.no_factura,
          p.observaciones,
          userId,
          userId,
        ]
      );

      return res.status(201).json({ success: true, pedido: result.rows[0] });
    } catch (error: any) {
      console.error("Error creando pedido:", error);
      return res.status(500).json({ error: "Error interno al crear pedido." });
    }
  });

  router.put("/:id", authRequired(["admin", "ejecutivo", "impresion"]), async (req: any, res: any) => {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID invalido." });
    }

    const parsed = validarPayload(req.body || {});
    if ("errors" in parsed) {
      return res.status(400).json({ error: "Datos invalidos.", detalles: parsed.errors });
    }

    try {
      const userId = req.user?.id || null;
      const p = parsed.data;

      const result = await client.query(
        `UPDATE lista_pedidos
         SET fecha_ingreso_pedido = $1,
             fecha_entrega = $2,
             responsable_nombre = $3,
             cliente = $4,
             descripcion_producto = $5,
             cantidad = $6,
             no_oc = $7,
             no_op = $8,
             estado = $9,
             fase = $10,
             no_factura = $11,
             observaciones = $12,
             updated_by = $13
         WHERE id = $14
         RETURNING *`,
        [
          p.fecha_ingreso_pedido,
          p.fecha_entrega,
          p.responsable_nombre,
          p.cliente,
          p.descripcion_producto,
          p.cantidad,
          p.no_oc,
          p.no_op,
          p.estado,
          p.fase,
          p.no_factura,
          p.observaciones,
          userId,
          id,
        ]
      );

      if (!result.rowCount) {
        return res.status(404).json({ error: "Pedido no encontrado." });
      }

      return res.json({ success: true, pedido: result.rows[0] });
    } catch (error: any) {
      console.error("Error actualizando pedido:", error);
      return res.status(500).json({ error: "Error interno al actualizar pedido." });
    }
  });

  router.delete("/:id", authRequired(["admin", "ejecutivo", "impresion"]), async (req: any, res: any) => {
    const id = Number.parseInt(String(req.params.id), 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID invalido." });
    }

    try {
      const result = await client.query(
        `DELETE FROM lista_pedidos
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      if (!result.rowCount) {
        return res.status(404).json({ error: "Pedido no encontrado." });
      }

      return res.json({ success: true, id });
    } catch (error: any) {
      console.error("Error eliminando pedido:", error);
      return res.status(500).json({ error: "Error interno al eliminar pedido." });
    }
  });

  return router;
};
