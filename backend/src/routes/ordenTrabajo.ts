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
  router.get("/datosCotizacion/:id", authRequired(), async (req, res): Promise<void> => {
    const { id } = req.params;

    try {
      console.log(`🔍 Obteniendo datos de cotización ${id}`);
      
      const result = await client.query(`
        SELECT 
          cl.nombre_cliente AS nombre_cliente,
          cl.empresa_cliente AS empresa_cliente,
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
      nombre_cliente, orden_compra, contacto, email, telefono, cantidad, concepto,
      fecha_creacion, fecha_entrega, estado, notas_observaciones,
      vendedor, preprensa, prensa, terminados, facturado,
      laminado_barnizado, troquelado, liberacion_producto, // Campos adicionales para digital
      id_cotizacion,
      id_detalle_cotizacion,
      tipo_orden, // Nuevo campo para diferenciar offset/digital
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
    const numeroSalida = detalle?.numero_salida;
    
    // Campos específicos para órdenes digitales
    const adherencia = detalle?.adherencia;
    const loteMaterial = detalle?.lote_material;
    const loteProduccion = detalle?.lote_produccion;
    const tipoImpresion = detalle?.tipo_impresion;
    const troquel = detalle?.troquel;
    const codigoTroquel = detalle?.codigo_troquel;
    const terminadoEtiqueta = detalle?.terminado_etiqueta;
    const terminadosEspeciales = detalle?.terminados_especiales;
    const cantidadPorRollo = detalle?.cantidad_por_rollo;
    const productosDigital = detalle?.productos_digital;
    
    console.log('📦 CREAR ORDEN - Datos del detalle recibidos:', {
      tipo_orden,
      productos_digital: productosDigital ? `Array con ${productosDigital.length} productos` : 'null',
      adherencia,
      material,
      lote_material: loteMaterial,
      numero_salida: numeroSalida
    });

    try {
      await client.query('BEGIN');
      // 1. Insertar en orden_trabajo
      const ordenResult = await client.query(`
        INSERT INTO orden_trabajo (
          nombre_cliente, orden_compra, contacto, email, telefono, cantidad, concepto,
          fecha_creacion, fecha_entrega, estado, notas_observaciones,
          vendedor, preprensa, prensa, terminados, facturado,
          laminado_barnizado, troquelado, liberacion_producto,
          id_cotizacion, id_detalle_cotizacion, tipo_orden, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
        RETURNING id, numero_orden
      `, [
        nombre_cliente, orden_compra, contacto, email, telefono, cantidad, concepto,
        fecha_creacion, fecha_entrega, estado, notas_observaciones,
        vendedor, preprensa, prensa, terminados, facturado,
        laminado_barnizado || null, troquelado || null, liberacion_producto || null,
        id_cotizacion, id_detalle_cotizacion, tipo_orden || 'offset', userId
      ]);
      const ordenId = ordenResult.rows[0].id;

      // 2. Insertar detalle común
      await client.query(`
        INSERT INTO detalle_orden_trabajo (
          orden_trabajo_id, material, impresion, observaciones, prensa_seleccionada, numero_salida
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [ordenId, material || null, impresion || null, observaciones || null, prensaSeleccionada || null, numeroSalida || null]);

      // 3. Insertar detalle específico según tipo de orden
      if (tipo_orden === 'digital') {
        // 3a. Insertar detalle digital
        await client.query(`
          INSERT INTO detalle_orden_trabajo_digital (
            orden_trabajo_id, adherencia, lote_material, lote_produccion, tipo_impresion,
            troquel, codigo_troquel, terminado_etiqueta, terminados_especiales, cantidad_por_rollo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          ordenId,
          adherencia || null,
          loteMaterial || null,
          loteProduccion || null,
          tipoImpresion || null,
          troquel || null,
          codigoTroquel || null,
          terminadoEtiqueta || null,
          terminadosEspeciales || null,
          cantidadPorRollo || null
        ]);

        // 3b. Insertar productos digitales en tabla relacional
        if (productosDigital && Array.isArray(productosDigital) && productosDigital.length > 0) {
          for (let i = 0; i < productosDigital.length; i++) {
            const producto = productosDigital[i];
            await client.query(`
              INSERT INTO productos_orden_digital (
                orden_trabajo_id, cantidad, cod_mg, cod_cliente, producto,
                avance, medida_ancho, medida_alto, cavidad, metros_impresos, orden
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              ordenId,
              producto.cantidad || null,
              producto.cod_mg || null,
              producto.cod_cliente || null,
              producto.producto || null,
              producto.avance || null,
              producto.medida_ancho || null,
              producto.medida_alto || null,
              producto.cavidad || null,
              producto.metros_impresos || null,
              i + 1  // orden
            ]);
          }
          console.log(`📦 ${productosDigital.length} productos digitales insertados`);
        }
      } else {
        // 3c. Insertar detalle offset
        await client.query(`
          INSERT INTO detalle_orden_trabajo_offset (
            orden_trabajo_id, corte_material, cantidad_pliegos_compra, exceso, total_pliegos,
            tamano, tamano_abierto_1, tamano_cerrado_1, instrucciones_impresion,
            instrucciones_acabados, instrucciones_empacado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          ordenId,
          corteMaterial || null,
          cantidadPliegosCompra || null,
          exceso || null,
          totalPliegos || null,
          tamano || null,
          tamanoAbierto1 || null,
          tamanoCerrado1 || null,
          instruccionesImpresion || null,
          instruccionesAcabados || null,
          instruccionesEmpacado || null
        ]);
      }

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
        SELECT id, numero_orden, nombre_cliente, concepto, fecha_creacion, estado, tipo_orden
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
      
      // Obtener detalle común
      const detalleResult = await client.query(
        `SELECT * FROM detalle_orden_trabajo WHERE orden_trabajo_id = $1`,
        [id]
      );
      orden.detalle = detalleResult.rows[0] || {};
      
      // Obtener detalle específico según tipo de orden
      if (orden.tipo_orden === 'digital') {
        // Obtener detalle digital
        const detalleDigitalResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`,
          [id]
        );
        if (detalleDigitalResult.rows[0]) {
          orden.detalle = { ...orden.detalle, ...detalleDigitalResult.rows[0] };
        }
        
        // Obtener productos digitales
        const productosResult = await client.query(
          `SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
          [id]
        );
        orden.detalle.productos_digital = productosResult.rows;
      } else {
        // Obtener detalle offset
        const detalleOffsetResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`,
          [id]
        );
        if (detalleOffsetResult.rows[0]) {
          orden.detalle = { ...orden.detalle, ...detalleOffsetResult.rows[0] };
        }
      }
      
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
      orden_compra,
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
      laminado_barnizado,
      troquelado,
      liberacion_producto,
      id_detalle_cotizacion,
      tipo_orden, // Nuevo campo
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
    const numeroSalida = detalle?.numero_salida;
    
    // Campos específicos para órdenes digitales
    const adherencia = detalle?.adherencia;
    const loteMaterial = detalle?.lote_material;
    const loteProduccion = detalle?.lote_produccion;
    const tipoImpresion = detalle?.tipo_impresion;
    const troquel = detalle?.troquel;
    const codigoTroquel = detalle?.codigo_troquel;
    const terminadoEtiqueta = detalle?.terminado_etiqueta;
    const terminadosEspeciales = detalle?.terminados_especiales;
    const cantidadPorRollo = detalle?.cantidad_por_rollo;
    const productosDigital = detalle?.productos_digital;

    try {
      await client.query('BEGIN');
      // Actualizar datos generales
      const result = await client.query(
        `UPDATE orden_trabajo
        SET nombre_cliente = $1,
            orden_compra = $2,
            concepto = $3,
            fecha_creacion = $4,
            fecha_entrega = $5,
            telefono = $6,
            email = $7,
            contacto = $8,
            cantidad = $9,
            notas_observaciones = $10,
            vendedor = $11,
            preprensa = $12,
            prensa = $13,
            terminados = $14,
            facturado = $15,
            laminado_barnizado = $16,
            troquelado = $17,
            liberacion_producto = $18,
            id_detalle_cotizacion = $19,
            tipo_orden = $20,
            updated_by = $21,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $22
        RETURNING *`,
        [
          nombre_cliente,
          orden_compra,
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
          laminado_barnizado || null,
          troquelado || null,
          liberacion_producto || null,
          id_detalle_cotizacion,
          tipo_orden,
          userId,
          id
        ]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: "Orden no encontrada" });
        return;
      }
      
      // Actualizar detalle común
      await client.query(
        `UPDATE detalle_orden_trabajo SET
          material = $1,
          impresion = $2,
          observaciones = $3,
          prensa_seleccionada = $4,
          numero_salida = $5
        WHERE orden_trabajo_id = $6`,
        [material || null, impresion || null, observaciones || null, prensaSeleccionada || null, numeroSalida || null, id]
      );
      
      // Actualizar detalle específico según tipo de orden
      if (tipo_orden === 'digital') {
        // Actualizar detalle digital (INSERT or UPDATE)
        await client.query(`
          INSERT INTO detalle_orden_trabajo_digital (
            orden_trabajo_id, adherencia, lote_material, lote_produccion, tipo_impresion,
            troquel, codigo_troquel, terminado_etiqueta, terminados_especiales, cantidad_por_rollo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (orden_trabajo_id) DO UPDATE SET
            adherencia = $2,
            lote_material = $3,
            lote_produccion = $4,
            tipo_impresion = $5,
            troquel = $6,
            codigo_troquel = $7,
            terminado_etiqueta = $8,
            terminados_especiales = $9,
            cantidad_por_rollo = $10,
            updated_at = CURRENT_TIMESTAMP
        `, [
          id,
          adherencia || null,
          loteMaterial || null,
          loteProduccion || null,
          tipoImpresion || null,
          troquel || null,
          codigoTroquel || null,
          terminadoEtiqueta || null,
          terminadosEspeciales || null,
          cantidadPorRollo || null
        ]);
        
        // Actualizar productos digitales: eliminar existentes y crear nuevos
        await client.query(`DELETE FROM productos_orden_digital WHERE orden_trabajo_id = $1`, [id]);
        
        if (productosDigital && Array.isArray(productosDigital) && productosDigital.length > 0) {
          for (let i = 0; i < productosDigital.length; i++) {
            const producto = productosDigital[i];
            await client.query(`
              INSERT INTO productos_orden_digital (
                orden_trabajo_id, cantidad, cod_mg, cod_cliente, producto,
                avance, medida_ancho, medida_alto, cavidad, metros_impresos, orden
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              id,
              producto.cantidad || null,
              producto.cod_mg || null,
              producto.cod_cliente || null,
              producto.producto || null,
              producto.avance || null,
              producto.medida_ancho || null,
              producto.medida_alto || null,
              producto.cavidad || null,
              producto.metros_impresos || null,
              i + 1
            ]);
          }
        }
      } else {
        // Actualizar detalle offset (INSERT or UPDATE)
        await client.query(`
          INSERT INTO detalle_orden_trabajo_offset (
            orden_trabajo_id, corte_material, cantidad_pliegos_compra, exceso, total_pliegos,
            tamano, tamano_abierto_1, tamano_cerrado_1, instrucciones_impresion,
            instrucciones_acabados, instrucciones_empacado
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (orden_trabajo_id) DO UPDATE SET
            corte_material = $2,
            cantidad_pliegos_compra = $3,
            exceso = $4,
            total_pliegos = $5,
            tamano = $6,
            tamano_abierto_1 = $7,
            tamano_cerrado_1 = $8,
            instrucciones_impresion = $9,
            instrucciones_acabados = $10,
            instrucciones_empacado = $11,
            updated_at = CURRENT_TIMESTAMP
        `, [
          id,
          corteMaterial || null,
          cantidadPliegosCompra || null,
          exceso || null,
          totalPliegos || null,
          tamano || null,
          tamanoAbierto1 || null,
          tamanoCerrado1 || null,
          instruccionesImpresion || null,
          instruccionesAcabados || null,
          instruccionesEmpacado || null
        ]);
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

  // ============================================
  // FUNCIONES AUXILIARES PARA GENERAR PDFs
  // ============================================

  /**
   * Genera HTML para PDF de orden OFFSET
   */
  function generarHTMLOrdenOffset(orden: any, detalle: any, logoBase64: string, salidaImagenBase64: string): string {
    return `
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
            <div class="orden-numero">Orden de Trabajo OFFSET</div>
            <div>Orden Nº: <strong>${orden.numero_orden || ''}</strong></div>
            <div>Orden de Compra: ${orden.orden_compra || ''}</div>
            <div>Cotización Nº: ${orden.numero_cotizacion || ''}</div>
          </div>
        </div>
        
        <div class="titulo">ORDEN DE TRABAJO - OFFSET</div>
        
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
          <div class="seccion-titulo">📍 Referencia de Número de Salida</div>
          <div class="seccion-contenido">
            <div class="fila">
              <div class="campo" style="flex: 1;">
                <div class="campo-label">NÚMERO DE SALIDA SELECCIONADO</div>
                <div class="campo-valor" style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px;">${detalle.numero_salida || 'No especificado'}</div>
              </div>
              ${salidaImagenBase64 ? `
              <div class="campo" style="flex: 2; text-align: center;">
                <div class="campo-label">IMAGEN DE REFERENCIA</div>
                <img src="${salidaImagenBase64}" alt="Referencia de Salidas" style="max-width: 100%; height: auto; max-height: 150px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;" />
              </div>
              ` : ''}
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
  }

  /**
   * Genera HTML para PDF de orden DIGITAL
   */
  function generarHTMLOrdenDigital(orden: any, detalle: any, logoBase64: string, salidaImagenBase64: string): string {
    // Parsear productos digitales si existen
    let productos: any[] = [];
    try {
      if (detalle.productos_digital) {
        productos = typeof detalle.productos_digital === 'string' 
          ? JSON.parse(detalle.productos_digital) 
          : detalle.productos_digital;
      }
    } catch (e) {
      console.error('Error al parsear productos digitales:', e);
      productos = [];
    }

    // Generar filas de productos
    const filasProductos = productos.map((producto: any, index: number) => `
      <tr>
        <td class="tabla-celda">${index + 1}</td>
        <td class="tabla-celda">${producto.cantidad || ''}</td>
        <td class="tabla-celda">${producto.cod_mg || ''}</td>
        <td class="tabla-celda">${producto.cod_cliente || ''}</td>
        <td class="tabla-celda">${producto.producto || ''}</td>
        <td class="tabla-celda">${producto.avance || ''}</td>
        <td class="tabla-celda">${producto.medida_ancho || ''}</td>
        <td class="tabla-celda">${producto.medida_alto || ''}</td>
        <td class="tabla-celda">${producto.cavidad || ''}</td>
        <td class="tabla-celda">${producto.metros_impresos || ''}</td>
      </tr>
    `).join('');

    return `
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
          .seccion { margin-bottom: 12px; border: 1px solid #ddd; page-break-inside: avoid; }
          .seccion-titulo { background: #f0f0f0; padding: 6px 10px; font-weight: bold; font-size: 11px; border-bottom: 1px solid #ddd; }
          .seccion-contenido { padding: 10px; }
          .fila { display: flex; gap: 10px; margin-bottom: 6px; }
          .campo { flex: 1; }
          .campo-label { font-size: 9px; color: #666; margin-bottom: 3px; font-weight: bold; }
          .campo-valor { border: 1px solid #ddd; padding: 5px 8px; font-size: 10px; background: white; min-height: 28px; word-wrap: break-word; }
          .tabla-productos { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .tabla-header { background: #f5f5f5; font-size: 9px; font-weight: bold; text-align: center; }
          .tabla-celda { border: 1px solid #ddd; padding: 4px 6px; font-size: 9px; text-align: center; word-wrap: break-word; }
          .responsables { display: flex; gap: 6px; flex-wrap: wrap; }
          .responsable { flex: 1; min-width: 80px; text-align: center; border: 1px solid #ddd; padding: 6px; }
          .responsable-titulo { font-size: 8px; color: #666; margin-bottom: 3px; font-weight: bold; }
          .responsable-nombre { font-size: 10px; font-weight: bold; }
          .grid-tecnico { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : '<strong>MUNDOGRAFIC</strong>'}
          </div>
          <div class="orden-info">
            <div class="orden-numero">Orden de Trabajo DIGITAL</div>
            <div>Orden Nº: <strong>${orden.numero_orden || ''}</strong></div>
            <div>Orden de Compra: ${orden.orden_compra || ''}</div>
            <div>Cotización Nº: ${orden.numero_cotizacion || ''}</div>
          </div>
        </div>
        
        <div class="titulo">ORDEN DE TRABAJO - DIGITAL</div>
        
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
          <div class="seccion-titulo">📦 INFORMACIÓN DEL TRABAJO - PRODUCTOS</div>
          <div class="seccion-contenido">
            <table class="tabla-productos">
              <thead>
                <tr class="tabla-header">
                  <th class="tabla-celda">#</th>
                  <th class="tabla-celda">Cantidad</th>
                  <th class="tabla-celda">Cod MG</th>
                  <th class="tabla-celda">Cod Cliente</th>
                  <th class="tabla-celda">Producto</th>
                  <th class="tabla-celda">Avance (mm)</th>
                  <th class="tabla-celda">Ancho (mm)</th>
                  <th class="tabla-celda">Alto (mm)</th>
                  <th class="tabla-celda">Cavidad</th>
                  <th class="tabla-celda">Metros Imp.</th>
                </tr>
              </thead>
              <tbody>
                ${filasProductos || '<tr><td colspan="10" class="tabla-celda">No hay productos registrados</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">⚙️ INFORMACIÓN TÉCNICA</div>
          <div class="seccion-contenido">
            <div class="grid-tecnico">
              <div class="campo">
                <div class="campo-label">ADHERENCIA</div>
                <div class="campo-valor">${detalle.adherencia || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">MATERIAL</div>
                <div class="campo-valor">${detalle.material || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">LOTE MATERIAL</div>
                <div class="campo-valor">${detalle.lote_material || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">LOTE PRODUCCIÓN</div>
                <div class="campo-valor">${detalle.lote_produccion || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">IMPRESIÓN</div>
                <div class="campo-valor">${detalle.impresion || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TIPO IMPRESIÓN</div>
                <div class="campo-valor">${detalle.tipo_impresion || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TROQUEL</div>
                <div class="campo-valor">${detalle.troquel || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">CÓDIGO TROQUEL</div>
                <div class="campo-valor">${detalle.codigo_troquel || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TERMINADO ETIQUETA</div>
                <div class="campo-valor">${detalle.terminado_etiqueta || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TERMINADOS ESPECIALES</div>
                <div class="campo-valor">${detalle.terminados_especiales || ''}</div>
              </div>
              <div class="campo">
                <div class="campo-label">CANTIDAD POR ROLLO</div>
                <div class="campo-valor">${detalle.cantidad_por_rollo || ''}</div>
              </div>
            </div>
            <div class="fila" style="margin-top: 10px;">
              <div class="campo">
                <div class="campo-label">OBSERVACIONES</div>
                <div class="campo-valor">${detalle.observaciones || orden.notas_observaciones || ''}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">📍 Referencia de Número de Salida</div>
          <div class="seccion-contenido">
            <div class="fila">
              <div class="campo" style="flex: 1;">
                <div class="campo-label">NÚMERO DE SALIDA SELECCIONADO</div>
                <div class="campo-valor" style="font-size: 24px; font-weight: bold; text-align: center; padding: 15px;">${detalle.numero_salida || 'No especificado'}</div>
              </div>
              ${salidaImagenBase64 ? `
              <div class="campo" style="flex: 2; text-align: center;">
                <div class="campo-label">IMAGEN DE REFERENCIA</div>
                <img src="${salidaImagenBase64}" alt="Referencia de Salidas" style="max-width: 100%; height: auto; max-height: 150px; border: 1px solid #ddd; border-radius: 4px; margin-top: 5px;" />
              </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">👥 RESPONSABLES DEL PROCESO</div>
          <div class="seccion-contenido">
            <div class="responsables">
              <div class="responsable">
                <div class="responsable-titulo">VENDEDOR</div>
                <div class="responsable-nombre">${orden.vendedor || ''}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">PRE-PRENSA</div>
                <div class="responsable-nombre">${orden.preprensa || ''}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">IMPRESIÓN</div>
                <div class="responsable-nombre">${orden.prensa || ''}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">LAMINADO/BARNIZADO</div>
                <div class="responsable-nombre">${orden.laminado_barnizado || ''}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">TROQUELADO</div>
                <div class="responsable-nombre">${orden.troquelado || ''}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">TERMINADOS</div>
                <div class="responsable-nombre">${orden.terminados || ''}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">LIBERACIÓN PRODUCTO</div>
                <div class="responsable-nombre">${orden.liberacion_producto || ''}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generar y descargar PDF de una orden de trabajo
  router.get("/:id/pdf", authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      // 1. Obtener los datos de la orden de trabajo con número de cotización
      const result = await client.query(
        `SELECT ot.*, c.codigo_cotizacion as numero_cotizacion
         FROM orden_trabajo ot
         LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id
         WHERE ot.id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener el detalle común
      const detalleResult = await client.query(
        `SELECT * FROM detalle_orden_trabajo WHERE orden_trabajo_id = $1`,
        [id]
      );
      let detalle = detalleResult.rows[0] || {};
      
      // 2b. Obtener detalle específico según tipo de orden
      const tipoOrden = orden.tipo_orden || 'offset';
      if (tipoOrden === 'digital') {
        // Obtener detalle digital
        const detalleDigitalResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`,
          [id]
        );
        if (detalleDigitalResult.rows[0]) {
          detalle = { ...detalle, ...detalleDigitalResult.rows[0] };
        }
        
        // Obtener productos digitales
        const productosResult = await client.query(
          `SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
          [id]
        );
        detalle.productos_digital = productosResult.rows;
      } else {
        // Obtener detalle offset
        const detalleOffsetResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`,
          [id]
        );
        if (detalleOffsetResult.rows[0]) {
          detalle = { ...detalle, ...detalleOffsetResult.rows[0] };
        }
      }

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

      // 3b. Leer y convertir la imagen de salidas a base64
      const salidaImagenPath = path.join(__dirname, '../../../src/assets/img/salidas.png');
      let salidaImagenBase64 = '';
      try {
        const salidaBuffer = await fs.readFile(salidaImagenPath);
        salidaImagenBase64 = `data:image/png;base64,${salidaBuffer.toString('base64')}`;
      } catch (e: any) {
        console.error('No se pudo leer la imagen de salidas:', e);
        salidaImagenBase64 = '';
      }

      // 4. Generar HTML según el tipo de orden (digital u offset)
      const html = tipoOrden === 'digital' 
        ? generarHTMLOrdenDigital(orden, detalle, logoBase64, salidaImagenBase64)
        : generarHTMLOrdenOffset(orden, detalle, logoBase64, salidaImagenBase64);

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

  // ==================== ENDPOINTS DE PRODUCCIÓN ====================
  
  // Obtener todas las órdenes en producción con detalles
  router.get("/produccion/ordenes", authRequired(), async (req: any, res: any) => {
    try {
      console.log('📊 Obteniendo órdenes en producción...');
      
      const result = await client.query(`
        SELECT 
          ot.id,
          ot.numero_orden,
          ot.nombre_cliente,
          ot.contacto,
          ot.email,
          ot.telefono,
          ot.cantidad,
          ot.concepto,
          ot.fecha_creacion,
          ot.fecha_entrega,
          ot.estado,
          ot.notas_observaciones,
          ot.vendedor,
          ot.preprensa,
          ot.prensa,
          ot.terminados,
          ot.facturado,
          ot.id_cotizacion,
          dot.material,
          dot.corte_material,
          dot.cantidad_pliegos_compra,
          dot.exceso,
          dot.total_pliegos,
          dot.tamano,
          dot.tamano_abierto_1,
          dot.tamano_cerrado_1,
          dot.impresion,
          dot.instrucciones_impresion,
          dot.instrucciones_acabados,
          dot.instrucciones_empacado,
          dot.observaciones,
          dot.prensa_seleccionada,
          ot.created_at,
          ot.updated_at
        FROM orden_trabajo ot
        LEFT JOIN detalle_orden_trabajo dot ON ot.id = dot.orden_trabajo_id
        WHERE ot.estado = 'en producción'
        ORDER BY ot.fecha_entrega ASC, ot.created_at DESC
      `);
      
      console.log(`✅ Se encontraron ${result.rows.length} órdenes en producción`);
      res.json({ 
        success: true, 
        ordenes: result.rows,
        total: result.rows.length 
      });
    } catch (error: any) {
      console.error("❌ Error al obtener órdenes en producción:", error);
      res.status(500).json({ 
        success: false, 
        error: "Error al obtener órdenes en producción",
        details: error.message 
      });
    }
  });

  // Obtener métricas del dashboard de producción
  router.get("/produccion/metricas", authRequired(), async (req: any, res: any) => {
    try {
      console.log('📈 Calculando métricas de producción...');
      
      // Total de órdenes en producción
      const totalEnProduccion = await client.query(`
        SELECT COUNT(*) as total FROM orden_trabajo WHERE estado = 'en producción'
      `);
      
      // Órdenes retrasadas (fecha de entrega pasada)
      const retrasadas = await client.query(`
        SELECT COUNT(*) as total 
        FROM orden_trabajo 
        WHERE estado = 'en producción' 
        AND fecha_entrega < CURRENT_DATE
      `);
      
      // Órdenes por entregar hoy
      const hoy = await client.query(`
        SELECT COUNT(*) as total 
        FROM orden_trabajo 
        WHERE estado = 'en producción' 
        AND fecha_entrega = CURRENT_DATE
      `);
      
      // Órdenes por entregar esta semana
      const estaSemana = await client.query(`
        SELECT COUNT(*) as total 
        FROM orden_trabajo 
        WHERE estado = 'en producción' 
        AND fecha_entrega BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      `);
      
      // Órdenes completadas hoy
      const completadasHoy = await client.query(`
        SELECT COUNT(*) as total 
        FROM orden_trabajo 
        WHERE estado IN ('terminado', 'entregado', 'completado')
        AND DATE(updated_at) = CURRENT_DATE
      `);
      
      // Distribución por etapa de producción
      const distribucion = await client.query(`
        SELECT 
          CASE 
            WHEN preprensa::text = 'true' AND prensa::text = 'false' AND terminados::text = 'false' THEN 'preprensa'
            WHEN preprensa::text = 'true' AND prensa::text = 'true' AND terminados::text = 'false' THEN 'prensa'
            WHEN preprensa::text = 'true' AND prensa::text = 'true' AND terminados::text = 'true' THEN 'acabados'
            ELSE 'pendiente'
          END as etapa,
          COUNT(*) as cantidad
        FROM orden_trabajo 
        WHERE estado = 'en producción'
        GROUP BY etapa
      `);
      
      // Promedio de días en producción
      const promedioTiempo = await client.query(`
        SELECT 
          AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))) as promedio_dias
        FROM orden_trabajo 
        WHERE estado = 'en producción'
      `);

      const metricas = {
        totalEnProduccion: parseInt(totalEnProduccion.rows[0].total),
        retrasadas: parseInt(retrasadas.rows[0].total),
        porEntregarHoy: parseInt(hoy.rows[0].total),
        porEntregarSemana: parseInt(estaSemana.rows[0].total),
        completadasHoy: parseInt(completadasHoy.rows[0].total),
        distribucionEtapas: distribucion.rows,
        promedioDiasProduccion: parseFloat(promedioTiempo.rows[0].promedio_dias || 0).toFixed(1)
      };
      
      console.log('✅ Métricas calculadas:', metricas);
      res.json({ success: true, metricas });
    } catch (error: any) {
      console.error("❌ Error al calcular métricas:", error);
      res.status(500).json({ 
        success: false, 
        error: "Error al calcular métricas de producción",
        details: error.message 
      });
    }
  });

  // Cambiar estado/etapa de producción de una orden
  router.put("/produccion/:id/estado", authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    const { estado, preprensa, prensa, terminados } = req.body;
    
    try {
      console.log(`🔄 Actualizando estado de orden ${id}:`, { estado, preprensa, prensa, terminados });
      
      let query = 'UPDATE orden_trabajo SET updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [];
      let paramCounter = 1;
      
      if (estado !== undefined) {
        query += `, estado = $${paramCounter}`;
        params.push(estado);
        paramCounter++;
      }
      if (preprensa !== undefined) {
        query += `, preprensa = $${paramCounter}`;
        params.push(preprensa);
        paramCounter++;
      }
      if (prensa !== undefined) {
        query += `, prensa = $${paramCounter}`;
        params.push(prensa);
        paramCounter++;
      }
      if (terminados !== undefined) {
        query += `, terminados = $${paramCounter}`;
        params.push(terminados);
        paramCounter++;
      }
      
      query += ` WHERE id = $${paramCounter} RETURNING *`;
      params.push(id);
      
      const result = await client.query(query, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Orden no encontrada" });
      }
      
      console.log('✅ Estado actualizado correctamente');
      res.json({ success: true, orden: result.rows[0] });
    } catch (error: any) {
      console.error("❌ Error al actualizar estado:", error);
      res.status(500).json({ 
        success: false, 
        error: "Error al actualizar estado de producción",
        details: error.message 
      });
    }
  });

  // Obtener historial/actividades recientes de producción
  router.get("/produccion/actividades", authRequired(), async (req: any, res: any) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`📜 Obteniendo últimas ${limit} actividades...`);
      
      const result = await client.query(`
        SELECT 
          ot.id,
          ot.numero_orden,
          ot.nombre_cliente,
          ot.concepto,
          ot.estado,
          ot.updated_at,
          ot.preprensa,
          ot.prensa,
          ot.terminados
        FROM orden_trabajo ot
        WHERE ot.estado IN ('en producción', 'terminado', 'entregado', 'completado')
        ORDER BY ot.updated_at DESC
        LIMIT $1
      `, [limit]);
      
      console.log(`✅ ${result.rows.length} actividades encontradas`);
      res.json({ success: true, actividades: result.rows });
    } catch (error: any) {
      console.error("❌ Error al obtener actividades:", error);
      res.status(500).json({ 
        success: false, 
        error: "Error al obtener actividades recientes",
        details: error.message 
      });
    }
  });

  // ==================== FIN ENDPOINTS DE PRODUCCIÓN ====================

  // Endpoint de preview para generar PDF en base64 (igual que cotizaciones)
  router.get("/:id/preview", authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      console.log('📋 Generando preview de orden de trabajo:', id);
      
      // 1. Obtener los datos de la orden de trabajo con número de cotización
      const result = await client.query(
        `SELECT ot.*, c.codigo_cotizacion as numero_cotizacion
         FROM orden_trabajo ot
         LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id
         WHERE ot.id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener el detalle común
      const detalleResult = await client.query(
        `SELECT * FROM detalle_orden_trabajo WHERE orden_trabajo_id = $1`,
        [id]
      );
      let detalle = detalleResult.rows[0] || {};
      
      // 2b. Obtener detalle específico según tipo de orden
      const tipoOrden = orden.tipo_orden || 'offset';
      if (tipoOrden === 'digital') {
        // Obtener detalle digital
        const detalleDigitalResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`,
          [id]
        );
        if (detalleDigitalResult.rows[0]) {
          detalle = { ...detalle, ...detalleDigitalResult.rows[0] };
        }
        
        // Obtener productos digitales
        const productosResult = await client.query(
          `SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
          [id]
        );
        detalle.productos_digital = productosResult.rows;
      } else {
        // Obtener detalle offset
        const detalleOffsetResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`,
          [id]
        );
        if (detalleOffsetResult.rows[0]) {
          detalle = { ...detalle, ...detalleOffsetResult.rows[0] };
        }
      }

      // 3. Leer y convertir el logo a base64
      const logoPath = path.join(__dirname, '../../public/images/logo-mundografic.png');
      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (e: any) {
        console.error('No se pudo leer el logo:', e);
      }

      // 3b. Leer y convertir la imagen de salidas a base64
      const salidaImagenPath = path.join(__dirname, '../../../src/assets/img/salidas.png');
      let salidaImagenBase64 = '';
      try {
        const salidaBuffer = await fs.readFile(salidaImagenPath);
        salidaImagenBase64 = `data:image/png;base64,${salidaBuffer.toString('base64')}`;
      } catch (e: any) {
        console.error('No se pudo leer la imagen de salidas:', e);
        salidaImagenBase64 = '';
      }

      // 4. Generar HTML según el tipo de orden (digital u offset)
      const html = tipoOrden === 'digital' 
        ? generarHTMLOrdenDigital(orden, detalle, logoBase64, salidaImagenBase64)
        : generarHTMLOrdenOffset(orden, detalle, logoBase64, salidaImagenBase64);

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
