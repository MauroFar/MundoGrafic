import express, { Request, Response } from "express";
import db from "../db/knex";

const router = express.Router();

// Middleware de autenticación (asumiendo que tienes uno)
// const authRequired = require("../middleware/auth");

// Dashboard de Producción - Métricas generales
router.get("/metricas", async (req: Request, res: Response) => {
  try {
    const { fecha = 'hoy' } = req.query;
    
    let fechaFiltro = '';
    switch (fecha) {
      case 'hoy':
        fechaFiltro = "DATE(ot.fecha_creacion) = CURRENT_DATE";
        break;
      case 'semana':
        fechaFiltro = "ot.fecha_creacion >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'mes':
        fechaFiltro = "ot.fecha_creacion >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        fechaFiltro = "1=1";
    }

    const metricas = await db.raw(`
      SELECT 
        COUNT(*) as total_ordenes,
        COUNT(CASE WHEN ot.estado = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN ot.estado IN ('en_preprensa', 'en_prensa', 'en_acabados', 'en_control_calidad') THEN 1 END) as en_proceso,
        COUNT(CASE WHEN ot.fecha_entrega < CURRENT_DATE AND ot.estado != 'entregado' THEN 1 END) as retrasadas,
        COUNT(CASE WHEN ot.estado = 'entregado' AND DATE(ot.updated_at) = CURRENT_DATE THEN 1 END) as completadas_hoy
      FROM orden_trabajo ot
      WHERE ${fechaFiltro}
    `);

    res.json(metricas.rows[0]);
  } catch (error) {
    console.error("Error al obtener métricas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Órdenes recientes para dashboard
router.get("/ordenes-recientes", async (req: Request, res: Response) => {
  try {
    const { estado = 'todos', fecha = 'hoy', limite = 10 } = req.query;
    
    let whereClause = "1=1";
    const params: any[] = [];
    let paramCount = 0;

    if (estado !== 'todos') {
      paramCount++;
      whereClause += ` AND ot.estado = $${paramCount}`;
      params.push(estado);
    }

    if (fecha === 'hoy') {
      whereClause += ` AND DATE(ot.fecha_creacion) = CURRENT_DATE`;
    } else if (fecha === 'semana') {
      whereClause += ` AND ot.fecha_creacion >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (fecha === 'mes') {
      whereClause += ` AND ot.fecha_creacion >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    const ordenes = await db.raw(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto,
        ot.estado,
        ot.fecha_entrega,
        ot.responsable_actual,
        ot.created_at
      FROM orden_trabajo ot
      WHERE ${whereClause}
      ORDER BY ot.created_at DESC
      LIMIT $${paramCount + 1}
    `, [...params, parseInt(limite as string)]);

    res.json(ordenes.rows);
  } catch (error) {
    console.error("Error al obtener órdenes recientes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Vista Kanban - Órdenes agrupadas por estado
router.get("/kanban", async (req: Request, res: Response) => {
  try {
    const { responsable = 'todos' } = req.query;
    
    let whereClause = "1=1";
    const params: any[] = [];
    let paramCount = 0;

    if (responsable !== 'todos') {
      paramCount++;
      whereClause += ` AND ot.responsable_${responsable} IS NOT NULL`;
    }

    const ordenes = await db.raw(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto,
        ot.estado,
        ot.fecha_entrega,
        ot.responsable_actual,
        ot.created_at
      FROM orden_trabajo ot
      WHERE ${whereClause}
      ORDER BY ot.created_at DESC
    `, params);

    // Agrupar por estado
    const ordenesAgrupadas = {
      pendiente: [],
      en_preprensa: [],
      en_prensa: [],
      en_acabados: [],
      en_control_calidad: [],
      entregado: []
    };

    ordenes.rows.forEach(orden => {
      const estado = orden.estado || 'pendiente';
      if (ordenesAgrupadas[estado]) {
        ordenesAgrupadas[estado].push(orden);
      }
    });

    res.json(ordenesAgrupadas);
  } catch (error) {
    console.error("Error al obtener datos kanban:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Cambiar estado de orden (genérico)
router.put("/cambiar-estado", async (req: Request, res: Response) => {
  try {
    const { ordenId, estadoAnterior, nuevoEstado, fechaCambio } = req.body;

    await db.transaction(async (trx) => {
      // Actualizar estado de la orden
      await trx('orden_trabajo')
        .where('id', ordenId)
        .update({
          estado: nuevoEstado,
          updated_at: new Date()
        });

      // Registrar cambio en historial
      await trx('seguimiento_orden').insert({
        orden_trabajo_id: ordenId,
        estado_anterior: estadoAnterior,
        estado_actual: nuevoEstado,
        fecha_cambio: fechaCambio || new Date(),
        observaciones: `Cambio de estado: ${estadoAnterior} → ${nuevoEstado}`
      });
    });

    res.json({ success: true, message: "Estado actualizado correctamente" });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Módulo Preprensa
router.get("/preprensa", async (req: Request, res: Response) => {
  try {
    const { estado = 'todos' } = req.query;
    
    let whereClause = "ot.estado IN ('pendiente', 'en_preprensa', 'preprensa_completada')";
    const params: any[] = [];
    let paramCount = 0;

    if (estado !== 'todos') {
      paramCount++;
      whereClause += ` AND ot.estado_preprensa = $${paramCount}`;
      params.push(estado);
    }

    const ordenes = await db.raw(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto,
        ot.estado_preprensa,
        ot.responsable_preprensa,
        ot.fecha_entrega,
        ot.created_at,
        COUNT(af.id) as archivos_count
      FROM orden_trabajo ot
      LEFT JOIN archivos_preprensa af ON ot.id = af.orden_trabajo_id
      WHERE ${whereClause}
      GROUP BY ot.id, ot.numero_orden, ot.nombre_cliente, ot.concepto, 
               ot.estado_preprensa, ot.responsable_preprensa, ot.fecha_entrega, ot.created_at
      ORDER BY ot.created_at DESC
    `, params);

    res.json(ordenes.rows);
  } catch (error) {
    console.error("Error al obtener órdenes de preprensa:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/preprensa/cambiar-estado", async (req: Request, res: Response) => {
  try {
    const { ordenId, nuevoEstado, fechaCambio } = req.body;

    await db.transaction(async (trx) => {
      // Actualizar estado de preprensa
      await trx('orden_trabajo')
        .where('id', ordenId)
        .update({
          estado_preprensa: nuevoEstado,
          updated_at: new Date()
        });

      // Si se completa preprensa, mover a siguiente estado
      if (nuevoEstado === 'completada') {
        await trx('orden_trabajo')
          .where('id', ordenId)
          .update({
            estado: 'en_prensa',
            estado_preprensa: 'completada'
          });
      }

      // Registrar en historial
      await trx('seguimiento_orden').insert({
        orden_trabajo_id: ordenId,
        estado_anterior: 'en_preprensa',
        estado_actual: nuevoEstado,
        fecha_cambio: fechaCambio || new Date(),
        observaciones: `Preprensa: ${nuevoEstado}`
      });
    });

    res.json({ success: true, message: "Estado de preprensa actualizado" });
  } catch (error) {
    console.error("Error al cambiar estado de preprensa:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Módulo Prensa
router.get("/prensa", async (req: Request, res: Response) => {
  try {
    const { prensa = 'todos' } = req.query;
    
    let whereClause = "ot.estado IN ('en_prensa', 'prensa_completada')";
    const params: any[] = [];
    let paramCount = 0;

    if (prensa !== 'todos') {
      paramCount++;
      whereClause += ` AND ot.prensa_asignada = $${paramCount}`;
      params.push(prensa);
    }

    const ordenes = await db.raw(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto,
        ot.estado_prensa,
        ot.prensa_asignada,
        ot.responsable_prensa,
        ot.fecha_entrega,
        ot.created_at
      FROM orden_trabajo ot
      WHERE ${whereClause}
      ORDER BY ot.created_at DESC
    `, params);

    res.json(ordenes.rows);
  } catch (error) {
    console.error("Error al obtener órdenes de prensa:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/prensas/estado", async (req: Request, res: Response) => {
  try {
    const prensas = await db.raw(`
      SELECT 
        prensa_asignada as id,
        prensa_asignada as nombre,
        CASE 
          WHEN COUNT(CASE WHEN estado_prensa = 'en_impresion' THEN 1 END) > 0 THEN 'ocupada'
          ELSE 'disponible'
        END as estado,
        COUNT(CASE WHEN estado_prensa = 'en_impresion' THEN 1 END) as ordenes_activas,
        MAX(CASE WHEN estado_prensa = 'en_impresion' THEN numero_orden END) as orden_actual
      FROM orden_trabajo 
      WHERE prensa_asignada IS NOT NULL
      GROUP BY prensa_asignada
      UNION ALL
      SELECT 'GTO52' as id, 'GTO 52' as nombre, 'disponible' as estado, 0 as ordenes_activas, NULL as orden_actual
      UNION ALL
      SELECT 'PM52' as id, 'PM52' as nombre, 'disponible' as estado, 0 as ordenes_activas, NULL as orden_actual
      UNION ALL
      SELECT 'CD102' as id, 'CD102' as nombre, 'disponible' as estado, 0 as ordenes_activas, NULL as orden_actual
    `);

    res.json(prensas.rows);
  } catch (error) {
    console.error("Error al obtener estado de prensas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/prensa/asignar", async (req: Request, res: Response) => {
  try {
    const { ordenId, prensaId, fechaAsignacion } = req.body;

    await db.transaction(async (trx) => {
      // Asignar prensa
      await trx('orden_trabajo')
        .where('id', ordenId)
        .update({
          prensa_asignada: prensaId,
          estado_prensa: 'asignada',
          updated_at: new Date()
        });

      // Registrar en historial
      await trx('seguimiento_orden').insert({
        orden_trabajo_id: ordenId,
        estado_anterior: 'pendiente',
        estado_actual: 'asignada',
        fecha_cambio: fechaAsignacion || new Date(),
        observaciones: `Prensa asignada: ${prensaId}`
      });
    });

    res.json({ success: true, message: "Prensa asignada correctamente" });
  } catch (error) {
    console.error("Error al asignar prensa:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/prensa/cambiar-estado", async (req: Request, res: Response) => {
  try {
    const { ordenId, nuevoEstado, fechaCambio } = req.body;

    await db.transaction(async (trx) => {
      // Actualizar estado de prensa
      await trx('orden_trabajo')
        .where('id', ordenId)
        .update({
          estado_prensa: nuevoEstado,
          updated_at: new Date()
        });

      // Si se completa prensa, mover a siguiente estado
      if (nuevoEstado === 'completada') {
        await trx('orden_trabajo')
          .where('id', ordenId)
          .update({
            estado: 'en_acabados',
            estado_prensa: 'completada'
          });
      }

      // Registrar en historial
      await trx('seguimiento_orden').insert({
        orden_trabajo_id: ordenId,
        estado_anterior: 'en_prensa',
        estado_actual: nuevoEstado,
        fecha_cambio: fechaCambio || new Date(),
        observaciones: `Prensa: ${nuevoEstado}`
      });
    });

    res.json({ success: true, message: "Estado de prensa actualizado" });
  } catch (error) {
    console.error("Error al cambiar estado de prensa:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Módulo Acabados
router.get("/acabados", async (req: Request, res: Response) => {
  try {
    const { tipo = 'todos' } = req.query;
    
    let whereClause = "ot.estado IN ('en_acabados', 'acabados_completados')";
    const params: any[] = [];
    let paramCount = 0;

    if (tipo !== 'todos') {
      paramCount++;
      whereClause += ` AND ot.tipo_acabado = $${paramCount}`;
      params.push(tipo);
    }

    const ordenes = await db.raw(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto,
        ot.estado_acabados,
        ot.tipo_acabado,
        ot.responsable_acabados,
        ot.fecha_entrega,
        ot.created_at
      FROM orden_trabajo ot
      WHERE ${whereClause}
      ORDER BY ot.created_at DESC
    `, params);

    res.json(ordenes.rows);
  } catch (error) {
    console.error("Error al obtener órdenes de acabados:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/acabados/cambiar-estado", async (req: Request, res: Response) => {
  try {
    const { ordenId, nuevoEstado, fechaCambio } = req.body;

    await db.transaction(async (trx) => {
      // Actualizar estado de acabados
      await trx('orden_trabajo')
        .where('id', ordenId)
        .update({
          estado_acabados: nuevoEstado,
          updated_at: new Date()
        });

      // Si se completan acabados, mover a control de calidad
      if (nuevoEstado === 'completada') {
        await trx('orden_trabajo')
          .where('id', ordenId)
          .update({
            estado: 'en_control_calidad',
            estado_acabados: 'completada'
          });
      }

      // Registrar en historial
      await trx('seguimiento_orden').insert({
        orden_trabajo_id: ordenId,
        estado_anterior: 'en_acabados',
        estado_actual: nuevoEstado,
        fecha_cambio: fechaCambio || new Date(),
        observaciones: `Acabados: ${nuevoEstado}`
      });
    });

    res.json({ success: true, message: "Estado de acabados actualizado" });
  } catch (error) {
    console.error("Error al cambiar estado de acabados:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Módulo Control de Calidad
router.get("/control-calidad", async (req: Request, res: Response) => {
  try {
    const { estado = 'todos' } = req.query;
    
    let whereClause = "ot.estado IN ('en_control_calidad', 'aprobada', 'rechazada')";
    const params: any[] = [];
    let paramCount = 0;

    if (estado !== 'todos') {
      paramCount++;
      whereClause += ` AND ot.estado_calidad = $${paramCount}`;
      params.push(estado);
    }

    const ordenes = await db.raw(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto,
        ot.estado_calidad,
        ot.inspector_calidad,
        ot.fecha_inspeccion,
        ot.observaciones_calidad,
        ot.created_at
      FROM orden_trabajo ot
      WHERE ${whereClause}
      ORDER BY ot.created_at DESC
    `, params);

    res.json(ordenes.rows);
  } catch (error) {
    console.error("Error al obtener órdenes de control de calidad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/control-calidad/cambiar-estado", async (req: Request, res: Response) => {
  try {
    const { ordenId, nuevoEstado, observaciones, fechaInspeccion } = req.body;

    await db.transaction(async (trx) => {
      // Actualizar estado de calidad
      await trx('orden_trabajo')
        .where('id', ordenId)
        .update({
          estado_calidad: nuevoEstado,
          fecha_inspeccion: fechaInspeccion || new Date(),
          observaciones_calidad: observaciones,
          updated_at: new Date()
        });

      // Si se aprueba, mover a empacado
      if (nuevoEstado === 'aprobada') {
        await trx('orden_trabajo')
          .where('id', ordenId)
          .update({
            estado: 'pendiente_empacado',
            estado_calidad: 'aprobada'
          });
      }

      // Registrar en historial
      await trx('seguimiento_orden').insert({
        orden_trabajo_id: ordenId,
        estado_anterior: 'en_control_calidad',
        estado_actual: nuevoEstado,
        fecha_cambio: fechaInspeccion || new Date(),
        observaciones: `Control de calidad: ${nuevoEstado}. ${observaciones || ''}`
      });
    });

    res.json({ success: true, message: "Estado de control de calidad actualizado" });
  } catch (error) {
    console.error("Error al cambiar estado de control de calidad:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Módulo Empacado y Entrega
router.get("/empacado-entrega", async (req: Request, res: Response) => {
  try {
    const { estado = 'todos' } = req.query;
    
    let whereClause = "ot.estado IN ('pendiente_empacado', 'empacado', 'listo_entrega', 'en_transito', 'entregado', 'recojo_pendiente')";
    const params: any[] = [];
    let paramCount = 0;

    if (estado !== 'todos') {
      paramCount++;
      whereClause += ` AND ot.estado_entrega = $${paramCount}`;
      params.push(estado);
    }

    const ordenes = await db.raw(`
      SELECT 
        ot.id,
        ot.numero_orden,
        ot.nombre_cliente,
        ot.concepto,
        ot.estado_entrega,
        ot.metodo_entrega,
        ot.responsable_entrega,
        ot.fecha_entrega,
        ot.observaciones_entrega,
        ot.created_at
      FROM orden_trabajo ot
      WHERE ${whereClause}
      ORDER BY ot.created_at DESC
    `, params);

    res.json(ordenes.rows);
  } catch (error) {
    console.error("Error al obtener órdenes de empacado y entrega:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/empacado-entrega/cambiar-estado", async (req: Request, res: Response) => {
  try {
    const { ordenId, nuevoEstado, fechaCambio, ...datosAdicionales } = req.body;

    await db.transaction(async (trx) => {
      // Actualizar estado de entrega
      const updateData: any = {
        estado_entrega: nuevoEstado,
        updated_at: new Date()
      };

      // Agregar datos adicionales si existen
      if (datosAdicionales.metodo_entrega) updateData.metodo_entrega = datosAdicionales.metodo_entrega;
      if (datosAdicionales.responsable_entrega) updateData.responsable_entrega = datosAdicionales.responsable_entrega;
      if (datosAdicionales.observaciones_entrega) updateData.observaciones_entrega = datosAdicionales.observaciones_entrega;

      await trx('orden_trabajo')
        .where('id', ordenId)
        .update(updateData);

      // Si se entrega, marcar como completado
      if (nuevoEstado === 'entregado') {
        await trx('orden_trabajo')
          .where('id', ordenId)
          .update({
            estado: 'entregado',
            estado_entrega: 'entregado'
          });
      }

      // Registrar en historial
      await trx('seguimiento_orden').insert({
        orden_trabajo_id: ordenId,
        estado_anterior: 'pendiente_empacado',
        estado_actual: nuevoEstado,
        fecha_cambio: fechaCambio || new Date(),
        observaciones: `Empacado/Entrega: ${nuevoEstado}`
      });
    });

    res.json({ success: true, message: "Estado de empacado/entrega actualizado" });
  } catch (error) {
    console.error("Error al cambiar estado de empacado/entrega:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
