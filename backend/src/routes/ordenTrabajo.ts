// ordenTrabajo.js
import express, { Request, Response, RequestHandler } from "express";
import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import authRequired from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import { validateOrdenTrabajo, validateOrdenTrabajoUpdate } from "../middleware/ordenTrabajoValidation";

export default (client: any) => {
  const router = express.Router();

  // Obtener datos del cliente de una cotización
  router.get("/datosCotizacion/:id", async (req, res): Promise<void> => {
    const { id } = req.params;

    try {
      console.log(`🔍 Obteniendo datos de cotización ${id}`);
      
      const result = await client.query(`
        SELECT 
          cl.nombre_cliente AS nombre_cliente,
          cl.telefono_cliente AS telefono_cliente,
          cl.email_cliente AS email_cliente,
          cl.direccion_cliente AS direccion_cliente,
          c.codigo_cotizacion AS numero_cotizacion,
          c.id AS cotizacion_id
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        WHERE c.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        console.error(`❌ Cotización ${id} no encontrada`);
        res.status(404).json({ message: "Cotización no encontrada" });
        return;
      }

      console.log(`✅ Datos de cotización obtenidos:`, result.rows[0]);
      res.json(result.rows[0]);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("❌ Error al obtener datos de cotización:", err.message);
      res.status(500).json({ error: "Error al obtener los datos de la cotización", details: err.message });
    }
  });

  // Crear una orden de trabajo desde una cotización o manualmente
  router.post("/crearOrdenTrabajo", authRequired(), checkPermission(client, 'ordenes_trabajo', 'crear'), validateOrdenTrabajo, async (req, res): Promise<void> => {
    console.log('🚀 CREAR ORDEN - Iniciando proceso de creación');
    
    const {
      nombre_cliente, contacto, email, telefono, cantidad, concepto,
      fecha_creacion, fecha_entrega, estado, notas_observaciones,
      vendedor, preprensa, prensa, terminados, facturado, id_cotizacion,
      id_detalle_cotizacion,
      // Nuevos campos de trabajo - extraer del objeto detalle
      detalle
    } = req.body;

    // Obtener el ID del usuario del token JWT
    const userId = (req as any).user.id;
    console.log('👤 Usuario creando orden:', userId);

    // Extraer campos del detalle
    const material = detalle?.material;
    const corteMaterial = detalle?.corte_material;
    const cantidadPliegosCompra = detalle?.cantidad_pliegos_compra;
    const exceso = detalle?.exceso;
    const totalPliegos = detalle?.total_pliegos;
    const tamano = detalle?.tamano;
    const tamanoAbierto1 = detalle?.tamano_abierto_1;
    const tamanoCerrado1 = detalle?.tamano_cerrado_1;
    const impresion = detalle?.impresion;
    const instruccionesImpresion = detalle?.instrucciones_impresion;
    const instruccionesAcabados = detalle?.instrucciones_acabados;
    const instruccionesEmpacado = detalle?.instrucciones_empacado;
    const observaciones = detalle?.observaciones;
    const prensaSeleccionada = detalle?.prensa_seleccionada;

    try {
      await client.query('BEGIN');
      // 1. Insertar en orden_trabajo
      const ordenResult = await client.query(`
        INSERT INTO orden_trabajo (
          nombre_cliente, contacto, email, telefono, cantidad, concepto,
          fecha_creacion, fecha_entrega, estado, notas_observaciones,
          vendedor, preprensa, prensa, terminados, facturado, id_cotizacion,
          id_detalle_cotizacion, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING id, numero_orden
      `, [
        nombre_cliente, contacto, email, telefono, cantidad, concepto,
        fecha_creacion, fecha_entrega, estado, notas_observaciones,
        vendedor, preprensa, prensa, terminados, facturado, id_cotizacion,
        id_detalle_cotizacion, userId
      ]);
      const ordenId = ordenResult.rows[0].id;

      // 2. Insertar en detalle_orden_trabajo con los nuevos campos
      await client.query(`
        INSERT INTO detalle_orden_trabajo (
          orden_trabajo_id, 
          material, corte_material, cantidad_pliegos_compra, exceso, total_pliegos,
          tamano, tamano_abierto_1, tamano_cerrado_1, impresion, instrucciones_impresion,
          instrucciones_acabados, instrucciones_empacado, observaciones, prensa_seleccionada
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      `, [
        ordenId,
        material || null,
        corteMaterial || null,
        cantidadPliegosCompra || null,
        exceso || null,
        totalPliegos || null,
        tamano || null,
        tamanoAbierto1 || null,
        tamanoCerrado1 || null,
        impresion || null,
        instruccionesImpresion || null,
        instruccionesAcabados || null,
        instruccionesEmpacado || null,
        observaciones || null,
        prensaSeleccionada || null
      ]);

      await client.query('COMMIT');
      console.log('✅ ORDEN CREADA EXITOSAMENTE - Número:', ordenResult.rows[0].numero_orden);
      res.status(201).json({
        message: "Orden de trabajo creada correctamente",
        numero_orden: ordenResult.rows[0].numero_orden
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error("❌ ERROR AL CREAR ORDEN DE TRABAJO:", error);
      res.status(500).json({ error: "No se pudo crear la orden de trabajo" });
    }
  });

  // Listar órdenes de trabajo con filtros y paginación
  router.get('/listar', authRequired(), checkPermission(client, 'ordenes_trabajo', 'leer'), async (req, res): Promise<void> => {
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
    } catch (error: any) {
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
  router.get('/orden/:id', authRequired(), checkPermission(client, 'ordenes_trabajo', 'leer'), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      // Obtener datos generales de la orden con información de auditoría
      const result = await client.query(
        `SELECT ot.*, 
         c.codigo_cotizacion as numero_cotizacion, 
         cl.telefono_cliente, 
         cl.email_cliente, 
         cl.direccion_cliente,
         u1.nombre as created_by_nombre,
         u2.nombre as updated_by_nombre
         FROM orden_trabajo ot
         LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         LEFT JOIN usuarios u1 ON ot.created_by = u1.id
         LEFT JOIN usuarios u2 ON ot.updated_by = u2.id
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
    } catch (error: any) {
      const err = error as Error;
      console.error('Error al obtener la orden:', err.message);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  /////editar y actualizar datos orden de trabajo   // Editar una orden de trabajo existente
  router.put('/editarOrden/:id', authRequired(), checkPermission(client, 'ordenes_trabajo', 'editar'), validateOrdenTrabajoUpdate, async (req, res): Promise<void> => {
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
      id_detalle_cotizacion,
      // Nuevos campos de trabajo - extraer del objeto detalle
      detalle
    } = req.body;

    // Obtener el ID del usuario del token JWT
    const userId = (req as any).user.id;
    console.log('👤 Usuario editando orden:', userId);

    // Extraer campos del detalle
    const material = detalle?.material;
    const corteMaterial = detalle?.corte_material;
    const cantidadPliegosCompra = detalle?.cantidad_pliegos_compra;
    const exceso = detalle?.exceso;
    const totalPliegos = detalle?.total_pliegos;
    const tamano = detalle?.tamano;
    const tamanoAbierto1 = detalle?.tamano_abierto_1;
    const tamanoCerrado1 = detalle?.tamano_cerrado_1;
    const impresion = detalle?.impresion;
    const instruccionesImpresion = detalle?.instrucciones_impresion;
    const instruccionesAcabados = detalle?.instrucciones_acabados;
    const instruccionesEmpacado = detalle?.instrucciones_empacado;
    const observaciones = detalle?.observaciones;
    const prensaSeleccionada = detalle?.prensa_seleccionada;

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
            id_detalle_cotizacion = $15,
            updated_by = $16,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $17
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
          userId,
          id
        ]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: "Orden no encontrada" });
        return;
      }
      // Actualizar detalle técnico con los nuevos campos
      await client.query(
        `UPDATE detalle_orden_trabajo SET
          material = $1,
          corte_material = $2,
          cantidad_pliegos_compra = $3,
          exceso = $4,
          total_pliegos = $5,
          tamano = $6,
          tamano_abierto_1 = $7,
          tamano_cerrado_1 = $8,
          impresion = $9,
          instrucciones_impresion = $10,
          instrucciones_acabados = $11,
          instrucciones_empacado = $12,
          observaciones = $13,
          prensa_seleccionada = $14
        WHERE orden_trabajo_id = $15`,
        [
          material || null,
          corteMaterial || null,
          cantidadPliegosCompra || null,
          exceso || null,
          totalPliegos || null,
          tamano || null,
          tamanoAbierto1 || null,
          tamanoCerrado1 || null,
          impresion || null,
          instruccionesImpresion || null,
          instruccionesAcabados || null,
          instruccionesEmpacado || null,
          observaciones || null,
          prensaSeleccionada || null,
          id
        ]
      );
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
      const maxNumero = result.rows[0].max_numero || 'OT-000000';
      
      // Extraer el número del formato "OT-000001"
      const numeroMatch = maxNumero.match(/OT-(\d+)/);
      const numeroActual = numeroMatch ? parseInt(numeroMatch[1]) : 0;
      const proximoNumero = String(numeroActual + 1).padStart(6, '0');
      
      res.json({ proximoNumero });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error al obtener el próximo número de orden:', err.message);
      res.status(500).json({ error: 'Error al obtener el próximo número de orden' });
    }
  });

  // Eliminar una orden de trabajo por id
  router.delete('/eliminar/:id', authRequired(), checkPermission(client, 'ordenes_trabajo', 'eliminar'), async (req, res): Promise<void> => {
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
  router.get("/:id/pdf", authRequired(), async (req: any, res: any) => {
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

      // 3. Leer y convertir el logo a base64
      const logoPath = path.join(__dirname, '../../public/images/logo-mundografic.png');
      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (e: any) {
        console.error('No se pudo leer el logo:', e);
        logoBase64 = '';
      }

      // 4. Generar HTML (diseño simple y compacto pero con mejor distribución vertical)
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .logo-section img { height: 45px; }
            .orden-info { text-align: right; font-size: 10px; }
            .orden-numero { font-size: 18px; font-weight: bold; }
            .titulo { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 12px; }
            .seccion { margin-bottom: 12px; border: 1px solid #ddd; }
            .seccion-titulo { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 11px; border-bottom: 1px solid #ddd; }
            .seccion-contenido { padding: 10px; }
            .fila { display: flex; gap: 10px; margin-bottom: 6px; }
            .campo { flex: 1; }
            .campo-label { font-size: 9px; color: #666; margin-bottom: 3px; font-weight: bold; }
            .campo-valor { border: 1px solid #ddd; padding: 5px 8px; font-size: 10px; background: white; min-height: 28px; }
            .responsables { display: flex; gap: 6px; }
            .responsable { flex: 1; text-align: center; border: 1px solid #ddd; padding: 6px; }
            .responsable-titulo { font-size: 8px; color: #666; margin-bottom: 3px; font-weight: bold; }
            .responsable-nombre { font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : '<strong>MUNDOGRAFIC</strong>'}
            </div>
            <div class="orden-info">
              <div class="orden-numero">Orden de Trabajo</div>
              <div>Orden Nº: <strong>${orden.numero_orden || ''}</strong></div>
              <div>Contacto Nº: ${orden.contacto || ''}</div>
            </div>
          </div>
          
          <div class="titulo">ORDEN DE TRABAJO</div>
          
          <div class="seccion">
            <div class="seccion-titulo">📋 INFORMACIÓN DEL CLIENTE</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">CLIENTE</div>
                  <div class="campo-valor">${orden.nombre_cliente || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">CONTACTO</div>
                  <div class="campo-valor">${orden.contacto || ''}</div>
                </div>
              </div>
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">TELÉFONO</div>
                  <div class="campo-valor">${orden.telefono || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">EMAIL</div>
                  <div class="campo-valor">${orden.email || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Información del Trabajo</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo" style="flex: 2;">
                  <div class="campo-label">CONCEPTO</div>
                  <div class="campo-valor">${orden.concepto || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">CANTIDAD</div>
                  <div class="campo-valor">${orden.cantidad || ''}</div>
                </div>
              </div>
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">TAMAÑO ABIERTO</div>
                  <div class="campo-valor">${detalle.tamano_abierto_1 || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">TAMAÑO CERRADO</div>
                  <div class="campo-valor">${detalle.tamano_cerrado_1 || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Material y Corte</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">MATERIAL</div>
                  <div class="campo-valor">${detalle.material || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">CORTE DE MATERIAL</div>
                  <div class="campo-valor">${detalle.corte_material || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Cantidad de Pliegos</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">PLIEGOS DE COMPRA</div>
                  <div class="campo-valor">${detalle.cantidad_pliegos_compra || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">EXCESO</div>
                  <div class="campo-valor">${detalle.exceso || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">TOTAL</div>
                  <div class="campo-valor">${detalle.total_pliegos || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Impresión y Acabados</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">IMPRESIÓN</div>
                  <div class="campo-valor">${detalle.impresion || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">INSTRUCCIONES DE IMPRESIÓN</div>
                  <div class="campo-valor">${detalle.instrucciones_impresion || ''}</div>
                </div>
              </div>
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">INSTRUCCIONES DE ACABADOS</div>
                  <div class="campo-valor">${detalle.instrucciones_acabados || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">INSTRUCCIONES DE EMPACADO</div>
                  <div class="campo-valor">${detalle.instrucciones_empacado || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Prensa y Observaciones</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">SELECCIONAR PRENSA</div>
                  <div class="campo-valor">${detalle.prensa_seleccionada || ''}</div>
                </div>
                <div class="campo" style="flex: 2;">
                  <div class="campo-label">OBSERVACIONES GENERALES</div>
                  <div class="campo-valor">${orden.notas_observaciones || detalle.observaciones || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Responsables del Proceso</div>
            <div class="seccion-contenido">
              <div class="responsables">
                <div class="responsable">
                  <div class="responsable-titulo">VENDEDOR</div>
                  <div class="responsable-nombre">${orden.vendedor || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">PREPRENSA</div>
                  <div class="responsable-nombre">${orden.preprensa || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">OFFSET</div>
                  <div class="responsable-nombre">${orden.prensa || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">TERMINADOS</div>
                  <div class="responsable-nombre">${orden.terminados || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">FACTURADO</div>
                  <div class="responsable-nombre">${orden.facturado || ''}</div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // 5. Generar PDF usando Puppeteer
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ 
        format: "A4",
        printBackground: true,
        margin: {
          top: '8mm',
          right: '8mm',
          bottom: '8mm',
          left: '8mm'
        },
        scale: 0.95
      });
      await browser.close();

      // 6. Enviar el PDF al cliente para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orden_trabajo_${orden.numero_orden || id}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error al generar PDF de orden de trabajo:', error);
      res.status(500).json({ error: 'Error al generar el PDF de la orden de trabajo' });
    }
  });

  // Enviar PDF de orden de trabajo por correo
  router.post("/:id/enviar-correo", async (req: any, res: any) => {
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
    } catch (error: any) {
      console.error('Error al enviar correo de orden de trabajo:', error);
      res.status(500).json({ error: 'Error al enviar el correo de la orden de trabajo' });
    }
  });

  // Cambiar estado a "en producción"
  router.put("/:id/enviar-produccion", async (req: any, res: any) => {
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
    } catch (error: any) {
      console.error("Error al enviar a producción:", error);
      res.status(500).json({ error: "Error al enviar a producción" });
    }
  });

  // Endpoint de preview para generar PDF en base64 (igual que cotizaciones)
  router.get("/:id/preview", authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      console.log('📋 Generando preview de orden de trabajo:', id);
      
      // 1. Obtener los datos de la orden de trabajo
      const result = await client.query(
        `SELECT * FROM orden_trabajo WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener el detalle técnico
      const detalleResult = await client.query(
        `SELECT * FROM detalle_orden_trabajo WHERE orden_trabajo_id = $1`,
        [id]
      );
      const detalle = detalleResult.rows[0] || {};

      // 3. Leer y convertir el logo a base64
      const logoPath = path.join(__dirname, '../../public/images/logo-mundografic.png');
      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (e: any) {
        console.error('No se pudo leer el logo:', e);
      }

      // 4. Generar HTML (diseño simple y compacto pero con mejor distribución vertical)
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .logo-section img { height: 45px; }
            .orden-info { text-align: right; font-size: 10px; }
            .orden-numero { font-size: 18px; font-weight: bold; }
            .titulo { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 12px; }
            .seccion { margin-bottom: 12px; border: 1px solid #ddd; }
            .seccion-titulo { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 11px; border-bottom: 1px solid #ddd; }
            .seccion-contenido { padding: 10px; }
            .fila { display: flex; gap: 10px; margin-bottom: 6px; }
            .campo { flex: 1; }
            .campo-label { font-size: 9px; color: #666; margin-bottom: 3px; font-weight: bold; }
            .campo-valor { border: 1px solid #ddd; padding: 5px 8px; font-size: 10px; background: white; min-height: 28px; }
            .responsables { display: flex; gap: 6px; }
            .responsable { flex: 1; text-align: center; border: 1px solid #ddd; padding: 6px; }
            .responsable-titulo { font-size: 8px; color: #666; margin-bottom: 3px; font-weight: bold; }
            .responsable-nombre { font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : '<strong>MUNDOGRAFIC</strong>'}
            </div>
            <div class="orden-info">
              <div class="orden-numero">Orden de Trabajo</div>
              <div>Orden Nº: <strong>${orden.numero_orden || ''}</strong></div>
              <div>Contacto Nº: ${orden.contacto || ''}</div>
            </div>
          </div>
          
          <div class="titulo">ORDEN DE TRABAJO</div>
          
          <div class="seccion">
            <div class="seccion-titulo">📋 INFORMACIÓN DEL CLIENTE</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">CLIENTE</div>
                  <div class="campo-valor">${orden.nombre_cliente || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">CONTACTO</div>
                  <div class="campo-valor">${orden.contacto || ''}</div>
                </div>
              </div>
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">TELÉFONO</div>
                  <div class="campo-valor">${orden.telefono || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">EMAIL</div>
                  <div class="campo-valor">${orden.email || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Información del Trabajo</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo" style="flex: 2;">
                  <div class="campo-label">CONCEPTO</div>
                  <div class="campo-valor">${orden.concepto || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">CANTIDAD</div>
                  <div class="campo-valor">${orden.cantidad || ''}</div>
                </div>
              </div>
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">TAMAÑO ABIERTO</div>
                  <div class="campo-valor">${detalle.tamano_abierto_1 || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">TAMAÑO CERRADO</div>
                  <div class="campo-valor">${detalle.tamano_cerrado_1 || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Material y Corte</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">MATERIAL</div>
                  <div class="campo-valor">${detalle.material || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">CORTE DE MATERIAL</div>
                  <div class="campo-valor">${detalle.corte_material || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Cantidad de Pliegos</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">PLIEGOS DE COMPRA</div>
                  <div class="campo-valor">${detalle.cantidad_pliegos_compra || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">EXCESO</div>
                  <div class="campo-valor">${detalle.exceso || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">TOTAL</div>
                  <div class="campo-valor">${detalle.total_pliegos || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Impresión y Acabados</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">IMPRESIÓN</div>
                  <div class="campo-valor">${detalle.impresion || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">INSTRUCCIONES DE IMPRESIÓN</div>
                  <div class="campo-valor">${detalle.instrucciones_impresion || ''}</div>
                </div>
              </div>
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">INSTRUCCIONES DE ACABADOS</div>
                  <div class="campo-valor">${detalle.instrucciones_acabados || ''}</div>
                </div>
                <div class="campo">
                  <div class="campo-label">INSTRUCCIONES DE EMPACADO</div>
                  <div class="campo-valor">${detalle.instrucciones_empacado || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Prensa y Observaciones</div>
            <div class="seccion-contenido">
              <div class="fila">
                <div class="campo">
                  <div class="campo-label">SELECCIONAR PRENSA</div>
                  <div class="campo-valor">${detalle.prensa_seleccionada || ''}</div>
                </div>
                <div class="campo" style="flex: 2;">
                  <div class="campo-label">OBSERVACIONES GENERALES</div>
                  <div class="campo-valor">${orden.notas_observaciones || detalle.observaciones || ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="seccion">
            <div class="seccion-titulo">Responsables del Proceso</div>
            <div class="seccion-contenido">
              <div class="responsables">
                <div class="responsable">
                  <div class="responsable-titulo">VENDEDOR</div>
                  <div class="responsable-nombre">${orden.vendedor || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">PREPRENSA</div>
                  <div class="responsable-nombre">${orden.preprensa || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">OFFSET</div>
                  <div class="responsable-nombre">${orden.prensa || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">TERMINADOS</div>
                  <div class="responsable-nombre">${orden.terminados || ''}</div>
                </div>
                <div class="responsable">
                  <div class="responsable-titulo">FACTURADO</div>
                  <div class="responsable-nombre">${orden.facturado || ''}</div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // 5. Generar PDF usando Puppeteer (compacto para una página)
      const browser = await puppeteer.launch({ 
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ 
        format: "A4",
        printBackground: true,
        margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
        scale: 0.95
      });
      await browser.close();

      // 6. Convertir a base64
      const base64PDF = pdfBuffer.toString('base64');
      console.log('✅ PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');

      // 7. Enviar respuesta en formato JSON (igual que cotizaciones)
      res.json({ 
        success: true, 
        pdf: `data:application/pdf;base64,${base64PDF}`
      });
    } catch (error: any) {
      console.error('❌ Error al generar preview de orden:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al generar la vista previa del PDF' 
      });
    }
  });

  return router;
};
