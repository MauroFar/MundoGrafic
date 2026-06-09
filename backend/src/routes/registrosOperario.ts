import express from "express";
import authRequired from "../middleware/auth";

const MAQUINAS_PERMITIDAS = [
  "Plegadora Alba",
  "Plegadora ZH-880G",
  "Plegadora Mini",
  "Plegadora Tumix ZH-800G",
];

const ACTIVIDADES_PERMITIDAS = [
  "Limpieza",
  "Pegado lateral",
  "Pegado fondo automático",
  "Pegado de 4 puntas",
  "Pegado de 6 puntas",
  "Pegado cajas Tumix",
  "Pegado lateral metalizado",
  "Encaminado de máquina",
  "Pegado fondo automático y lineal",
];

const TARIFAS_POR_MILLAR: Record<string, number> = {
  Limpieza: 0,
  "Pegado lateral": 3,
  "Pegado fondo automático": 8,
  "Pegado de 4 puntas": 8,
  "Pegado de 6 puntas": 8,
  "Pegado cajas Tumix": 2,
  "Pegado lateral metalizado": 6,
  "Encaminado de máquina": 9,
  "Pegado fondo automático y lineal": 10,
};

const LIMITE_TEXTO_CORTO = 180;
const LIMITE_PRODUCTO = 500;
const LIMITE_TEXTO_LARGO = 2000;

function sanitizeText(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function calcMillares(cantidad: number): number {
  if (!Number.isInteger(cantidad) || cantidad < 100) return 0;
  return Math.ceil(cantidad / 1000);
}

export default (client: any) => {
  const router = express.Router();

  // GET /api/registros-operario
  router.get("/", authRequired(["admin", "ejecutivo", "impresion", "usuario"]), async (req: any, res: any) => {
    try {
      const { fechaDesde, fechaHasta, operario, maquina, actividad, limit } = req.query || {};

      const params: any[] = [];
      const where: string[] = [];

      if (fechaDesde) {
        params.push(sanitizeText(fechaDesde, 10));
        where.push(`fecha >= $${params.length}`);
      }

      if (fechaHasta) {
        params.push(sanitizeText(fechaHasta, 10));
        where.push(`fecha <= $${params.length}`);
      }

      if (operario) {
        params.push(`%${sanitizeText(operario, 150)}%`);
        where.push(`operario ILIKE $${params.length}`);
      }

      if (maquina) {
        params.push(sanitizeText(maquina, 80));
        where.push(`maquina = $${params.length}`);
      }

      if (actividad) {
        params.push(sanitizeText(actividad, 120));
        where.push(`actividad = $${params.length}`);
      }

      const safeLimit = Math.min(Math.max(Number.parseInt(String(limit || "500"), 10) || 500, 1), 2000);
      params.push(safeLimit);

      const sql = `
        SELECT id,
               fecha::text,
               operario,
               codigo_operario,
               cliente,
               orden_compra,
               lote,
               producto,
               cantidad,
               millares,
               maquina,
               actividad,
               tiempo_efectivo_min,
               tiempo_parado_min,
               pausas_texto,
               observaciones,
               ingreso_estimado,
               created_at,
               updated_at
        FROM registros_operario
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY fecha DESC, id DESC
        LIMIT $${params.length}
      `;

      const result = await client.query(sql, params);
      return res.json({ success: true, registros: result.rows });
    } catch (error: any) {
      console.error("Error listando registros de operario:", error);
      return res.status(500).json({ error: "Error interno al obtener registros." });
    }
  });

  // POST /api/registros-operario
  router.post("/", authRequired(["admin", "ejecutivo", "impresion", "usuario"]), async (req: any, res: any) => {
    try {
      const {
        fecha,
        operario,
        codigoOperario,
        cliente,
        ordenCompra,
        lote,
        producto,
        cantidad,
        maquina,
        actividad,
        tiempoEfectivoMin,
        tiempoParadoMin,
        pausasTexto,
        observaciones,
      } = req.body || {};

      const cleaned = {
        fecha: sanitizeText(fecha, 10),
        operario: sanitizeText(operario, 150),
        codigoOperario: sanitizeText(codigoOperario, 50),
        cliente: sanitizeText(cliente, LIMITE_TEXTO_CORTO),
        ordenCompra: sanitizeText(ordenCompra, 80),
        lote: sanitizeText(lote, 80),
        producto: sanitizeText(producto, LIMITE_PRODUCTO),
        maquina: sanitizeText(maquina, 80),
        actividad: sanitizeText(actividad, 120),
        pausasTexto: sanitizeText(pausasTexto, LIMITE_TEXTO_LARGO),
        observaciones: sanitizeText(observaciones, LIMITE_TEXTO_LARGO),
      };

      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned.fecha)) {
        return res.status(400).json({ error: "Fecha inválida. Usa formato YYYY-MM-DD." });
      }

      const requiredFields: Array<[string, string]> = [
        [cleaned.operario, "operario"],
        [cleaned.codigoOperario, "codigoOperario"],
        [cleaned.cliente, "cliente"],
        [cleaned.ordenCompra, "ordenCompra"],
        [cleaned.lote, "lote"],
        [cleaned.producto, "producto"],
        [cleaned.maquina, "maquina"],
        [cleaned.actividad, "actividad"],
      ];

      for (const [value, name] of requiredFields) {
        if (!value) {
          return res.status(400).json({ error: `El campo ${name} es obligatorio.` });
        }
      }

      const cantidadInt = Number.parseInt(String(cantidad), 10);
      const tiempoEfectivoInt = Number.parseInt(String(tiempoEfectivoMin), 10);
      const tiempoParadoInt = Number.parseInt(String(tiempoParadoMin ?? 0), 10);

      if (!Number.isInteger(cantidadInt) || cantidadInt < 100) {
        return res.status(400).json({ error: "cantidad debe ser un entero mayor o igual a 100." });
      }

      if (!Number.isInteger(tiempoEfectivoInt) || tiempoEfectivoInt < 0) {
        return res.status(400).json({ error: "tiempoEfectivoMin debe ser un entero mayor o igual a 0." });
      }

      if (!Number.isInteger(tiempoParadoInt) || tiempoParadoInt < 0) {
        return res.status(400).json({ error: "tiempoParadoMin debe ser un entero mayor o igual a 0." });
      }

      if (!MAQUINAS_PERMITIDAS.includes(cleaned.maquina)) {
        return res.status(400).json({ error: "Máquina inválida." });
      }

      if (!ACTIVIDADES_PERMITIDAS.includes(cleaned.actividad)) {
        return res.status(400).json({ error: "Actividad inválida." });
      }

      const millares = calcMillares(cantidadInt);
      const ingresoEstimado = Number((millares * (TARIFAS_POR_MILLAR[cleaned.actividad] ?? 0)).toFixed(2));

      const result = await client.query(
        `INSERT INTO registros_operario
          (fecha, operario, codigo_operario, cliente, orden_compra, lote, producto,
           cantidad, millares, maquina, actividad, tiempo_efectivo_min, tiempo_parado_min,
           pausas_texto, observaciones, ingreso_estimado)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, $12, $13,
           $14, $15, $16)
         RETURNING *`,
        [
          cleaned.fecha,
          cleaned.operario,
          cleaned.codigoOperario,
          cleaned.cliente,
          cleaned.ordenCompra,
          cleaned.lote,
          cleaned.producto,
          cantidadInt,
          millares,
          cleaned.maquina,
          cleaned.actividad,
          tiempoEfectivoInt,
          tiempoParadoInt,
          cleaned.pausasTexto || null,
          cleaned.observaciones || null,
          ingresoEstimado,
        ],
      );

      return res.status(201).json({
        success: true,
        registro: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error guardando registro de operario:", error);
      return res.status(500).json({ error: "Error interno al guardar el registro." });
    }
  });

  return router;
};
