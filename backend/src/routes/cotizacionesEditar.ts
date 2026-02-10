import express from "express";
const router = express.Router();

export default function(client) {
  // Obtener la cotización específica por ID
  router.get("/:id", async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const result = await client.query(`
        SELECT 
          c.id, 
          c.codigo_cotizacion, 
          c.fecha, 
          c.estado,
          c.subtotal,
          c.iva,
          c.descuento,
          c.total,
          cl.nombre_cliente,
          cl.empresa_cliente,
          COALESCE(c.nombre_ejecutivo, u.nombre) AS nombre_ejecutivo,
          r.id AS ruc_id,
          r.ruc,
          r.descripcion AS ruc_descripcion,
          c.tiempo_entrega,
          c.forma_pago,
          c.validez_proforma,
          c.observaciones,
          c.cliente_id,
          c.contacto,
          c.celuar
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.id = $1;
      `, [id]);

      if (result.rows.length > 0) {
        console.log("Datos de cotización encontrados:", result.rows[0]); // Para debugging
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: "Cotización no encontrada" });
      }
    } catch (err: any) {
      console.error("Error al obtener la cotización:", err);
      res.status(500).json({ error: "Error al obtener los datos" });
    }
  });

  return router;
};
