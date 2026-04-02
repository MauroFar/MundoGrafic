// ordenTrabajo.js
import express, { Request, Response, RequestHandler } from "express";
import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import authRequired from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
import {
  validateOrdenTrabajo,
  validateOrdenTrabajoUpdate,
} from "../middleware/ordenTrabajoValidation";

export default (client: any) => {
  const router = express.Router();

  // Mapeo y normalización de estados (display -> canonical)
  const CANONICAL_STATES = new Set([
    "en_preprensa",
    "en_prensa",
    "laminado",
    "troquelado",
    "terminados",
    "liberado",
    "entregado",
  ]);

  const DISPLAY_TO_CANON: Record<string, string> = {
    // Preprensa variants
    preprensa: "en_preprensa",
    "pre prensa": "en_preprensa",
    "en preprensa": "en_preprensa",

    // Impresión / prensa variants (unique keys only)
    impresion: "en_prensa",
    "prensa / impresion": "en_prensa",
    "prensa / impresión": "en_prensa",
    "prensa impresion": "en_prensa",
    "en prensa": "en_prensa",

    // Laminado variants
    "laminado/barnizado": "laminado",
    "laminado barnizado": "laminado",
    laminado: "laminado",

    // Otros estados
    troquelado: "troquelado",
    terminados: "terminados",
    "producto liberado": "liberado",
    liberado: "liberado",
    "producto entregado": "entregado",
    entregado: "entregado",
  };

  function normalizeString(s: any): string {
    if (s === null || s === undefined) return "";
    return String(s)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  function normalizeEstado(input: any): string | null {
    if (input === null || input === undefined) return null;
    const normalized = normalizeString(input);
    // Si ya es un canonical conocido
    if (CANONICAL_STATES.has(normalized)) return normalized;
    // Buscar en display map
    if (DISPLAY_TO_CANON[normalized]) return DISPLAY_TO_CANON[normalized];
    return null;
  }

  // Obtener datos del cliente de una cotización
  router.get(
    "/datosCotizacion/:id",
    authRequired(),
    async (req, res): Promise<void> => {
      const { id } = req.params;

      try {
        console.log(`🔍 Obteniendo datos de cotización ${id}`);

        const result = await client.query(
          `
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
      `,
          [id],
        );

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
        res
          .status(500)
          .json({
            error: "Error al obtener los datos de la cotización",
            details: err.message,
          });
      }
    },
  );

  // Crear una orden de trabajo desde una cotización o manualmente
  router.post(
    "/crearOrdenTrabajo",
    authRequired(),
    checkPermission(client, "ordenes_trabajo", "crear"),
    validateOrdenTrabajo,
    async (req, res): Promise<void> => {
      console.log("🚀 CREAR ORDEN - Iniciando proceso de creación");

      const {
        nombre_cliente,
        orden_compra,
        contacto,
        email,
        telefono,
        cantidad,
        concepto,
        fecha_creacion,
        fecha_entrega,
        estado,
        notas_observaciones,
        vendedor,
        preprensa,
        prensa,
        terminados,
        facturado,
        laminado_barnizado,
        troquelado,
        liberacion_producto, // Campos adicionales para digital
        // Campos de cantidad final para cada responsable
        vendedor_cantidad_final,
        preprensa_cantidad_final,
        prensa_cantidad_final,
        laminado_barnizado_cantidad_final,
        troquelado_cantidad_final,
        terminados_cantidad_final,
        liberacion_producto_cantidad_final,
        id_cotizacion,
        id_detalle_cotizacion,
        tipo_orden, // Nuevo campo para diferenciar offset/digital
        // Nuevos campos de trabajo - extraer del objeto detalle
        detalle,
      } = req.body;

      // Obtener el ID del usuario del token JWT
      const userId = (req as any).user.id;
      console.log("👤 Usuario creando orden:", userId);

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
      const proveedorMaterial = detalle?.proveedor_material;
      const productosDigital = detalle?.productos_digital;
      const espesor = detalle?.espesor;

      console.log("📦 CREAR ORDEN - Datos del detalle recibidos:", {
        tipo_orden,
        productos_digital: productosDigital
          ? `Array con ${productosDigital.length} productos`
          : "null",
        adherencia,
        material,
        lote_material: loteMaterial,
        numero_salida: numeroSalida,
      });

      try {
        await client.query("BEGIN");

        // Determinar estado_orden_offset_id para órdenes offset (estado inicial: pendiente)
        let estadoOffsetId: number | null = null;
        if ((tipo_orden || "offset") !== "digital") {
          const estadoRes = await client.query(
            `SELECT id FROM estado_orden_offset WHERE key = 'pendiente' LIMIT 1`,
          );
          estadoOffsetId = estadoRes.rows[0]?.id ?? null;
        }

        // 1. Insertar en orden_trabajo (solo columnas que existen en el nuevo esquema)
        const ordenResult = await client.query(
          `
        INSERT INTO orden_trabajo (
          nombre_cliente, orden_compra, contacto, email, telefono,
          fecha_creacion, fecha_entrega, notas_observaciones,
          id_cotizacion, id_detalle_cotizacion, tipo_orden, created_by,
          estado_orden_offset_id
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING id, numero_orden
      `,
          [
            nombre_cliente,
            orden_compra,
            contacto,
            email,
            telefono,
            fecha_creacion,
            fecha_entrega,
            notas_observaciones,
            id_cotizacion,
            id_detalle_cotizacion,
            tipo_orden || "offset",
            userId,
            estadoOffsetId,
          ],
        );
        const ordenId = ordenResult.rows[0].id;

        // 2. Insertar detalle específico según tipo de orden (responsables van al detalle)
        if (tipo_orden === "digital") {
          // 2a. Insertar detalle digital (incluye responsables y campos comunes)
          await client.query(
            `
          INSERT INTO detalle_orden_trabajo_digital (
            orden_trabajo_id, adherencia, lote_material, lote_produccion, tipo_impresion,
            troquel, codigo_troquel, terminado_etiqueta, terminados_especiales, cantidad_por_rollo,
            proveedor_material, espesor,
            material, impresion, observaciones, numero_salida, prensa_seleccionada,
            vendedor, preprensa, prensa, laminado_barnizado, troquelado, terminados, facturado, liberacion_producto,
            vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final,
            laminado_barnizado_cantidad_final, troquelado_cantidad_final,
            terminados_cantidad_final, liberacion_producto_cantidad_final
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
        `,
            [
              ordenId,
              adherencia || null,
              loteMaterial || null,
              loteProduccion || null,
              tipoImpresion || null,
              troquel || null,
              codigoTroquel || null,
              terminadoEtiqueta || null,
              terminadosEspeciales || null,
              cantidadPorRollo || null,
              proveedorMaterial || null,
              espesor || null,
              material || null,
              impresion || null,
              observaciones || null,
              numeroSalida || null,
              prensaSeleccionada || null,
              vendedor || null,
              preprensa || null,
              prensa || null,
              laminado_barnizado || null,
              troquelado || null,
              terminados || null,
              facturado || null,
              liberacion_producto || null,
              vendedor_cantidad_final || null,
              preprensa_cantidad_final || null,
              prensa_cantidad_final || null,
              laminado_barnizado_cantidad_final || null,
              troquelado_cantidad_final || null,
              terminados_cantidad_final || null,
              liberacion_producto_cantidad_final || null,
            ],
          );

          // 3b. Insertar productos digitales en tabla relacional
          if (
            productosDigital &&
            Array.isArray(productosDigital) &&
            productosDigital.length > 0
          ) {
            for (let i = 0; i < productosDigital.length; i++) {
              const producto = productosDigital[i];
              await client.query(
                `
              INSERT INTO productos_orden_digital (
                orden_trabajo_id, cantidad, cod_mg, cod_cliente, producto,
                avance, medida_ancho, medida_alto, cavidad, metros_impresos, orden,
                gap_horizontal, gap_vertical, tamano_papel_ancho, tamano_papel_largo,
                numero_salida
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `,
                [
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
                  i + 1, // orden
                  producto.gap_horizontal || null,
                  producto.gap_vertical || null,
                  producto.tamano_papel_ancho || null,
                  producto.tamano_papel_largo || null,
                  producto.numero_salida || null,
                ],
              );
            }
            console.log(
              `📦 ${productosDigital.length} productos digitales insertados`,
            );
          }
        } else {
          // 2b. Insertar detalle offset (incluye responsables + campos comunes)
          await client.query(
            `
          INSERT INTO detalle_orden_trabajo_offset (
            orden_trabajo_id, corte_material, cantidad_pliegos_compra, exceso, total_pliegos,
            tamano, tamano_abierto_1, tamano_cerrado_1, instrucciones_impresion,
            instrucciones_acabados, instrucciones_empacado, prensa_seleccionada,
            material, impresion, observaciones, numero_salida,
            vendedor, preprensa, prensa, terminados, facturado,
            vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final, terminados_cantidad_final
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
        `,
            [
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
              instruccionesEmpacado || null,
              prensaSeleccionada || null,
              material || null,
              impresion || null,
              observaciones || null,
              numeroSalida || null,
              vendedor || null,
              preprensa || null,
              prensa || null,
              terminados || null,
              facturado || null,
              vendedor_cantidad_final || null,
              preprensa_cantidad_final || null,
              prensa_cantidad_final || null,
              terminados_cantidad_final || null,
            ],
          );

          // 2c. Insertar productos offset
          const productosOffset = detalle?.productos_offset;
          if (
            productosOffset &&
            Array.isArray(productosOffset) &&
            productosOffset.length > 0
          ) {
            for (let i = 0; i < productosOffset.length; i++) {
              const prod = productosOffset[i];
              await client.query(
                `
              INSERT INTO productos_orden_offset (
                orden_trabajo_id, concepto, cantidad, tamano_abierto, tamano_cerrado, material, orden
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
                [
                  ordenId,
                  prod.concepto || null,
                  prod.cantidad || null,
                  prod.tamano_abierto || null,
                  prod.tamano_cerrado || null,
                  prod.material || null,
                  i + 1,
                ],
              );
            }
            console.log(
              `📦 ${productosOffset.length} productos offset insertados`,
            );
          } else if (concepto || cantidad) {
            // Compatibilidad hacia atrás: un solo producto desde campos top-level
            await client.query(
              `
            INSERT INTO productos_orden_offset (orden_trabajo_id, concepto, cantidad, orden)
            VALUES ($1, $2, $3, $4)
          `,
              [ordenId, concepto || null, cantidad || null, 1],
            );
          }
        }

        await client.query("COMMIT");
        console.log(
          "✅ ORDEN CREADA EXITOSAMENTE - Número:",
          ordenResult.rows[0].numero_orden,
        );
        res.status(201).json({
          message: "Orden de trabajo creada correctamente",
          numero_orden: ordenResult.rows[0].numero_orden,
        });
      } catch (error: any) {
        await client.query("ROLLBACK");
        console.error("❌ ERROR AL CREAR ORDEN DE TRABAJO:", error);
        res.status(500).json({ error: "No se pudo crear la orden de trabajo" });
      }
    },
  );

  // Listar órdenes de trabajo con filtros y paginación
  router.get(
    "/listar",
    authRequired(),
    checkPermission(client, "ordenes_trabajo", "leer"),
    async (req, res): Promise<void> => {
      try {
        const { busqueda, fechaDesde, fechaHasta, limite, tipo_orden } = req.query;
        let query = `
        SELECT ot.id, ot.numero_orden, ot.nombre_cliente, ot.fecha_creacion, ot.tipo_orden, ot.id_cotizacion,
               ot.estado_orden_digital_id, eod.key AS estado_digital_key, eod.titulo AS estado_digital_titulo,
               ot.estado_orden_offset_id, eoo.key AS estado_offset_key, eoo.titulo AS estado_offset_titulo
        FROM orden_trabajo ot
        LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
        LEFT JOIN estado_orden_offset eoo ON ot.estado_orden_offset_id = eoo.id
      `;
        let where: string[] = [];
        let params: any[] = [];
        let paramCount = 1;

        if (busqueda) {
          where.push(`(
          CAST(numero_orden AS TEXT) ILIKE $${paramCount} OR
          nombre_cliente ILIKE $${paramCount}
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

        if (tipo_orden) {
          if (String(tipo_orden).toLowerCase() === "digital") {
            where.push(`ot.tipo_orden = $${paramCount}`);
            params.push("digital");
          } else {
            where.push(`(ot.tipo_orden IS NULL OR ot.tipo_orden <> $${paramCount})`);
            params.push("digital");
          }
          paramCount++;
        }

        if (where.length > 0) {
          query += " WHERE " + where.join(" AND ");
        }
        query += " ORDER BY id DESC";
        if (limite) {
          query += ` LIMIT $${paramCount}`;
          params.push(limite);
        }
        const result = await client.query(query, params);
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error al listar órdenes de trabajo:", error);
        res.status(500).json({ error: "Error al listar órdenes de trabajo" });
      }
    },
  );

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
        where.push("c.ruc_id = $" + (params.length + 1));
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
        query += " WHERE " + where.join(" AND ");
      }
      query += " ORDER BY ot.id DESC";

      const result = await client.query(query, params);
      res.json(result.rows);
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Error al buscar órdenes de trabajo:", err.message);
      res.status(500).json({ error: "Error al buscar órdenes de trabajo" });
    }
  });

  // Obtener datos de una orden de trabajo por ID
  router.get(
    "/orden/:id",
    authRequired(),
    checkPermission(client, "ordenes_trabajo", "leer"),
    async (req: any, res: any) => {
      const { id } = req.params;
      try {
        // Obtener datos generales de la orden con información de auditoría y estados
        const result = await client.query(
          `SELECT ot.*, 
         c.codigo_cotizacion as numero_cotizacion, 
         cl.telefono_cliente, 
         cl.email_cliente, 
         cl.direccion_cliente,
         u1.nombre as created_by_nombre,
         u2.nombre as updated_by_nombre,
         eod.key  AS estado_digital_key,  eod.titulo  AS estado_digital_titulo,
         eoo.key  AS estado_offset_key,   eoo.titulo  AS estado_offset_titulo
         FROM orden_trabajo ot
         LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id
         LEFT JOIN clientes cl ON c.cliente_id = cl.id
         LEFT JOIN usuarios u1 ON ot.created_by = u1.id
         LEFT JOIN usuarios u2 ON ot.updated_by = u2.id
         LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
         LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
         WHERE ot.id = $1`,
          [id],
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: "Orden no encontrada" });
          return;
        }
        const orden = result.rows[0];

        // Obtener detalle específico según tipo de orden
        orden.detalle = {};
        if (orden.tipo_orden === "digital") {
          // Obtener detalle digital (incluye responsables y campos comunes)
          const detalleDigitalResult = await client.query(
            `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`,
            [id],
          );
          if (detalleDigitalResult.rows[0]) {
            orden.detalle = detalleDigitalResult.rows[0];
          }

          // Obtener productos digitales
          const productosResult = await client.query(
            `SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
            [id],
          );
          orden.detalle.productos_digital = productosResult.rows;
        } else {
          // Obtener detalle offset (incluye responsables y campos comunes)
          const detalleOffsetResult = await client.query(
            `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`,
            [id],
          );
          if (detalleOffsetResult.rows[0]) {
            orden.detalle = detalleOffsetResult.rows[0];
          }
          // Obtener productos offset
          const productosOffsetResult = await client.query(
            `SELECT * FROM productos_orden_offset WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
            [id],
          );
          orden.detalle.productos_offset = productosOffsetResult.rows;
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
        console.error("Error al obtener la orden:", err.message);
        res.status(500).json({ error: "Error del servidor" });
      }
    },
  );

  /////editar y actualizar datos orden de trabajo   // Editar una orden de trabajo existente
  router.put(
    "/editarOrden/:id",
    authRequired(),
    checkPermission(client, "ordenes_trabajo", "editar"),
    validateOrdenTrabajoUpdate,
    async (req, res): Promise<void> => {
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
        vendedor_cantidad_final,
        preprensa_cantidad_final,
        prensa_cantidad_final,
        laminado_barnizado_cantidad_final,
        troquelado_cantidad_final,
        terminados_cantidad_final,
        liberacion_producto_cantidad_final,
        id_detalle_cotizacion,
        tipo_orden,
        detalle,
      } = req.body;
      const userId = (req as any).user.id;
      // Campos comunes de detalle (offset/digital)
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
        await client.query("BEGIN");
        // Actualizar datos generales (solo columnas que existen en el nuevo esquema)
        const result = await client.query(
          `UPDATE orden_trabajo
        SET nombre_cliente = $1,
            orden_compra = $2,
            fecha_creacion = $3,
            fecha_entrega = $4,
            telefono = $5,
            email = $6,
            contacto = $7,
            notas_observaciones = $8,
            id_detalle_cotizacion = $9,
            tipo_orden = $10,
            updated_by = $11,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *`,
          [
            nombre_cliente,
            orden_compra,
            fecha_creacion,
            fecha_entrega,
            telefono,
            email,
            contacto,
            notas_observaciones,
            id_detalle_cotizacion,
            tipo_orden,
            userId,
            id,
          ],
        );
        if (result.rows.length === 0) {
          await client.query("ROLLBACK");
          res.status(404).json({ error: "Orden no encontrada" });
          return;
        }

        // Actualizar detalle específico según tipo de orden (responsables incluidos en el detalle)
        if (tipo_orden === "digital") {
          // Actualizar detalle digital (INSERT or UPDATE)
          await client.query(
            `
          INSERT INTO detalle_orden_trabajo_digital (
            orden_trabajo_id, adherencia, lote_material, lote_produccion, tipo_impresion,
            troquel, codigo_troquel, terminado_etiqueta, terminados_especiales, cantidad_por_rollo,
            proveedor_material, espesor,
            material, impresion, observaciones, numero_salida, prensa_seleccionada,
            vendedor, preprensa, prensa, laminado_barnizado, troquelado, terminados, facturado, liberacion_producto,
            vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final,
            laminado_barnizado_cantidad_final, troquelado_cantidad_final,
            terminados_cantidad_final, liberacion_producto_cantidad_final
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
          ON CONFLICT (orden_trabajo_id) DO UPDATE SET
            adherencia = $2, lote_material = $3, lote_produccion = $4, tipo_impresion = $5,
            troquel = $6, codigo_troquel = $7, terminado_etiqueta = $8, terminados_especiales = $9,
            cantidad_por_rollo = $10, proveedor_material = $11, espesor = $12,
            material = $13, impresion = $14, observaciones = $15, numero_salida = $16, prensa_seleccionada = $17,
            vendedor = $18, preprensa = $19, prensa = $20, laminado_barnizado = $21, troquelado = $22,
            terminados = $23, facturado = $24, liberacion_producto = $25,
            vendedor_cantidad_final = $26, preprensa_cantidad_final = $27, prensa_cantidad_final = $28,
            laminado_barnizado_cantidad_final = $29, troquelado_cantidad_final = $30,
            terminados_cantidad_final = $31, liberacion_producto_cantidad_final = $32,
            updated_at = CURRENT_TIMESTAMP
        `,
            [
              id,
              adherencia || null,
              loteMaterial || null,
              loteProduccion || null,
              tipoImpresion || null,
              troquel || null,
              codigoTroquel || null,
              terminadoEtiqueta || null,
              terminadosEspeciales || null,
              cantidadPorRollo || null,
              detalle?.proveedor_material || null,
              detalle?.espesor || null,
              material || null,
              impresion || null,
              observaciones || null,
              numeroSalida || null,
              prensaSeleccionada || null,
              vendedor || null,
              preprensa || null,
              prensa || null,
              laminado_barnizado || null,
              troquelado || null,
              terminados || null,
              facturado || null,
              liberacion_producto || null,
              vendedor_cantidad_final || null,
              preprensa_cantidad_final || null,
              prensa_cantidad_final || null,
              laminado_barnizado_cantidad_final || null,
              troquelado_cantidad_final || null,
              terminados_cantidad_final || null,
              liberacion_producto_cantidad_final || null,
            ],
          );

          // Actualizar productos digitales: eliminar existentes y crear nuevos
          await client.query(
            `DELETE FROM productos_orden_digital WHERE orden_trabajo_id = $1`,
            [id],
          );

          if (
            productosDigital &&
            Array.isArray(productosDigital) &&
            productosDigital.length > 0
          ) {
            for (let i = 0; i < productosDigital.length; i++) {
              const producto = productosDigital[i];
              await client.query(
                `
              INSERT INTO productos_orden_digital (
                orden_trabajo_id, cantidad, cod_mg, cod_cliente, producto,
                avance, medida_ancho, medida_alto, cavidad, metros_impresos, orden,
                gap_horizontal, gap_vertical, tamano_papel_ancho, tamano_papel_largo,
                numero_salida
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `,
                [
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
                  i + 1,
                  producto.gap_horizontal || null,
                  producto.gap_vertical || null,
                  producto.tamano_papel_ancho || null,
                  producto.tamano_papel_largo || null,
                  producto.numero_salida || null,
                ],
              );
            }
          }
        } else {
          // Actualizar detalle offset (INSERT or UPDATE) con responsables
          await client.query(
            `
          INSERT INTO detalle_orden_trabajo_offset (
            orden_trabajo_id, corte_material, cantidad_pliegos_compra, exceso, total_pliegos,
            tamano, tamano_abierto_1, tamano_cerrado_1, instrucciones_impresion,
            instrucciones_acabados, instrucciones_empacado, prensa_seleccionada,
            material, impresion, observaciones, numero_salida,
            vendedor, preprensa, prensa, terminados, facturado,
            vendedor_cantidad_final, preprensa_cantidad_final, prensa_cantidad_final, terminados_cantidad_final
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
          ON CONFLICT (orden_trabajo_id) DO UPDATE SET
            corte_material = $2, cantidad_pliegos_compra = $3, exceso = $4, total_pliegos = $5,
            tamano = $6, tamano_abierto_1 = $7, tamano_cerrado_1 = $8,
            instrucciones_impresion = $9, instrucciones_acabados = $10, instrucciones_empacado = $11,
            prensa_seleccionada = $12,
            material = $13, impresion = $14, observaciones = $15, numero_salida = $16,
            vendedor = $17, preprensa = $18, prensa = $19, terminados = $20, facturado = $21,
            vendedor_cantidad_final = $22, preprensa_cantidad_final = $23,
            prensa_cantidad_final = $24, terminados_cantidad_final = $25,
            updated_at = CURRENT_TIMESTAMP
        `,
            [
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
              instruccionesEmpacado || null,
              prensaSeleccionada || null,
              material || null,
              impresion || null,
              observaciones || null,
              numeroSalida || null,
              vendedor || null,
              preprensa || null,
              prensa || null,
              terminados || null,
              facturado || null,
              vendedor_cantidad_final || null,
              preprensa_cantidad_final || null,
              prensa_cantidad_final || null,
              terminados_cantidad_final || null,
            ],
          );

          // Actualizar productos offset: eliminar existentes y recrear
          await client.query(
            `DELETE FROM productos_orden_offset WHERE orden_trabajo_id = $1`,
            [id],
          );
          const productosOffset = detalle?.productos_offset;
          if (
            productosOffset &&
            Array.isArray(productosOffset) &&
            productosOffset.length > 0
          ) {
            for (let i = 0; i < productosOffset.length; i++) {
              const prod = productosOffset[i];
              await client.query(
                `
              INSERT INTO productos_orden_offset (
                orden_trabajo_id, concepto, cantidad, tamano_abierto, tamano_cerrado, material, orden
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
                [
                  id,
                  prod.concepto || null,
                  prod.cantidad || null,
                  prod.tamano_abierto || null,
                  prod.tamano_cerrado || null,
                  prod.material || null,
                  i + 1,
                ],
              );
            }
          } else if (concepto || cantidad) {
            // Compatibilidad hacia atrás: fieldes top-level
            await client.query(
              `
            INSERT INTO productos_orden_offset (orden_trabajo_id, concepto, cantidad, orden)
            VALUES ($1, $2, $3, $4)
          `,
              [id, concepto || null, cantidad || null, 1],
            );
          }
        }

        await client.query("COMMIT");
        res.json({
          message: "Orden actualizada correctamente",
          orden: result.rows[0],
        });
      } catch (error: unknown) {
        await client.query("ROLLBACK");
        const err = error as Error;
        console.error("Error al editar la orden de trabajo:", err.message);
        res
          .status(500)
          .json({ error: "Error al actualizar la orden de trabajo" });
      }
    },
  );

  // Endpoint para obtener el próximo número de orden
  router.get("/proximoNumero", async (req, res): Promise<void> => {
    try {
      const result = await client.query(
        "SELECT MAX(numero_orden) AS max_numero FROM orden_trabajo",
      );
      const maxNumero = result.rows[0].max_numero || "OT-000000";

      // Extraer el número del formato "OT-000001"
      const numeroMatch = maxNumero.match(/OT-(\d+)/);
      const numeroActual = numeroMatch ? parseInt(numeroMatch[1]) : 0;
      const proximoNumero = String(numeroActual + 1).padStart(6, "0");

      res.json({ proximoNumero });
    } catch (error: unknown) {
      const err = error as Error;
      console.error(
        "Error al obtener el próximo número de orden:",
        err.message,
      );
      res
        .status(500)
        .json({ error: "Error al obtener el próximo número de orden" });
    }
  });

  // Eliminar una orden de trabajo por id
  router.delete(
    "/eliminar/:id",
    authRequired(),
    checkPermission(client, "ordenes_trabajo", "eliminar"),
    async (req, res): Promise<void> => {
      const { id } = req.params;
      try {
        const result = await client.query(
          "DELETE FROM orden_trabajo WHERE id = $1 RETURNING *",
          [id],
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: "Orden no encontrada" });
          return;
        }
        res.json({ message: "Orden eliminada correctamente" });
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Error al eliminar la orden de trabajo:", err.message);
        res
          .status(500)
          .json({ error: "Error al eliminar la orden de trabajo" });
      }
    },
  );

  // ============================================
  // FUNCIONES AUXILIARES PARA GENERAR PDFs
  // ============================================

  /**
   * Genera HTML para PDF de orden OFFSET
   */
  function generarHTMLOrdenOffset(
    orden: any,
    detalle: any,
    logoBase64: string,
    salidaImagenBase64: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 12px; font-size: 9px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
          .logo-section img { height: 35px; }
          .orden-info { text-align: right; font-size: 8px; }
          .orden-numero { font-size: 14px; font-weight: bold; }
          .titulo { text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 8px; }
          .seccion { margin-bottom: 6px; border: 1px solid #ddd; }
          .seccion-titulo { background: #f0f0f0; padding: 3px 6px; font-weight: bold; font-size: 9px; border-bottom: 1px solid #ddd; }
          .seccion-contenido { padding: 5px; }
          .fila { display: flex; gap: 6px; margin-bottom: 3px; }
          .campo { flex: 1; }
          .campo-label { font-size: 7px; color: #666; margin-bottom: 1px; font-weight: bold; }
          .campo-valor { border: 1px solid #ddd; padding: 3px 5px; font-size: 8px; background: white; min-height: 20px; }
          .responsables { display: flex; gap: 4px; }
          .responsable { flex: 1; text-align: center; border: 1px solid #ddd; padding: 3px; }
          .responsable-titulo { font-size: 7px; color: #666; margin-bottom: 1px; font-weight: bold; }
          .responsable-nombre { font-size: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : "<strong>MUNDOGRAFIC</strong>"}
          </div>
          <div class="orden-info">
            <div class="orden-numero">Orden de Trabajo OFFSET</div>
            <div>Orden Nº: <strong>${orden.numero_orden || ""}</strong></div>
            <div>Orden de Compra: ${orden.orden_compra || ""}</div>
            <div>Cotización Nº: ${orden.numero_cotizacion || ""}</div>
          </div>
        </div>
        
        <div class="titulo">ORDEN DE TRABAJO - OFFSET</div>
        
        <div class="seccion">
          <div class="seccion-titulo">📋 INFORMACIÓN DEL CLIENTE</div>
          <div class="seccion-contenido">
            <div class="fila">
              <div class="campo" style="flex: 2;">
                <div class="campo-label">CLIENTE</div>
                <div class="campo-valor">${orden.nombre_cliente || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">CONTACTO</div>
                <div class="campo-valor">${orden.contacto || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TELÉFONO</div>
                <div class="campo-valor">${orden.telefono || ""}</div>
              </div>
              <div class="campo" style="flex: 1.5;">
                <div class="campo-label">EMAIL</div>
                <div class="campo-valor">${orden.email || ""}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">Información del Trabajo</div>
          <div class="seccion-contenido">
            <div class="fila">
              <div class="campo" style="flex: 2;">
                <div class="campo-label">CONCEPTO / DESCRIPCIÓN</div>
                <div class="campo-valor">${detalle.productos_offset && detalle.productos_offset.length > 0 ? detalle.productos_offset.map((p: any) => `${p.concepto || ""} (${p.cantidad || ""})`.trim().replace(/\(\)$/, "")).join(" | ") : ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">FECHA CREACIÓN</div>
                <div class="campo-valor">${orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString("es-EC", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">FECHA ENTREGA</div>
                <div class="campo-valor">${orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString("es-EC", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}</div>
              </div>
            </div>
            <div class="fila">
              <div class="campo">
                <div class="campo-label">TAMAÑO ABIERTO</div>
                <div class="campo-valor">${detalle.tamano_abierto_1 || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TAMAÑO CERRADO</div>
                <div class="campo-valor">${detalle.tamano_cerrado_1 || ""}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">Material, Corte y Cantidad de Pliegos</div>
          <div class="seccion-contenido">
            <div class="fila">
              <div class="campo" style="flex: 2;">
                <div class="campo-label">MATERIAL</div>
                <div class="campo-valor">${detalle.material || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">CORTE DE MATERIAL</div>
                <div class="campo-valor">${detalle.corte_material || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">PLIEGOS DE COMPRA</div>
                <div class="campo-valor">${detalle.cantidad_pliegos_compra || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">EXCESO</div>
                <div class="campo-valor">${detalle.exceso || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TOTAL</div>
                <div class="campo-valor">${detalle.total_pliegos || ""}</div>
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
                <div class="campo-valor">${detalle.impresion || ""}</div>
              </div>
              <div class="campo" style="flex: 2;">
                <div class="campo-label">INSTRUCCIONES DE IMPRESIÓN</div>
                <div class="campo-valor">${detalle.instrucciones_impresion || ""}</div>
              </div>
            </div>
            <div class="fila">
              <div class="campo">
                <div class="campo-label">INSTRUCCIONES DE ACABADOS</div>
                <div class="campo-valor">${detalle.instrucciones_acabados || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">INSTRUCCIONES DE EMPACADO</div>
                <div class="campo-valor">${detalle.instrucciones_empacado || ""}</div>
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
                <div class="campo-valor">${detalle.prensa_seleccionada || ""}</div>
              </div>
              <div class="campo" style="flex: 2;">
                <div class="campo-label">OBSERVACIONES GENERALES</div>
                <div class="campo-valor">${detalle.observaciones || ""}</div>
              </div>
            </div>
            ${
              orden.notas_observaciones
                ? `
            <div class="fila">
              <div class="campo">
                <div class="campo-label">NOTAS ADICIONALES</div>
                <div class="campo-valor">${orden.notas_observaciones}</div>
              </div>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">Responsables del Proceso</div>
          <div class="seccion-contenido">
            <div class="responsables">
              <div class="responsable">
                <div class="responsable-titulo">VENDEDOR</div>
                <div class="responsable-nombre">${detalle.vendedor || ""}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">PREPRENSA</div>
                <div class="responsable-nombre">${detalle.preprensa || ""}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">OFFSET</div>
                <div class="responsable-nombre">${detalle.prensa || ""}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">TERMINADOS</div>
                <div class="responsable-nombre">${detalle.terminados || ""}</div>
              </div>
              <div class="responsable">
                <div class="responsable-titulo">FACTURADO</div>
                <div class="responsable-nombre">${detalle.facturado || ""}</div>
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
  function generarHTMLOrdenDigital(
    orden: any,
    detalle: any,
    logoBase64: string,
    salidaImagenBase64: string,
  ): string {
    // Parsear productos digitales si existen
    let productos: any[] = [];
    try {
      if (detalle.productos_digital) {
        productos =
          typeof detalle.productos_digital === "string"
            ? JSON.parse(detalle.productos_digital)
            : detalle.productos_digital;
      }
    } catch (e) {
      console.error("Error al parsear productos digitales:", e);
      productos = [];
    }

    // Generar filas de productos (incluyendo gaps)
    const filasProductos = productos
      .map(
        (producto: any, index: number) => `
      <tr>
        <td class="tabla-celda">${index + 1}</td>
        <td class="tabla-celda">${producto.cantidad || ""}</td>
        <td class="tabla-celda">${producto.cod_mg || ""}</td>
        <td class="tabla-celda">${producto.cod_cliente || ""}</td>
        <td class="tabla-celda">${producto.producto || ""}</td>
        <td class="tabla-celda">${producto.gap_horizontal || ""}</td>
        <td class="tabla-celda">${producto.medida_ancho || ""}</td>
        <td class="tabla-celda">${producto.gap_vertical || ""}</td>
        <td class="tabla-celda">${producto.medida_alto || ""}</td>
        <td class="tabla-celda">${producto.cavidad || ""}</td>
        <td class="tabla-celda">${producto.metros_impresos || ""}</td>
        <td class="tabla-celda" style="font-weight:bold;">${producto.numero_salida || ""}</td>
      </tr>
    `,
      )
      .join("");

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
          .responsable-nombre { font-size: 10px; font-weight: bold; margin-bottom: 4px; }
          .responsable-cantidad { font-size: 9px; color: #333; font-weight: bold; border-top: 1px dashed #ddd; padding-top: 4px; margin-top: 4px; }
          /* Estilos compactos para la sección de referencia de número de salida */
          /* Variables para ajustar fácilmente la altura/espaciado de la sección de referencia
             - Cambia las variables abajo para hacer la sección más ancha (altura) o más angosta. */
          :root{
            --ref-padding: 4mm;           /* padding vertical de la sección (usar mm para impresión) */
            --ref-title-padding: 2mm;     /* padding del título */
            --ref-font-size: 18px;        /* tamaño de fuente del número de salida */
            --ref-inner-padding: 3mm;     /* padding interno del recuadro del número */
            --ref-min-height: 8mm;        /* altura mínima del recuadro */
            --ref-img-max-height: 15mm;   /* altura máxima de la imagen de referencia */
            --ref-fixed-height: 20mm;     /* altura fija del contenedor de referencia (reduce/ aumenta para hacerlo más angosto/ancho) */
          }
          /* Hacer el contenedor más "angosto" verticalmente: usamos una altura fija y ocultamos overflow.
             Ajusta --ref-fixed-height para reducir/aumentar la altura total del bloque. */
          .seccion-referencia .seccion-contenido { padding: var(--ref-padding) 6px; height: var(--ref-fixed-height); overflow: hidden; }
          .seccion-referencia .seccion-titulo { padding: var(--ref-title-padding) 6px; }
          .referencia-campo-valor {
            font-size: var(--ref-font-size);
            font-weight: bold;
            text-align: center;
            padding: var(--ref-inner-padding);
            min-height: var(--ref-min-height);
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .referencia-imagen { max-width: 100%; height: auto; max-height: var(--ref-img-max-height); border: 1px solid #ddd; border-radius: 4px; margin-top: 4px; }
          .grid-tecnico { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" />` : "<strong>MUNDOGRAFIC</strong>"}
          </div>
          <div class="orden-info">
            <div class="orden-numero">Orden de Trabajo DIGITAL</div>
            <div>Orden Nº: <strong>${orden.numero_orden || ""}</strong></div>
            <div>Orden de Compra: ${orden.orden_compra || ""}</div>
            <div>Cotización Nº: ${orden.numero_cotizacion || ""}</div>
          </div>
        </div>
        
        <div class="titulo">ORDEN DE TRABAJO - DIGITAL</div>
        
        <div class="seccion">
          <div class="seccion-titulo">📋 INFORMACIÓN DEL CLIENTE</div>
          <div class="seccion-contenido">
            <div class="fila">
              <div class="campo">
                <div class="campo-label">CLIENTE</div>
                <div class="campo-valor">${orden.nombre_cliente || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">CONTACTO</div>
                <div class="campo-valor">${orden.contacto || ""}</div>
              </div>
            </div>
            <div class="fila">
              <div class="campo">
                <div class="campo-label">TELÉFONO</div>
                <div class="campo-valor">${orden.telefono || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">EMAIL</div>
                <div class="campo-valor">${orden.email || ""}</div>
              </div>
            </div>
            <div class="fila">
              <div class="campo">
                <div class="campo-label">FECHA CREACIÓN</div>
                <div class="campo-valor">${orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString("es-EC", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">FECHA ENTREGA</div>
                <div class="campo-valor">${orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString("es-EC", { year: "numeric", month: "2-digit", day: "2-digit" }) : ""}</div>
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
                  <th class="tabla-celda">Gap H (mm)</th>
                  <th class="tabla-celda">Ancho (mm)</th>
                  <th class="tabla-celda">Gap V (mm)</th>
                  <th class="tabla-celda">Alto (mm)</th>
                  <th class="tabla-celda">Cavidad</th>
                  <th class="tabla-celda">Metros Imp.</th>
                  <th class="tabla-celda">N&deg; Salida</th>
                </tr>
              </thead>
              <tbody>
                ${filasProductos || '<tr><td colspan="12" class="tabla-celda">No hay productos registrados</td></tr>'}
              </tbody>
            </table>
            ${salidaImagenBase64 ? `
            <div style="display:flex; align-items:center; gap:12px; margin-top:8px; padding:6px 8px; background:#f9f9f9; border:1px solid #ddd; border-radius:4px;">
              <img src="${salidaImagenBase64}" alt="Referencia de Salidas" style="height:40px; width:auto; border:1px solid #ccc; border-radius:3px;" />
              <span style="font-size:9px; color:#555;">Ref. N&deg; de Salida (1&ndash;4) &mdash; ver columna N&deg; Salida por producto</span>
            </div>` : ''}
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">⚙️ INFORMACIÓN TÉCNICA</div>
          <div class="seccion-contenido">
            <div class="grid-tecnico">
              <div class="campo">
                <div class="campo-label">ADHERENCIA</div>
                <div class="campo-valor">${detalle.adherencia || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">MATERIAL</div>
                <div class="campo-valor">${detalle.material || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">PROVEEDOR MATERIAL</div>
                <div class="campo-valor">${detalle.proveedor_material || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">ESPESOR (Micras)</div>
                <div class="campo-valor">${detalle.espesor || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">LOTE MATERIAL/CODIGO MATERIAL</div>
                <div class="campo-valor">${detalle.lote_material || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">LOTE PRODUCCIÓN</div>
                <div class="campo-valor">${detalle.lote_produccion || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">IMPRESIÓN</div>
                <div class="campo-valor">${detalle.impresion || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TIPO IMPRESIÓN</div>
                <div class="campo-valor">${detalle.tipo_impresion || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TROQUEL</div>
                <div class="campo-valor">${detalle.troquel || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">CÓDIGO TROQUEL</div>
                <div class="campo-valor">${detalle.codigo_troquel || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TERMINADO ETIQUETA</div>
                <div class="campo-valor">${detalle.terminado_etiqueta || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TERMINADOS ESPECIALES</div>
                <div class="campo-valor">${detalle.terminados_especiales || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">CANTIDAD POR ROLLO</div>
                <div class="campo-valor">${detalle.cantidad_por_rollo || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TAMAÑO PAPEL (ANCHO)</div>
                <div class="campo-valor">${productos[0]?.tamano_papel_ancho || ""}</div>
              </div>
              <div class="campo">
                <div class="campo-label">TAMAÑO PAPEL (LARGO)</div>
                <div class="campo-valor">${productos[0]?.tamano_papel_largo || ""}</div>
              </div>
            </div>
            <div class="fila" style="margin-top: 10px;">
              <div class="campo">
                <div class="campo-label">OBSERVACIONES</div>
                <div class="campo-valor">${detalle.observaciones || orden.notas_observaciones || ""}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">👥 RESPONSABLES DEL PROCESO</div>
          <div class="seccion-contenido">
            <div class="responsables">
              <div class="responsable">
                <div class="responsable-titulo">VENDEDOR</div>
                <div class="responsable-nombre">${detalle.vendedor || ""}</div>
                ${detalle.vendedor_cantidad_final ? `<div class="responsable-cantidad">Cant. Final: ${detalle.vendedor_cantidad_final}</div>` : ""}
              </div>
              <div class="responsable">
                <div class="responsable-titulo">PRE-PRENSA</div>
                <div class="responsable-nombre">${detalle.preprensa || ""}</div>
                ${detalle.preprensa_cantidad_final ? `<div class="responsable-cantidad">Cant. Final: ${detalle.preprensa_cantidad_final}</div>` : ""}
              </div>
              <div class="responsable">
                <div class="responsable-titulo">IMPRESIÓN</div>
                <div class="responsable-nombre">${detalle.prensa || ""}</div>
                ${detalle.prensa_cantidad_final ? `<div class="responsable-cantidad">Cant. Final: ${detalle.prensa_cantidad_final}</div>` : ""}
              </div>
              <div class="responsable">
                <div class="responsable-titulo">LAMINADO/BARNIZADO</div>
                <div class="responsable-nombre">${detalle.laminado_barnizado || ""}</div>
                ${detalle.laminado_barnizado_cantidad_final ? `<div class="responsable-cantidad">Cant. Final: ${detalle.laminado_barnizado_cantidad_final}</div>` : ""}
              </div>
              <div class="responsable">
                <div class="responsable-titulo">TROQUELADO</div>
                <div class="responsable-nombre">${detalle.troquelado || ""}</div>
                ${detalle.troquelado_cantidad_final ? `<div class="responsable-cantidad">Cant. Final: ${detalle.troquelado_cantidad_final}</div>` : ""}
              </div>
              <div class="responsable">
                <div class="responsable-titulo">TERMINADOS</div>
                <div class="responsable-nombre">${detalle.terminados || ""}</div>
                ${detalle.terminados_cantidad_final ? `<div class="responsable-cantidad">Cant. Final: ${detalle.terminados_cantidad_final}</div>` : ""}
              </div>
              <div class="responsable">
                <div class="responsable-titulo">LIBERACIÓN PRODUCTO</div>
                <div class="responsable-nombre">${detalle.liberacion_producto || ""}</div>
                ${detalle.liberacion_producto_cantidad_final ? `<div class="responsable-cantidad">Cant. Final: ${detalle.liberacion_producto_cantidad_final}</div>` : ""}
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
        [id],
      );
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener detalle específico según tipo de orden (sin tabla común)
      const tipoOrden = orden.tipo_orden || "offset";
      let detalle: any = {};
      if (tipoOrden === "digital") {
        const detalleDigitalResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`,
          [id],
        );
        detalle = detalleDigitalResult.rows[0] || {};
        const productosResult = await client.query(
          `SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
          [id],
        );
        detalle.productos_digital = productosResult.rows;
      } else {
        const detalleOffsetResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`,
          [id],
        );
        detalle = detalleOffsetResult.rows[0] || {};
        const productosOffsetResult = await client.query(
          `SELECT * FROM productos_orden_offset WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
          [id],
        );
        detalle.productos_offset = productosOffsetResult.rows;
      }

      // 3. Leer y convertir el logo a base64
      const logoPath = path.join(
        __dirname,
        "../../public/images/logo-mundografic.png",
      );
      let logoBase64 = "";
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      } catch (e: any) {
        console.error("No se pudo leer el logo:", e);
        logoBase64 = "";
      }

      // 3b. Leer y convertir la imagen de salidas a base64 (desde carpeta raíz /public/img)
      const salidaImagenPath = path.join(
        __dirname,
        "../../public/img/salidas.png",
      );
      let salidaImagenBase64 = "";
      try {
        const salidaBuffer = await fs.readFile(salidaImagenPath);
        salidaImagenBase64 = `data:image/png;base64,${salidaBuffer.toString("base64")}`;
      } catch (e: any) {
        console.error("No se pudo leer la imagen de salidas:", e);
        salidaImagenBase64 = "";
      }

      // 4. Generar HTML según el tipo de orden (digital u offset)
      const html =
        tipoOrden === "digital"
          ? generarHTMLOrdenDigital(
              orden,
              detalle,
              logoBase64,
              salidaImagenBase64,
            )
          : generarHTMLOrdenOffset(
              orden,
              detalle,
              logoBase64,
              salidaImagenBase64,
            );

      // 5. Generar PDF usando Puppeteer
      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "8mm",
          right: "8mm",
          bottom: "8mm",
          left: "8mm",
        },
        scale: 0.95,
      });
      await browser.close();

      // 6. Enviar el PDF al cliente para descarga
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="orden_trabajo_${orden.numero_orden || id}.pdf"`,
      );
      res.setHeader("Cache-Control", "no-cache");
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error al generar PDF de orden de trabajo:", error);
      res
        .status(500)
        .json({ error: "Error al generar el PDF de la orden de trabajo" });
    }
  });

  // Enviar PDF de orden de trabajo por correo
  router.post("/:id/enviar-correo", async (req: any, res: any) => {
    const { id } = req.params;
    const { email, asunto, mensaje } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ error: "El correo electrónico es requerido" });
    }
    try {
      // 1. Obtener los datos de la orden de trabajo
      const result = await client.query(
        `SELECT * FROM orden_trabajo WHERE id = $1`,
        [id],
      );
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener el detalle técnico según tipo de orden
      const tipoOrdenCorreo = orden.tipo_orden || "offset";
      let detalleCorreo: any = {};
      if (tipoOrdenCorreo === "digital") {
        const r = await client.query(
          `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`,
          [id],
        );
        detalleCorreo = r.rows[0] || {};
      } else {
        const r = await client.query(
          `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`,
          [id],
        );
        detalleCorreo = r.rows[0] || {};
      }

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
          <p><strong>Tipo:</strong> ${orden.tipo_orden || "offset"}</p>
          <p><strong>Fecha de creación:</strong> ${orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString() : ""}</p>
          <h2>Detalle Técnico</h2>
          <table>
            <tr><th>Campo</th><th>Valor</th></tr>
            ${Object.entries(detalleCorreo)
              .map(([k, v]) => `<tr><td>${k}</td><td>${v ?? ""}</td></tr>`)
              .join("")}
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
        host: process.env.SMTP_HOST || "smtp.example.com",
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: false, // true para 465, false para otros puertos
        auth: {
          user: process.env.SMTP_USER || "usuario",
          pass: process.env.SMTP_PASS || "contraseña",
        },
      });

      // 6. Enviar el correo
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "no-reply@mundografic.com",
        to: email,
        subject: asunto || `Orden de Trabajo #${orden.numero_orden}`,
        text: mensaje || "Adjunto encontrará la orden de trabajo solicitada.",
        html: `<p>${mensaje || "Adjunto encontrará la orden de trabajo solicitada."}</p>`,
        attachments: [
          {
            filename: `orden_trabajo_${orden.numero_orden}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });

      res.json({ success: true, message: "Correo enviado correctamente" });
    } catch (error: any) {
      console.error("Error al enviar correo de orden de trabajo:", error);
      res
        .status(500)
        .json({ error: "Error al enviar el correo de la orden de trabajo" });
    }
  });

  // Cambiar estado a "en producción" (estado_orden_offset_id = pendiente para offset, o estado_orden_digital para digital)
  router.put(
    "/:id/enviar-produccion",
    authRequired(),
    checkPermission(client, "ordenes_trabajo", "editar"),
    async (req: any, res: any) => {
      const { id } = req.params;
      try {
        console.log(`📤 Enviando orden ${id} a producción...`);
        // Determinar tipo de orden
        const tipoRes = await client.query(
          `SELECT tipo_orden FROM orden_trabajo WHERE id = $1`,
          [id],
        );
        if (!tipoRes.rows.length)
          return res.status(404).json({ error: "Orden no encontrada" });
        const tipoOrden = (
          tipoRes.rows[0].tipo_orden || "offset"
        ).toLowerCase();

        let result: any;
        if (tipoOrden === "digital") {
          // Para digital, no cambiamos el estado aquí (se maneja desde produccion/:id/estado)
          result = await client.query(
            `UPDATE orden_trabajo SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id],
          );
        } else {
          // Para offset, poner estado = pendiente
          const estadoRes = await client.query(
            `SELECT id FROM estado_orden_offset WHERE key = 'pendiente' LIMIT 1`,
          );
          const estadoId = estadoRes.rows[0]?.id;
          result = await client.query(
            `UPDATE orden_trabajo SET estado_orden_offset_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [estadoId, id],
          );
          // Registrar en historial
          if (estadoId) {
            await client
              .query(
                `INSERT INTO estado_orden_offset_historial (orden_trabajo_id, estado_id, usuario_id, nota) VALUES ($1, $2, $3, $4)`,
                [id, estadoId, req.user?.id || null, "Enviada a producción"],
              )
              .catch(() => {});
          }
        }
        if (!result.rows.length)
          return res.status(404).json({ error: "Orden no encontrada" });
        console.log(`✅ Orden ${id} enviada a producción exitosamente`);
        res.json({
          success: true,
          orden: result.rows[0],
          message: `Orden #${result.rows[0].numero_orden} enviada a producción correctamente`,
        });
      } catch (error: any) {
        console.error("Error al enviar a producción:", error);
        res.status(500).json({ error: "Error al enviar a producción" });
      }
    },
  );

  // ==================== ENDPOINTS DE PRODUCCIÓN ====================

  // Obtener todas las órdenes en producción con detalles
  router.get(
    "/produccion/ordenes",
    authRequired(),
    async (req: any, res: any) => {
      try {
        console.log("📊 Obteniendo órdenes en producción...");

        // Para soportar workflows digitales con la nueva tabla `estado_orden_digital`
        // añadimos campos adicionaless: estado_orden_digital_id, estado_digital_key, estado_digital_titulo
        const result = await client.query(`
        -- Órdenes OFFSET: usar estado_orden_offset + detalle_orden_trabajo_offset
        SELECT
          ot.id,
          ot.numero_orden,
          ot.nombre_cliente,
          ot.contacto,
          ot.email,
          ot.telefono,
          ot.fecha_creacion,
          ot.fecha_entrega,
          eoo.key  AS estado,
          eoo.key  AS estado_offset_key,
          eoo.titulo AS estado_offset_titulo,
          NULL::int    AS estado_orden_digital_id,
          NULL::text   AS estado_digital_key,
          NULL::text   AS estado_digital_titulo,
          ot.estado_orden_offset_id,
          ot.notas_observaciones,
          dot.vendedor,
          dot.preprensa,
          dot.prensa,
          dot.terminados,
          dot.facturado,
          ot.id_cotizacion,
          ot.tipo_orden,
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
          (SELECT concepto FROM productos_orden_offset WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS concepto,
          (SELECT cantidad FROM productos_orden_offset WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS cantidad,
          ot.created_at,
          ot.updated_at
        FROM orden_trabajo ot
        LEFT JOIN detalle_orden_trabajo_offset dot ON ot.id = dot.orden_trabajo_id
        LEFT JOIN estado_orden_offset eoo ON ot.estado_orden_offset_id = eoo.id
        WHERE (ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital')

        UNION ALL

        -- Órdenes DIGITALES: usar estado_orden_digital + detalle_orden_trabajo_digital
        SELECT
          ot.id,
          ot.numero_orden,
          ot.nombre_cliente,
          ot.contacto,
          ot.email,
          ot.telefono,
          ot.fecha_creacion,
          ot.fecha_entrega,
          eod.key  AS estado,
          NULL::text   AS estado_offset_key,
          NULL::text   AS estado_offset_titulo,
          ot.estado_orden_digital_id,
          eod.key  AS estado_digital_key,
          eod.titulo AS estado_digital_titulo,
          NULL::int    AS estado_orden_offset_id,
          ot.notas_observaciones,
          dtd.vendedor,
          dtd.preprensa,
          dtd.prensa,
          dtd.terminados,
          dtd.facturado,
          ot.id_cotizacion,
          ot.tipo_orden,
          dtd.material,
          NULL::text AS corte_material,
          NULL::int  AS cantidad_pliegos_compra,
          NULL::int  AS exceso,
          NULL::int  AS total_pliegos,
          NULL::text AS tamano,
          NULL::text AS tamano_abierto_1,
          NULL::text AS tamano_cerrado_1,
          dtd.impresion,
          NULL::text AS instrucciones_impresion,
          NULL::text AS instrucciones_acabados,
          NULL::text AS instrucciones_empacado,
          dtd.observaciones,
          dtd.prensa_seleccionada,
          (SELECT producto FROM productos_orden_digital WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS concepto,
          (SELECT cantidad  FROM productos_orden_digital WHERE orden_trabajo_id = ot.id ORDER BY orden LIMIT 1) AS cantidad,
          ot.created_at,
          ot.updated_at
        FROM orden_trabajo ot
        LEFT JOIN detalle_orden_trabajo_digital dtd ON ot.id = dtd.orden_trabajo_id
        LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
        WHERE ot.tipo_orden = 'digital'
        ORDER BY fecha_entrega ASC, created_at DESC
      `);

        console.log(
          `✅ Se encontraron ${result.rows.length} órdenes en producción`,
        );
        res.json({
          success: true,
          ordenes: result.rows,
          total: result.rows.length,
        });
      } catch (error: any) {
        console.error("❌ Error al obtener órdenes en producción:", error);
        res.status(500).json({
          success: false,
          error: "Error al obtener órdenes en producción",
          details: error.message,
        });
      }
    },
  );

  // Obtener workflow/stages para la vista Kanban según tipo (offset|digital)
  router.get(
    "/produccion/workflow",
    authRequired(),
    async (req: any, res: any) => {
      try {
        const tipo = (req.query.tipo || "offset").toString().toLowerCase();

        if (tipo === "digital") {
          // Traer desde la tabla `estado_orden_digital` los estados ordenados
          const q = await client.query(
            `SELECT id, key, titulo, orden, color, activo FROM estado_orden_digital WHERE activo = TRUE ORDER BY orden ASC`,
          );
          const workflow = q.rows.map((r: any) => ({
            id: r.key,
            titulo: r.titulo,
            color: r.color || "gray",
            aliases: [r.key, r.titulo],
          }));
          return res.json({ success: true, workflow });
        }

        const workflows: any = {
          offset: [
            {
              id: "pendiente",
              titulo: "En Proceso",
              color: "yellow",
              aliases: [
                "en producción",
                "en proceso",
                "pendiente",
                "pendiente",
              ],
            },
            {
              id: "en_preprensa",
              titulo: "Preprensa",
              color: "blue",
              aliases: ["en preprensa", "en pre-prensa", "preprensa"],
            },
            {
              id: "en_prensa",
              titulo: "Prensa / Impresión",
              color: "purple",
              aliases: [
                "en prensa",
                "en impresión",
                "en impresion",
                "en prensa",
              ],
            },
            {
              id: "en_acabados",
              titulo: "Acabados / Empacado",
              color: "orange",
              aliases: ["en acabados", "en empacado", "acabados", "empacado"],
            },
            {
              id: "en_control_calidad",
              titulo: "Listo p/Entrega",
              color: "indigo",
              aliases: [
                "en control de calidad",
                "listo para entrega",
                "listo para entrega",
              ],
            },
            {
              id: "entregado",
              titulo: "Entregado",
              color: "green",
              aliases: ["entregado", "completado", "facturado"],
            },
          ],
          digital: [
            {
              id: "en_preprensa",
              titulo: "Preprensa",
              color: "blue",
              aliases: ["en preprensa", "en pre-prensa", "preprensa"],
            },
            {
              id: "en_prensa",
              titulo: "Impresión",
              color: "purple",
              aliases: ["en prensa", "en impresión", "impresión", "impresion"],
            },
            {
              id: "laminado",
              titulo: "Laminado/Barnizado",
              color: "orange",
              aliases: ["laminado", "barnizado", "laminado/barnizado"],
            },
            {
              id: "troquelado",
              titulo: "Troquelado",
              color: "teal",
              aliases: ["troquelado", "troquel"],
            },
            {
              id: "terminado",
              titulo: "Terminados",
              color: "yellow",
              aliases: ["terminado", "terminados"],
            },
            {
              id: "liberado",
              titulo: "Producto Liberado",
              color: "gray",
              aliases: ["liberado", "liberación producto", "producto liberado"],
            },
            {
              id: "entregado",
              titulo: "Producto Entregado",
              color: "green",
              aliases: [
                "entregado",
                "producto entregado",
                "completado",
                "facturado",
              ],
            },
          ],
        };

        const workflow = workflows[tipo] || workflows.offset;
        res.json({ success: true, workflow });
      } catch (error: any) {
        console.error("Error al obtener workflow:", error);
        res
          .status(500)
          .json({ success: false, error: "Error al obtener workflow" });
      }
    },
  );

  // Obtener métricas del dashboard de producción
  router.get(
    "/produccion/metricas",
    authRequired(),
    async (req: any, res: any) => {
      try {
        console.log("📈 Calculando métricas de producción...");

        // IDs de estados "terminales" (entregado/facturado) en cada catálogo
        const terminalOffsetRes = await client.query(
          `SELECT id FROM estado_orden_offset WHERE key IN ('entregado', 'facturado')`,
        );
        const terminalDigitalRes = await client.query(
          `SELECT id FROM estado_orden_digital WHERE key IN ('entregado', 'facturado', 'liberado')`,
        );
        const idsTerminalOffset = terminalOffsetRes.rows.map((r: any) => r.id);
        const idsTerminalDigital = terminalDigitalRes.rows.map(
          (r: any) => r.id,
        );

        // Estado "pendiente" para offset
        const pendienteRes = await client.query(
          `SELECT id FROM estado_orden_offset WHERE key = 'pendiente' LIMIT 1`,
        );
        const pendienteOffsetId = pendienteRes.rows[0]?.id;

        // Params para queries
        const notTerminalOffset = idsTerminalOffset.length
          ? `(estado_orden_offset_id IS NULL OR estado_orden_offset_id NOT IN (${idsTerminalOffset.join(",")}))`
          : "TRUE";
        const notTerminalDigital = idsTerminalDigital.length
          ? `estado_orden_digital_id NOT IN (${idsTerminalDigital.join(",")})`
          : "TRUE";

        const activeOffset = `(ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND ${notTerminalOffset}`;
        const activeDigital = `ot.tipo_orden = 'digital' AND ${notTerminalDigital}`;

        // Total de órdenes en producción (activas)
        const totalEnProduccion = await client.query(
          `SELECT COUNT(*) as total FROM orden_trabajo ot WHERE (${activeOffset}) OR (${activeDigital})`,
        );

        // Órdenes pendientes (primer estado / sin avanzar)
        const pendientes = await client.query(
          `
        SELECT COUNT(*) as total FROM orden_trabajo ot
        WHERE (
          (ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND
          (ot.estado_orden_offset_id IS NULL OR ot.estado_orden_offset_id = $1)
        )
      `,
          [pendienteOffsetId],
        );

        // Órdenes en proceso activo (con un estado asignado, no terminal)
        const enProceso = await client.query(`
        SELECT COUNT(*) as total FROM orden_trabajo ot
        WHERE (
          ((ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND ot.estado_orden_offset_id IS NOT NULL AND ${notTerminalOffset})
          OR (ot.tipo_orden = 'digital' AND ot.estado_orden_digital_id IS NOT NULL AND ${notTerminalDigital})
        )
      `);

        // Órdenes retrasadas (fecha de entrega pasada y no terminales)
        const retrasadas = await client.query(`
        SELECT COUNT(*) as total FROM orden_trabajo ot
        WHERE fecha_entrega < CURRENT_DATE
        AND ((${activeOffset}) OR (${activeDigital}))
      `);

        // Órdenes completadas hoy
        const completadasHoy = await client.query(`
        SELECT COUNT(*) as total FROM orden_trabajo ot
        WHERE DATE(ot.updated_at) = CURRENT_DATE
        AND (
          ((ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital') AND ot.estado_orden_offset_id IN (${idsTerminalOffset.length ? idsTerminalOffset.join(",") : "NULL"}))
          OR (ot.tipo_orden = 'digital' AND ot.estado_orden_digital_id IN (${idsTerminalDigital.length ? idsTerminalDigital.join(",") : "NULL"}))
        )
      `);

        // Órdenes por entregar hoy
        const hoy = await client.query(`
        SELECT COUNT(*) as total FROM orden_trabajo ot
        WHERE fecha_entrega = CURRENT_DATE
        AND ((${activeOffset}) OR (${activeDigital}))
      `);

        // Órdenes por entregar esta semana
        const estaSemana = await client.query(`
        SELECT COUNT(*) as total FROM orden_trabajo ot
        WHERE fecha_entrega BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND ((${activeOffset}) OR (${activeDigital}))
      `);

        // Distribución por estado
        const distribucion = await client.query(`
        SELECT
          COALESCE(eoo.titulo, eod.titulo, 'Sin estado') AS estado,
          COUNT(*) AS cantidad
        FROM orden_trabajo ot
        LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
        LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
        GROUP BY COALESCE(eoo.titulo, eod.titulo, 'Sin estado')
        ORDER BY cantidad DESC
      `);

        // Promedio de días en producción
        const promedioTiempo = await client.query(`
        SELECT AVG(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))) as promedio_dias
        FROM orden_trabajo ot
        WHERE (${activeOffset}) OR (${activeDigital})
      `);

        const metricas = {
          totalOrdenes: parseInt(totalEnProduccion.rows[0].total),
          pendientes: parseInt(pendientes.rows[0].total),
          enProceso: parseInt(enProceso.rows[0].total),
          retrasadas: parseInt(retrasadas.rows[0].total),
          completadasHoy: parseInt(completadasHoy.rows[0].total),
          porEntregarHoy: parseInt(hoy.rows[0].total),
          porEntregarSemana: parseInt(estaSemana.rows[0].total),
          distribucionEstados: distribucion.rows,
          promedioDiasProduccion: parseFloat(
            promedioTiempo.rows[0].promedio_dias || 0,
          ).toFixed(1),
        };

        console.log("✅ Métricas calculadas:", metricas);
        res.json({ success: true, metricas });
      } catch (error: any) {
        console.error("❌ Error al calcular métricas:", error);
        res.status(500).json({
          success: false,
          error: "Error al calcular métricas de producción",
          details: error.message,
        });
      }
    },
  );

  // Cambiar estado/etapa de producción de una orden
  router.put(
    "/produccion/:id/estado",
    authRequired(),
    async (req: any, res: any) => {
      const { id } = req.params;
      const { estado, preprensa, prensa, terminados } = req.body;

      try {
        console.log(`🔄 Actualizando estado de orden ${id}:`, {
          estado,
          preprensa,
          prensa,
          terminados,
        });

        // Si la orden es digital queremos actualizar la columna `estado_orden_digital_id`
        let isDigitalOrder = false;
        try {
          const tipoRes = await client.query(
            "SELECT tipo_orden FROM orden_trabajo WHERE id = $1",
            [id],
          );
          if (
            tipoRes.rows.length > 0 &&
            (tipoRes.rows[0].tipo_orden || "").toString().toLowerCase() ===
              "digital"
          ) {
            isDigitalOrder = true;
          }
        } catch (e) {
          console.warn("No se pudo determinar tipo_orden:", e);
        }

        let query = "UPDATE orden_trabajo SET updated_at = CURRENT_TIMESTAMP";
        const params: any[] = [];
        let paramCounter = 1;

        if (isDigitalOrder && estado !== undefined) {
          // estado puede venir como key (string) o id (number) o titulo (ej. 'Preprensa').
          let estadoId: number | null = null;
          // Si viene id numérico, validar directamente
          if (typeof estado === "number" || /^[0-9]+$/.test(String(estado))) {
            const r = await client.query(
              "SELECT id FROM estado_orden_digital WHERE id = $1",
              [estado],
            );
            if (r.rows.length) estadoId = r.rows[0].id;
          } else if (typeof estado === "string") {
            // Traer todos los estados activos y hacer una búsqueda tolerante (normalizando)
            const rows = (
              await client.query(
                "SELECT id, key, titulo FROM estado_orden_digital WHERE activo = TRUE",
              )
            ).rows;
            const normalize = (s: string) =>
              s
                .toString()
                .normalize("NFD")
                .replace(/\p{Diacritic}/gu, "")
                .toLowerCase()
                .trim()
                .replace(/[_\s]+/g, "");
            const target = normalize(estado);
            for (const r of rows) {
              const keyNorm = normalize(r.key || "");
              const tituloNorm = normalize(r.titulo || "");
              if (
                keyNorm === target ||
                tituloNorm === target ||
                keyNorm.includes(target) ||
                tituloNorm.includes(target) ||
                target.includes(keyNorm) ||
                target.includes(tituloNorm)
              ) {
                estadoId = r.id;
                break;
              }
            }
          }
          if (estadoId === null) {
            // Devolver lista permitida para ayudar al frontend
            const allowedRows = (
              await client.query(
                "SELECT id, key, titulo FROM estado_orden_digital WHERE activo = TRUE ORDER BY orden",
              )
            ).rows;
            return res
              .status(400)
              .json({
                success: false,
                error: "Estado digital no reconocido",
                allowed: allowedRows,
              });
          }
          query += `, estado_orden_digital_id = $${paramCounter}`;
          params.push(estadoId);
          paramCounter++;
        } else if (estado !== undefined) {
          // Offset: actualizar estado_orden_offset_id buscando por key o título
          let estadoOffsetId: number | null = null;
          const rowsOffset = (
            await client.query(
              `SELECT id, key, titulo FROM estado_orden_offset WHERE activo = TRUE`,
            )
          ).rows;
          const normalizeStr = (s: string) =>
            s
              .toString()
              .normalize("NFD")
              .replace(/\p{Diacritic}/gu, "")
              .toLowerCase()
              .trim()
              .replace(/[_\s]+/g, "");
          const target = normalizeStr(String(estado));
          for (const r of rowsOffset) {
            if (
              normalizeStr(r.key) === target ||
              normalizeStr(r.titulo) === target
            ) {
              estadoOffsetId = r.id;
              break;
            }
          }
          if (estadoOffsetId === null) {
            // Fallback numérico
            if (/^\d+$/.test(String(estado))) {
              const r = await client.query(
                `SELECT id FROM estado_orden_offset WHERE id = $1`,
                [estado],
              );
              if (r.rows.length) estadoOffsetId = r.rows[0].id;
            }
          }
          if (estadoOffsetId === null) {
            const allowed = rowsOffset.map((r: any) => ({
              id: r.id,
              key: r.key,
              titulo: r.titulo,
            }));
            return res
              .status(400)
              .json({
                success: false,
                error: "Estado offset no reconocido",
                allowed,
              });
          }
          query += `, estado_orden_offset_id = $${paramCounter}`;
          params.push(estadoOffsetId);
          paramCounter++;
        }
        if (
          preprensa !== undefined ||
          prensa !== undefined ||
          terminados !== undefined
        ) {
          // Los responsables van en detalle_orden_trabajo_offset, no en orden_trabajo
          const detalleUpdates: string[] = [];
          const detalleParams: any[] = [];
          let dpCount = 1;
          if (preprensa !== undefined) {
            detalleUpdates.push(`preprensa = $${dpCount++}`);
            detalleParams.push(preprensa);
          }
          if (prensa !== undefined) {
            detalleUpdates.push(`prensa = $${dpCount++}`);
            detalleParams.push(prensa);
          }
          if (terminados !== undefined) {
            detalleUpdates.push(`terminados = $${dpCount++}`);
            detalleParams.push(terminados);
          }
          detalleParams.push(id);
          await client.query(
            `UPDATE detalle_orden_trabajo_offset SET ${detalleUpdates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE orden_trabajo_id = $${dpCount}`,
            detalleParams,
          );
        }

        query += ` WHERE id = $${paramCounter} RETURNING *`;
        params.push(id);

        const result = await client.query(query, params);

        if (result.rows.length === 0) {
          return res
            .status(404)
            .json({ success: false, error: "Orden no encontrada" });
        }

        // Guardar historial de cambios de estado
        try {
          const updated = result.rows[0];
          if (isDigitalOrder && updated.estado_orden_digital_id) {
            await client.query(
              `INSERT INTO estado_orden_digital_historial (orden_trabajo_id, estado_id, usuario_id, nota) VALUES ($1, $2, $3, $4)`,
              [
                id,
                updated.estado_orden_digital_id,
                req.user?.id || null,
                req.body.nota || null,
              ],
            );
          } else if (!isDigitalOrder && updated.estado_orden_offset_id) {
            await client.query(
              `INSERT INTO estado_orden_offset_historial (orden_trabajo_id, estado_id, usuario_id, nota) VALUES ($1, $2, $3, $4)`,
              [
                id,
                updated.estado_orden_offset_id,
                req.user?.id || null,
                req.body.nota || null,
              ],
            );
          }
        } catch (e: any) {
          console.warn(
            "No se pudo insertar historial de estado:",
            e?.message || e,
          );
        }

        console.log("✅ Estado actualizado correctamente");
        res.json({ success: true, orden: result.rows[0] });
      } catch (error: any) {
        console.error("❌ Error al actualizar estado:", error);
        res.status(500).json({
          success: false,
          error: "Error al actualizar estado de producción",
          details: error.message,
        });
      }
    },
  );

  // Obtener historial/actividades recientes de producción
  router.get(
    "/produccion/actividades",
    authRequired(),
    async (req: any, res: any) => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;

        console.log(`📜 Obteniendo últimas ${limit} actividades...`);

        const result = await client.query(
          `
        SELECT 
          ot.id,
          ot.numero_orden,
          ot.nombre_cliente,
          ot.updated_at,
          ot.tipo_orden,
          eoo.key   AS estado_offset_key,
          eoo.titulo AS estado_offset_titulo,
          eod.key   AS estado_digital_key,
          eod.titulo AS estado_digital_titulo,
          dot.preprensa,
          dot.prensa,
          dot.terminados
        FROM orden_trabajo ot
        LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
        LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
        LEFT JOIN detalle_orden_trabajo_offset  dot ON ot.id = dot.orden_trabajo_id AND (ot.tipo_orden IS NULL OR ot.tipo_orden <> 'digital')
        ORDER BY ot.updated_at DESC
        LIMIT $1
      `,
          [limit],
        );

        console.log(`✅ ${result.rows.length} actividades encontradas`);
        res.json({ success: true, actividades: result.rows });
      } catch (error: any) {
        console.error("❌ Error al obtener actividades:", error);
        res.status(500).json({
          success: false,
          error: "Error al obtener actividades recientes",
          details: error.message,
        });
      }
    },
  );

  // ==================== FIN ENDPOINTS DE PRODUCCIÓN ====================

  // Endpoint de preview para generar PDF en base64 (igual que cotizaciones)
  router.get("/:id/preview", authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      console.log("📋 Generando preview de orden de trabajo:", id);

      // 1. Obtener los datos de la orden de trabajo con número de cotización
      const result = await client.query(
        `SELECT ot.*, c.codigo_cotizacion as numero_cotizacion
         FROM orden_trabajo ot
         LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id
         WHERE ot.id = $1`,
        [id],
      );
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Orden de trabajo no encontrada" });
      }
      const orden = result.rows[0];

      // 2. Obtener detalle específico según tipo de orden (sin tabla común)
      const tipoOrden = orden.tipo_orden || "offset";
      let detalle: any = {};
      if (tipoOrden === "digital") {
        const detalleDigitalResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`,
          [id],
        );
        detalle = detalleDigitalResult.rows[0] || {};
        const productosResult = await client.query(
          `SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
          [id],
        );
        detalle.productos_digital = productosResult.rows;
      } else {
        const detalleOffsetResult = await client.query(
          `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`,
          [id],
        );
        detalle = detalleOffsetResult.rows[0] || {};
        const productosOffsetResult = await client.query(
          `SELECT * FROM productos_orden_offset WHERE orden_trabajo_id = $1 ORDER BY orden ASC`,
          [id],
        );
        detalle.productos_offset = productosOffsetResult.rows;
      }

      // 3. Leer y convertir el logo a base64
      const logoPath = path.join(
        __dirname,
        "../../public/images/logo-mundografic.png",
      );
      let logoBase64 = "";
      try {
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      } catch (e: any) {
        console.error("No se pudo leer el logo:", e);
      }

      // 3b. Leer y convertir la imagen de salidas a base64 (desde carpeta raíz /public/img)
      const salidaImagenPath = path.join(
        __dirname,
        "../../public/img/salidas.png",
      );
      let salidaImagenBase64 = "";
      try {
        const salidaBuffer = await fs.readFile(salidaImagenPath);
        salidaImagenBase64 = `data:image/png;base64,${salidaBuffer.toString("base64")}`;
      } catch (e: any) {
        console.error("No se pudo leer la imagen de salidas:", e);
        salidaImagenBase64 = "";
      }

      // 4. Generar HTML según el tipo de orden (digital u offset)
      const html =
        tipoOrden === "digital"
          ? generarHTMLOrdenDigital(
              orden,
              detalle,
              logoBase64,
              salidaImagenBase64,
            )
          : generarHTMLOrdenOffset(
              orden,
              detalle,
              logoBase64,
              salidaImagenBase64,
            );

      // 5. Generar PDF usando Puppeteer (compacto para una página)
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "8mm", right: "8mm", bottom: "8mm", left: "8mm" },
        scale: 0.95,
      });
      await browser.close();

      // 6. Convertir a base64
      const base64PDF = pdfBuffer.toString("base64");
      console.log(
        "✅ PDF generado exitosamente, tamaño:",
        pdfBuffer.length,
        "bytes",
      );

      // 7. Enviar respuesta en formato JSON (igual que cotizaciones)
      res.json({
        success: true,
        pdf: `data:application/pdf;base64,${base64PDF}`,
      });
    } catch (error: any) {
      console.error("❌ Error al generar preview de orden:", error);
      res.status(500).json({
        success: false,
        error: "Error al generar la vista previa del PDF",
      });
    }
  });

  return router;
};
