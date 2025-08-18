// ordenTrabajo.js
import express, { Request, Response, RequestHandler } from "express";
import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";

export default (client: any) => {
  const router = express.Router();

  // Obtener nombre del cliente y el primer concepto de la cotización
  router.get("/datosCotizacion/:id", async (req, res): Promise<void> => {
    const { id } = req.params;

    try {
      const result = await client.query(`
        SELECT 
          cl.nombre_cliente AS nombre_cliente,
          cl.telefono_cliente AS telefono_cliente,
          cl.email_cliente AS email_cliente,
          cl.direccion_cliente AS direccion_cliente,
          dc.detalle AS concepto,
          dc.cantidad AS cantidad,
          c.numero_cotizacion AS numero_cotizacion,
          ot.numero_orden AS numero_orden
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN detalle_cotizacion dc ON c.id = dc.cotizacion_id
        LEFT JOIN orden_trabajo ot ON c.id = ot.id_cotizacion
        WHERE c.id = $1
        LIMIT 1
      `, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ message: "Cotización no encontrada o sin detalles" });
        return;
      }

      res.json(result.rows[0]);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error al obtener datos de cotización:", err.message);
      res.status(500).json({ error: "Error al obtener los datos de la cotización" });
    }
  });

  // Crear una orden de trabajo desde una cotización o manualmente
  router.post("/crearOrdenTrabajo", async (req, res): Promise<void> => {
    const {
      nombre_cliente, contacto, email, telefono, cantidad, concepto,
      fecha_creacion, fecha_entrega, estado, notas_observaciones,
      vendedor, preprensa, prensa, terminados, facturado, id_cotizacion,
      id_detalle_cotizacion, // nuevo campo
      detalle
    } = req.body;

    try {
      await client.query('BEGIN');
      // 1. Insertar en orden_trabajo
      const ordenResult = await client.query(`
        INSERT INTO orden_trabajo (
          nombre_cliente, contacto, email, telefono, cantidad, concepto,
          fecha_creacion, fecha_entrega, estado, notas_observaciones,
          vendedor, preprensa, prensa, terminados, facturado, id_cotizacion,
          id_detalle_cotizacion
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING id, numero_orden
      `, [
        nombre_cliente, contacto, email, telefono, cantidad, concepto,
        fecha_creacion, fecha_entrega, estado, notas_observaciones,
        vendedor, preprensa, prensa, terminados, facturado, id_cotizacion,
        id_detalle_cotizacion
      ]);
      const ordenId = ordenResult.rows[0].id;

      // 2. Insertar en detalle_orden_trabajo
      await client.query(`
        INSERT INTO detalle_orden_trabajo (
          orden_trabajo_id, tipo_papel_proveedor, tipo_papel_prensa, tipo_papel_velocidad,
          tipo_papel_calibre, tipo_papel_referencia, tipo_papel_gramos, tipo_papel_tamano,
          tipo_papel_cant_colores, tipo_papel_cant_pliegos, tipo_papel_exceso,
          guillotina_pliegos_cortar, guillotina_tamano_corte, guillotina_cabida_corte,
          prensas_pliegos_imprimir, prensas_cabida_impresion, prensas_total_impresion
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      `, [
        ordenId,
        detalle?.tipo_papel_proveedor || null,
        detalle?.tipo_papel_prensa || null,
        detalle?.tipo_papel_velocidad || null,
        detalle?.tipo_papel_calibre || null,
        detalle?.tipo_papel_referencia || null,
        detalle?.tipo_papel_gramos || null,
        detalle?.tipo_papel_tamano || null,
        detalle?.tipo_papel_cant_colores || null,
        detalle?.tipo_papel_cant_pliegos || null,
        detalle?.tipo_papel_exceso || null,
        detalle?.guillotina_pliegos_cortar || null,
        detalle?.guillotina_tamano_corte || null,
        detalle?.guillotina_cabida_corte || null,
        detalle?.prensas_pliegos_imprimir || null,
        detalle?.prensas_cabida_impresion || null,
        detalle?.prensas_total_impresion || null
      ]);

      await client.query('COMMIT');
      res.status(201).json({
        message: "Orden de trabajo creada correctamente",
        numero_orden: ordenResult.rows[0].numero_orden
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error al crear orden de trabajo:", error);
      res.status(500).json({ error: "No se pudo crear la orden de trabajo" });
    }
  });

  // Listar órdenes de trabajo con filtros y paginación
  router.get('/listar', async (req, res): Promise<void> => {
    try {
      const { busqueda, fechaDesde, fechaHasta, limite } = req.query;
      let query = `
        SELECT id, numero_orden, nombre_cliente, concepto, fecha_creacion, estado
        FROM orden_trabajo
      `;
      let where: string[] = [];
      let params: any[] = [];
      let paramCount = 1;

      if (busqueda) {
        where.push(`(
          CAST(numero_orden AS TEXT) ILIKE $${paramCount} OR
          nombre_cliente ILIKE $${paramCount} OR
          concepto ILIKE $${paramCount}
        )`);
        params.push(`%${busqueda}%`);
        paramCount++;
      }
      if (fechaDesde) {
        where.push(`fecha_creacion >= $${paramCount}`);
        params.push(fechaDesde);
        paramCount++;
      }
      if (fechaHasta) {
        where.push(`fecha_creacion <= $${paramCount}`);
        params.push(fechaHasta);
        paramCount++;
      }
      if (where.length > 0) {
        query += ' WHERE ' + where.join(' AND ');
      }
      query += ' ORDER BY id DESC';
      if (limite) {
        query += ` LIMIT $${paramCount}`;
        params.push(limite);
      }
      const result = await client.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error al listar órdenes de trabajo:', error);
      res.status(500).json({ error: 'Error al listar órdenes de trabajo' });
    }
  });


  router.get("/buscar", async (req, res): Promise<void> => {
    const { ruc_id, busqueda } = req.query;

    try {
      let query = `
        SELECT 
          ot.id,
          ot.numero_orden,
          ot.fecha_creacion,
          c.nombre_cliente,
          d.detalle
        FROM orden_trabajo ot
        LEFT JOIN cotizaciones co ON ot.id_cotizacion = co.id
        LEFT JOIN clientes c ON co.cliente_id = c.id
        LEFT JOIN detalle_cotizacion d ON d.cotizacion_id = co.id
      `;
      let where = [];
      let params: any[] = [];

      if (ruc_id) {
        where.push('c.ruc_id = $' + (params.length + 1));
        params.push(ruc_id);
      }
      if (busqueda) {
        const idx = params.length + 1;
        where.push(`(
          ot.numero_orden::text ILIKE '%' || $${idx} || '%'
          OR c.nombre_cliente ILIKE '%' || $${idx} || '%'
          OR d.detalle ILIKE '%' || $${idx} || '%'
          OR co.numero_cotizacion::text ILIKE '%' || $${idx} || '%'
        )`);
        params.push(busqueda);
      }
      if (where.length > 0) {
        query += ' WHERE ' + where.join(' AND ');
      }
      query += ' ORDER BY ot.id DESC';

      const result = await client.query(query, params);
      res.json(result.rows);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error al buscar órdenes de trabajo:", err.message);
      res.status(500).json({ error: "Error al buscar órdenes de trabajo" });
    }
  });

  // Obtener datos de una orden de trabajo por ID
  router.get('/orden/:id', async (req, res) => {
    const { id } = req.params;
    try {
      // Obtener datos generales de la orden
      const result = await client.query(
        `SELECT ot.*, c.numero_cotizacion, cl.telefono_cliente, cl.email_cliente, cl.direccion_cliente
         FROM orden_trabajo ot
         LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         WHERE ot.id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Orden no encontrada' });
        return;
      }
      const orden = result.rows[0];
      // Obtener detalle técnico
      const detalleResult = await client.query(
        `SELECT * FROM detalle_orden_trabajo WHERE orden_trabajo_id = $1`,
        [id]
      );
      orden.detalle = detalleResult.rows[0] || {};
      // Priorizar los datos de la orden de trabajo, pero incluir info de cotización/cliente si no existen en la orden
      orden.telefono = orden.telefono || orden.telefono_cliente || null;
      orden.email = orden.email || orden.email_cliente || null;
      orden.direccion = orden.direccion || orden.direccion_cliente || null;
      orden.numero_cotizacion = orden.numero_cotizacion || null;
      // Eliminar los campos duplicados para evitar confusión en el frontend
      delete orden.telefono_cliente;
      delete orden.email_cliente;
      delete orden.direccion_cliente;
      res.json(orden);
    } catch (error) {
      const err = error as Error;
      console.error('Error al obtener la orden:', err.message);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  /////editar y actualizar datos orden de trabajo   // Editar una orden de trabajo existente
  router.put('/editarOrden/:id', async (req, res): Promise<void> => {
    const { id } = req.params;
    const {
      nombre_cliente,
      concepto,
      fecha_creacion,
      fecha_entrega,
      telefono,
      email,
      contacto,
      cantidad,
      notas_observaciones,
      vendedor,
      preprensa,
      prensa,
      terminados,
      facturado,
      id_detalle_cotizacion, // nuevo campo
      detalle
    } = req.body;

    try {
      await client.query('BEGIN');
      // Actualizar datos generales
      const result = await client.query(
        `UPDATE orden_trabajo
        SET nombre_cliente = $1,
            concepto = $2,
            fecha_creacion = $3,
            fecha_entrega = $4,
            telefono = $5,
            email = $6,
            contacto = $7,
            cantidad = $8,
            notas_observaciones = $9,
            vendedor = $10,
            preprensa = $11,
            prensa = $12,
            terminados = $13,
            facturado = $14,
            id_detalle_cotizacion = $15
        WHERE id = $16
        RETURNING *`,
        [
          nombre_cliente,
          concepto,
          fecha_creacion,
          fecha_entrega,
          telefono,
          email,
          contacto,
          cantidad,
          notas_observaciones,
          vendedor,
          preprensa,
          prensa,
          terminados,
          facturado,
          id_detalle_cotizacion,
          id
        ]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: "Orden no encontrada" });
        return;
      }
      // Actualizar detalle técnico si se envía
      if (detalle) {
        await client.query(
          `UPDATE detalle_orden_trabajo SET
            tipo_papel_proveedor = $1,
            tipo_papel_prensa = $2,
            tipo_papel_velocidad = $3,
            tipo_papel_calibre = $4,
            tipo_papel_referencia = $5,
            tipo_papel_gramos = $6,
            tipo_papel_tamano = $7,
            tipo_papel_cant_colores = $8,
            tipo_papel_cant_pliegos = $9,
            tipo_papel_exceso = $10,
            guillotina_pliegos_cortar = $11,
            guillotina_tamano_corte = $12,
            guillotina_cabida_corte = $13,
            prensas_pliegos_imprimir = $14,
            prensas_cabida_impresion = $15,
            prensas_total_impresion = $16
          WHERE orden_trabajo_id = $17`,
          [
            detalle.tipo_papel_proveedor,
            detalle.tipo_papel_prensa,
            detalle.tipo_papel_velocidad,
            detalle.tipo_papel_calibre,
            detalle.tipo_papel_referencia,
            detalle.tipo_papel_gramos,
            detalle.tipo_papel_tamano,
            detalle.tipo_papel_cant_colores,
            detalle.tipo_papel_cant_pliegos,
            detalle.tipo_papel_exceso,
            detalle.guillotina_pliegos_cortar,
            detalle.guillotina_tamano_corte,
            detalle.guillotina_cabida_corte,
            detalle.prensas_pliegos_imprimir,
            detalle.prensas_cabida_impresion,
            detalle.prensas_total_impresion,
            id
          ]
        );
      }
      await client.query('COMMIT');
      res.json({ message: "Orden actualizada correctamente", orden: result.rows[0] });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const err = error as Error;
      console.error("Error al editar la orden de trabajo:", err.message);
      res.status(500).json({ error: "Error al actualizar la orden de trabajo" });
    }
  });

  // Endpoint para obtener el próximo número de orden
  router.get('/proximoNumero', async (req, res): Promise<void> => {
    try {
      const result = await client.query('SELECT MAX(numero_orden) AS max_numero FROM orden_trabajo');
      const maxNumero = result.rows[0].max_numero || 0;
      const proximoNumero = String(Number(maxNumero) + 1).padStart(6, '0');
      res.json({ proximoNumero });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error al obtener el próximo número de orden:', err.message);
      res.status(500).json({ error: 'Error al obtener el próximo número de orden' });
    }
  });

  // Eliminar una orden de trabajo por id
  router.delete('/eliminar/:id', async (req, res): Promise<void> => {
    const { id } = req.params;
    try {
      const result = await client.query('DELETE FROM orden_trabajo WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Orden no encontrada' });
        return;
      }
      res.json({ message: 'Orden eliminada correctamente' });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error al eliminar la orden de trabajo:', err.message);
      res.status(500).json({ error: 'Error al eliminar la orden de trabajo' });
    }
  });

  // Generar y descargar PDF de una orden de trabajo
  router.get("/:id/pdf", async (req, res) => {
    const { id } = req.params;
    try {
      // 1. Obtener los datos de la orden de trabajo
      const result = await client.query(
        `SELECT * FROM orden_trabajo WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener el detalle técnico
      const detalleResult = await client.query(
        `SELECT * FROM detalle_orden_trabajo WHERE orden_trabajo_id = $1`,
        [id]
      );
      const detalle = detalleResult.rows[0] || {};

      // 3. Generar HTML (puedes personalizar esta plantilla)
      const html = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Orden de Trabajo #${orden.numero_orden}</h1>
          <p><strong>Cliente:</strong> ${orden.nombre_cliente}</p>
          <p><strong>Concepto:</strong> ${orden.concepto}</p>
          <p><strong>Fecha de creación:</strong> ${orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString() : ''}</p>
          <h2>Detalle Técnico</h2>
          <table>
            <tr><th>Campo</th><th>Valor</th></tr>
            ${Object.entries(detalle).map(([k, v]) => `<tr><td>${k}</td><td>${v ?? ''}</td></tr>`).join('')}
          </table>
        </body>
        </html>
      `;

      // 4. Generar PDF usando Puppeteer
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });
      await browser.close();

      // 5. Enviar el PDF al cliente
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=orden_trabajo_${orden.numero_orden}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error al generar PDF de orden de trabajo:', error);
      res.status(500).json({ error: 'Error al generar el PDF de la orden de trabajo' });
    }
  });

  // Enviar PDF de orden de trabajo por correo
  router.post("/:id/enviar-correo", async (req, res) => {
    const { id } = req.params;
    const { email, asunto, mensaje } = req.body;
    if (!email) {
      return res.status(400).json({ error: "El correo electrónico es requerido" });
    }
    try {
      // 1. Obtener los datos de la orden de trabajo
      const result = await client.query(
        `SELECT * FROM orden_trabajo WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener el detalle técnico
      const detalleResult = await client.query(
        `SELECT * FROM detalle_orden_trabajo WHERE orden_trabajo_id = $1`,
        [id]
      );
      const detalle = detalleResult.rows[0] || {};

      // 3. Generar HTML (igual que en el endpoint de PDF)
      const html = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Orden de Trabajo #${orden.numero_orden}</h1>
          <p><strong>Cliente:</strong> ${orden.nombre_cliente}</p>
          <p><strong>Concepto:</strong> ${orden.concepto}</p>
          <p><strong>Fecha de creación:</strong> ${orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString() : ''}</p>
          <h2>Detalle Técnico</h2>
          <table>
            <tr><th>Campo</th><th>Valor</th></tr>
            ${Object.entries(detalle).map(([k, v]) => `<tr><td>${k}</td><td>${v ?? ''}</td></tr>`).join('')}
          </table>
        </body>
        </html>
      `;

      // 4. Generar PDF usando Puppeteer
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4" });
      await browser.close();

      // 5. Configurar el transporte de correo (ajusta con tus credenciales SMTP)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER || 'usuario',
          pass: process.env.SMTP_PASS || 'contraseña',
        },
      });

      // 6. Enviar el correo
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@mundografic.com',
        to: email,
        subject: asunto || `Orden de Trabajo #${orden.numero_orden}`,
        text: mensaje || 'Adjunto encontrará la orden de trabajo solicitada.',
        html: `<p>${mensaje || 'Adjunto encontrará la orden de trabajo solicitada.'}</p>`,
        attachments: [
          {
            filename: `orden_trabajo_${orden.numero_orden}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      res.json({ success: true, message: 'Correo enviado correctamente' });
    } catch (error) {
      console.error('Error al enviar correo de orden de trabajo:', error);
      res.status(500).json({ error: 'Error al enviar el correo de la orden de trabajo' });
    }
  });

  // Cambiar estado a "en producción"
  router.put("/:id/enviar-produccion", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await client.query(
        `UPDATE orden_trabajo SET estado = 'en producción' WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      res.json({ success: true, orden: result.rows[0] });
    } catch (error) {
      console.error("Error al enviar a producción:", error);
      res.status(500).json({ error: "Error al enviar a producción" });
    }
  });

  return router;
};
