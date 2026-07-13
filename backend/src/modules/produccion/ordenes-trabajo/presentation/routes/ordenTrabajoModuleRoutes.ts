import { Router } from 'express';
import { Client } from 'pg';
import authRequired from '../../../../../middleware/auth';
import checkPermission from '../../../../../middleware/checkPermission';

// ── Infraestructura ──────────────────────────────────────────────────────────
import { PgOrdenLegacyRepository } from '../../shared/infrastructure/persistence/PgOrdenLegacyRepository';
import { PgOrdenDigitalRepository } from '../../digital/infrastructure/persistence/PgOrdenDigitalRepository';
import { PgOrdenOffsetRepository } from '../../offset/infrastructure/persistence/PgOrdenOffsetRepository';
import { PgProduccionRepository } from '../../shared/infrastructure/persistence/PgProduccionRepository';
import { PgEjecucionEtapaRepository } from '../../shared/infrastructure/persistence/PgEjecucionEtapaRepository';
import { PgQaGateRepository } from '../../shared/infrastructure/persistence/PgQaGateRepository';
import { OrdenPdfService } from '../../shared/infrastructure/services/OrdenPdfService';
import { CotizacionAuxiliaryRepository } from '../../shared/infrastructure/persistence/CotizacionAuxiliaryRepository';
import { PgEstadoOrdenDigitalRepository } from '../../digital/infrastructure/persistence/PgEstadoOrdenDigitalRepository';
import { PgEstadoOrdenOffsetRepository } from '../../offset/infrastructure/persistence/PgEstadoOrdenOffsetRepository';

// ── Use-cases ────────────────────────────────────────────────────────────────
import { CreateOrdenCompletaUseCase } from '../../shared/application/use-cases/CreateOrdenCompletaUseCase';
import { UpdateOrdenCompletaUseCase } from '../../shared/application/use-cases/UpdateOrdenCompletaUseCase';
import { GetOrdenByIdUseCase } from '../../shared/application/use-cases/GetOrdenByIdUseCase';
import { DeleteOrdenUseCase } from '../../shared/application/use-cases/DeleteOrdenUseCase';
import { AprobarArtesUseCase } from '../../shared/application/use-cases/AprobarArtesUseCase';
import { EnviarProduccionUseCase } from '../../shared/application/use-cases/EnviarProduccionUseCase';
import { CancelarProduccionUseCase } from '../../shared/application/use-cases/CancelarProduccionUseCase';
import { CambiarEstadoProduccionUseCase } from '../../shared/application/use-cases/CambiarEstadoProduccionUseCase';
import { VincularCotizacionUseCase } from '../../shared/application/use-cases/VincularCotizacionUseCase';
import { SaveEjecucionUseCase } from '../../shared/application/use-cases/SaveEjecucionUseCase';

// ── Sub-módulos ───────────────────────────────────────────────────────────────
import { createOrdenDigitalRoutes } from '../../digital/presentation/routes/digitalRoutes';
import { createOrdenOffsetRoutes } from '../../offset/presentation/routes/offsetRoutes';

export function createOrdenesTrabajoModuleRoutes(client: Client) {
  const router = Router();

  // ── Construir repositorios ─────────────────────────────────────────────────
  const ordenRepo        = new PgOrdenLegacyRepository(client);
  const detalleDigital   = new PgOrdenDigitalRepository(client);
  const detalleOffset    = new PgOrdenOffsetRepository(client);
  const produccionRepo   = new PgProduccionRepository(client);
  const ejecucionRepo    = new PgEjecucionEtapaRepository(client);
  const qaRepo           = new PgQaGateRepository(client);
  const pdfService       = new OrdenPdfService(client);
  const cotizacionRepo   = new CotizacionAuxiliaryRepository(client);
  const estadoDigital    = new PgEstadoOrdenDigitalRepository(client);
  const estadoOffset     = new PgEstadoOrdenOffsetRepository(client);

  // ── Helpers de infraestructura compartidos por varios use-cases ───────────

  const runInTransaction = async <T>(fn: () => Promise<T>): Promise<T> => {
    await client.query('BEGIN');
    try {
      const result = await fn();
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  };

  const registrarHistorial = async (
    tabla: 'digital' | 'offset',
    ordenId: number,
    estadoId: number,
    userId: number | null,
    nota: string | null,
  ) => {
    const histTable =
      tabla === 'digital'
        ? 'estado_orden_digital_historial'
        : 'estado_orden_offset_historial';
    await client.query(
      `INSERT INTO ${histTable} (orden_trabajo_id, estado_id, usuario_id, nota)
       VALUES ($1,$2,$3,$4)`,
      [ordenId, estadoId, userId, nota ?? null],
    );
  };

  const getTipoYEstado = async (id: number) => {
    const r = await client.query(
      `SELECT ot.tipo_orden, ot.artes_aprobados,
              eod.key AS estado_digital_key, eoo.key AS estado_offset_key
       FROM orden_trabajo ot
       LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
       LEFT JOIN estado_orden_offset  eoo ON ot.estado_orden_offset_id  = eoo.id
       WHERE ot.id = $1`,
      [id],
    );
    return r.rows[0] ?? null;
  };

  const ensurePendienteDigital = async (): Promise<number> => {
    const r = await client.query(`
      WITH existente AS (SELECT id FROM estado_orden_digital WHERE key = 'pendiente' LIMIT 1),
           insertado AS (
             INSERT INTO estado_orden_digital (key, titulo, orden, color, activo)
             SELECT 'pendiente','Pendiente',0,'#6b7280',TRUE
             WHERE NOT EXISTS (SELECT 1 FROM existente) RETURNING id
           )
      SELECT id FROM insertado UNION ALL SELECT id FROM existente LIMIT 1`);
    const estadoId = r.rows[0]?.id;
    if (!estadoId) throw new Error('No se pudo inicializar el estado digital pendiente.');
    await client.query('UPDATE estado_orden_digital SET activo = TRUE WHERE id = $1', [estadoId]);
    return estadoId;
  };

  const ensureCancelado = async (tipo: 'digital' | 'offset'): Promise<number> => {
    const cat = tipo === 'digital' ? 'estado_orden_digital' : 'estado_orden_offset';
    const r = await client.query(`
      WITH existente AS (SELECT id FROM ${cat} WHERE key = 'cancelado' LIMIT 1),
           insertado AS (
             INSERT INTO ${cat} (key, titulo, orden, color, activo)
             SELECT 'cancelado','Cancelado',999,'#dc2626',TRUE
             WHERE NOT EXISTS (SELECT 1 FROM existente) RETURNING id
           )
      SELECT id FROM insertado UNION ALL SELECT id FROM existente LIMIT 1`);
    const estadoId = r.rows[0]?.id;
    await client.query(`UPDATE ${cat} SET activo = TRUE WHERE id = $1`, [estadoId]);
    return estadoId;
  };

  const cancelarEnDB = async (
    id: number,
    estadoCanceladoId: number,
    tipo: 'digital' | 'offset',
    motivo: string,
    userId: number | null,
  ) => {
    const col =
      tipo === 'digital' ? 'estado_orden_digital_id' : 'estado_orden_offset_id';
    const result = await client.query(
      `UPDATE orden_trabajo
         SET ${col} = $1, motivo_cancelacion = $2,
             observacion_produccion = NULL,
             updated_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [estadoCanceladoId, motivo, userId, id],
    );
    return result.rows[0] ?? null;
  };

  const getTrazabilidadRaw = async (id: number) => {
    const [envioRes, artesRes, inicioRes] = await Promise.all([
      client.query(
        `SELECT created_at, usuario FROM (
           SELECT COALESCE((to_jsonb(h)->>'created_at')::timestamptz,(to_jsonb(h)->>'fecha_cambio')::timestamptz) AS created_at,
                  COALESCE(u.nombre,'Sistema') AS usuario
           FROM estado_orden_digital_historial h
           LEFT JOIN usuarios u ON u.id = h.usuario_id
           WHERE h.orden_trabajo_id = $1
             AND lower(coalesce(h.nota,'')) LIKE '%enviad%'
             AND lower(coalesce(h.nota,'')) LIKE '%producci%'
           UNION ALL
           SELECT COALESCE((to_jsonb(h)->>'created_at')::timestamptz,(to_jsonb(h)->>'fecha_cambio')::timestamptz) AS created_at,
                  COALESCE(u.nombre,'Sistema') AS usuario
           FROM estado_orden_offset_historial h
           LEFT JOIN usuarios u ON u.id = h.usuario_id
           WHERE h.orden_trabajo_id = $1
             AND lower(coalesce(h.nota,'')) LIKE '%enviad%'
             AND lower(coalesce(h.nota,'')) LIKE '%producci%'
         ) x ORDER BY created_at ASC LIMIT 1`,
        [id],
      ),
      client.query(
        `SELECT created_at, usuario FROM (
           SELECT COALESCE((to_jsonb(h)->>'created_at')::timestamptz,(to_jsonb(h)->>'fecha_cambio')::timestamptz) AS created_at,
                  COALESCE(u.nombre,'Sistema') AS usuario
           FROM estado_orden_digital_historial h
           LEFT JOIN usuarios u ON u.id = h.usuario_id
           WHERE h.orden_trabajo_id = $1
             AND lower(coalesce(h.nota,'')) LIKE '%artes%'
             AND lower(coalesce(h.nota,'')) LIKE '%aprob%'
           UNION ALL
           SELECT COALESCE((to_jsonb(h)->>'created_at')::timestamptz,(to_jsonb(h)->>'fecha_cambio')::timestamptz) AS created_at,
                  COALESCE(u.nombre,'Sistema') AS usuario
           FROM estado_orden_offset_historial h
           LEFT JOIN usuarios u ON u.id = h.usuario_id
           WHERE h.orden_trabajo_id = $1
             AND lower(coalesce(h.nota,'')) LIKE '%artes%'
             AND lower(coalesce(h.nota,'')) LIKE '%aprob%'
         ) x ORDER BY created_at ASC LIMIT 1`,
        [id],
      ),
      client.query(
        `SELECT created_at, created_by, etapa_titulo, fecha_inicio, hora_inicio
         FROM ejecucion_etapa WHERE orden_trabajo_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [id],
      ),
    ]);
    return {
      envioRow: envioRes.rows[0] ?? null,
      artesRow: artesRes.rows[0] ?? null,
      inicioRow: inicioRes.rows[0] ?? null,
    };
  };

  // ── Error handler ──────────────────────────────────────────────────────────
  const handle = (res: any, err: any) => {
    console.error(err);
    const status = err?.status ?? 500;
    res.status(status).json({ error: err?.message ?? 'Error interno del servidor' });
  };

  // =========================================================================
  // DATOS COTIZACIÓN
  // =========================================================================

  router.get('/datosCotizacion/:id', authRequired(), async (req: any, res: any) => {
    try {
      const datos = await cotizacionRepo.getDatosCotizacion(parseInt(req.params.id, 10));
      if (!datos) return res.status(404).json({ message: 'Cotización no encontrada' });
      res.json(datos);
    } catch (err) { handle(res, err); }
  });

  // =========================================================================
  // COTIZACIONES VINCULABLES
  // =========================================================================

  router.get('/cotizaciones-vinculables', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req: any, res: any) => {
      try {
        const busqueda = String(req.query.busqueda || '').trim();
        const limite = Math.min(Math.max(Number(req.query.limite || 10), 1), 50);
        res.json(await ordenRepo.getCotizacionesVinculables(busqueda || undefined, limite));
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // PRÓXIMO NÚMERO
  // =========================================================================

  router.get('/proximoNumero', authRequired(), async (_req: any, res: any) => {
    try {
      const proximoNumero = await ordenRepo.getProximoNumero();
      res.json({ proximoNumero });
    } catch (err) { handle(res, err); }
  });

  // =========================================================================
  // CREAR ORDEN DE TRABAJO
  // =========================================================================

  router.post('/crearOrdenTrabajo', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'crear'),
    async (req: any, res: any) => {
      try {
        const userId = req.user.id;
        const { nombre_cliente } = req.body;
        if (!String(nombre_cliente || '').trim()) {
          return res.status(400).json({
            error: 'Errores de validación',
            details: [{ field: 'nombre_cliente', message: 'El campo Cliente es obligatorio' }],
          });
        }
        const useCase = new CreateOrdenCompletaUseCase({
          ordenRepo,
          detalleDigitalRepo: detalleDigital,
          detalleOffsetRepo: detalleOffset,
          estadoDigitalRepo: estadoDigital,
          estadoOffsetRepo: estadoOffset,
          runInTransaction,
          checkCotizacionExists: async (id) => {
            const r = await client.query('SELECT 1 FROM cotizaciones WHERE id = $1 LIMIT 1', [id]);
            return r.rows.length > 0;
          },
        });
        const result = await useCase.execute(req.body, userId);
        res.status(201).json({ message: 'Orden de trabajo creada correctamente', numero_orden: result.numero_orden });
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // LISTAR ÓRDENES (con filtros y paginación)
  // =========================================================================

  router.get('/listar', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req: any, res: any) => {
      try {
        const { busqueda, concepto, material, fechaDesde, fechaHasta, limite, tipo_orden, id_cotizacion } = req.query;
        let idCot: number | undefined;
        if (id_cotizacion !== undefined && String(id_cotizacion).trim() !== '') {
          idCot = Number(id_cotizacion);
          if (!Number.isInteger(idCot) || idCot <= 0)
            return res.status(400).json({ error: 'id_cotizacion inválido' });
        }
        const rows = await ordenRepo.listar({
          busqueda:   busqueda   ? String(busqueda)   : undefined,
          concepto:   concepto   ? String(concepto)   : undefined,
          material:   material   ? String(material)   : undefined,
          fechaDesde: fechaDesde ? String(fechaDesde) : undefined,
          fechaHasta: fechaHasta ? String(fechaHasta) : undefined,
          limite:     limite     ? Number(limite)     : undefined,
          tipo_orden: tipo_orden ? String(tipo_orden) : undefined,
          id_cotizacion: idCot,
        });
        res.json(rows);
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // OBTENER ORDEN POR ID (con trazabilidad)
  // =========================================================================

  router.get('/orden/:id', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        const useCase = new GetOrdenByIdUseCase({
          ordenRepo,
          detalleDigitalRepo: detalleDigital,
          detalleOffsetRepo: detalleOffset,
          getTrazabilidadRaw,
        });
        const orden = await useCase.execute(id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json(orden);
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // EDITAR ORDEN DE TRABAJO
  // =========================================================================

  router.put('/editarOrden/:id', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const esAdmin = String(req.user?.rol || '').toLowerCase() === 'admin';
        const bloqueada = await ordenRepo.fueEnviadaAProduccion(id);
        if (bloqueada && !esAdmin) {
          return res.status(409).json({
            error: 'No se puede actualizar la orden porque ya fue enviada a producción. Solo un admin puede editarla. Usa Crear como Nueva.',
          });
        }
        const useCase = new UpdateOrdenCompletaUseCase({
          ordenRepo,
          detalleDigitalRepo: detalleDigital,
          detalleOffsetRepo: detalleOffset,
          runInTransaction,
        });
        const ordenActualizada = await useCase.execute(id, req.body, userId);
        res.json({ message: 'Orden actualizada correctamente', orden: ordenActualizada });
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // ELIMINAR ORDEN
  // =========================================================================

  router.delete('/eliminar/:id', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'eliminar'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        const useCase = new DeleteOrdenUseCase(ordenRepo);
        await useCase.execute(id);
        res.json({ message: 'Orden eliminada correctamente' });
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // APROBAR ARTES
  // =========================================================================

  router.put('/:id/aprobar-artes', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        // El tipo lo resolvemos leyendo la orden aprobada que ya tiene tipo_orden
        const useCase = new AprobarArtesUseCase(
          ordenRepo,
          async (ordenId, estadoId, userId, nota) => {
            // Leer tipo_orden para dirigir al historial correcto
            const tipoRes = await client.query(
              'SELECT tipo_orden FROM orden_trabajo WHERE id = $1', [ordenId],
            );
            const tipo = (tipoRes.rows[0]?.tipo_orden || 'offset').toLowerCase() as 'digital' | 'offset';
            await registrarHistorial(tipo, ordenId, estadoId, userId, nota);
          },
        );
        const result = await useCase.execute(id, req.body.fecha_entrega, req.user?.id ?? null);
        res.json(result);
      } catch (err: any) {
        if (err.message?.includes('fecha'))   return res.status(400).json({ error: err.message });
        if (err.message?.includes('enviada')) return res.status(409).json({ error: err.message });
        handle(res, err);
      }
    },
  );

  // =========================================================================
  // ENVIAR A PRODUCCIÓN
  // =========================================================================

  router.put('/:id/enviar-produccion', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        const observacion = String(req.body?.observacion || '').trim() || null;
        const useCase = new EnviarProduccionUseCase({
          ordenRepo,
          estadoDigitalRepo: estadoDigital,
          estadoOffsetRepo: estadoOffset,
          ensurePendienteDigital,
          registrarHistorial,
          getTipoYEstado,
        });
        const result = await useCase.execute(id, observacion, req.user?.id ?? null);
        res.json(result);
      } catch (err: any) {
        if (err.message?.includes('artes') || err.message?.includes('cancelada'))
          return res.status(409).json({ error: err.message });
        handle(res, err);
      }
    },
  );

  // =========================================================================
  // CANCELAR PRODUCCIÓN
  // =========================================================================

  router.put('/:id/cancelar-produccion', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        const motivo = String(req.body?.motivo || '').trim();
        const useCase = new CancelarProduccionUseCase({
          ordenRepo,
          ensureCancelado,
          getTipoYEstado,
          cancelarEnDB,
          registrarHistorial,
        });
        const result = await useCase.execute(id, motivo, req.user?.id ?? null);
        res.json(result);
      } catch (err: any) {
        if (err.message?.includes('motivo'))   return res.status(400).json({ error: err.message });
        if (err.message?.includes('pendiente') || err.message?.includes('enviada'))
          return res.status(409).json({ error: err.message });
        handle(res, err);
      }
    },
  );

  // =========================================================================
  // VINCULAR COTIZACIÓN
  // =========================================================================

  router.put('/:id/vincular-cotizacion', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        const { cotizacion_id } = req.body;
        const cotizacionIdNum = Number(cotizacion_id);
        if (!Number.isInteger(cotizacionIdNum) || cotizacionIdNum <= 0)
          return res.status(400).json({ error: 'cotizacion_id inválido' });

        const bloqueada = await ordenRepo.fueEnviadaAProduccion(id);
        if (bloqueada)
          return res.status(409).json({ error: 'No se puede vincular cotización porque la orden ya fue enviada a producción.' });

        const cotizacion = await cotizacionRepo.getDatosCotizacion(cotizacionIdNum);
        if (!cotizacion) return res.status(404).json({ error: 'Cotización no encontrada' });

        const useCase = new VincularCotizacionUseCase({
          vincularCotizacion: (oId, cId) =>
            ordenRepo.vincularCotizacion(oId, cId, req.user?.id ?? null),
        } as any);
        await useCase.execute(id, cotizacionIdNum, req.user?.id ?? null);

        const orden = await ordenRepo.findByIdFull(id);
        if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });
        res.json({ success: true, message: 'Cotización vinculada correctamente', orden, cotizacion });
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // PDF — DESCARGA, PREVIEW Y CORREO
  // =========================================================================

  router.get('/:id(\\d+)/pdf', authRequired(), async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const pdfBuffer = await pdfService.generatePdf(id);
      if (!pdfBuffer) return res.status(404).json({ error: 'Orden no encontrada' });
      const data = await pdfService.getOrdenConDetalle(id);
      const numero = data?.orden?.numero_orden ?? id;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="orden_trabajo_${numero}.pdf"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(pdfBuffer);
    } catch (err) { handle(res, err); }
  });

  router.get('/:id(\\d+)/preview', authRequired(), async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const pdfBuffer = await pdfService.generatePdf(id);
      if (!pdfBuffer) return res.status(404).json({ success: false, error: 'Orden no encontrada' });
      res.json({ success: true, pdf: `data:application/pdf;base64,${pdfBuffer.toString('base64')}` });
    } catch (err) { handle(res, err); }
  });

  router.post('/:id(\\d+)/enviar-correo', async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { email, asunto, mensaje } = req.body;
      if (!email) return res.status(400).json({ error: 'El correo electrónico es requerido' });

      const data = await pdfService.getOrdenConDetalle(id);
      if (!data) return res.status(404).json({ error: 'Orden no encontrada' });
      const pdfBuffer = await pdfService.generatePdf(id);
      if (!pdfBuffer) return res.status(500).json({ error: 'Error al generar el PDF' });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST || 'smtp.example.com',
        port:   process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: false,
        auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
      });
      await transporter.sendMail({
        from:    process.env.SMTP_FROM || 'no-reply@mundografic.com',
        to:      email,
        subject: asunto  || `Orden de Trabajo #${data.orden.numero_orden}`,
        text:    mensaje || 'Adjunto encontrará la orden de trabajo solicitada.',
        attachments: [{
          filename:    `orden_trabajo_${data.orden.numero_orden}.pdf`,
          content:     pdfBuffer,
          contentType: 'application/pdf',
        }],
      });
      res.json({ success: true, message: 'Correo enviado correctamente' });
    } catch (err) { handle(res, err); }
  });

  // =========================================================================
  // PRODUCCIÓN — ÓRDENES, WORKFLOW, MÉTRICAS, ACTIVIDADES, ESTADOS
  // =========================================================================

  router.get('/produccion/ordenes', authRequired(), async (_req: any, res: any) => {
    try {
      const ordenes = await produccionRepo.getOrdenesEnProduccion();
      res.json({ success: true, ordenes, total: ordenes.length });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/workflow', authRequired(), async (req: any, res: any) => {
    try {
      const tipo = String(req.query.tipo || 'offset').toLowerCase();
      if (tipo === 'digital') {
        const rows = await produccionRepo.getWorkflowDigital();
        const workflow = rows.map((r: any) => ({
          id: r.key, titulo: r.titulo, color: r.color || 'gray', aliases: [r.key, r.titulo],
        }));
        return res.json({ success: true, workflow });
      }
      res.json({ success: true, workflow: produccionRepo.getWorkflowOffset() });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/metricas', authRequired(), async (_req: any, res: any) => {
    try {
      const metricas = await produccionRepo.getMetricas();
      res.json({ success: true, metricas });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/actividades', authRequired(), async (req: any, res: any) => {
    try {
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string) || 10));
      const actividades = await produccionRepo.getActividades(limit);
      res.json({ success: true, actividades });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/estados', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (_req: any, res: any) => {
      try {
        const [digital, offset] = await Promise.all([
          estadoDigital.getActiveStates(),
          estadoOffset.getActiveStates(),
        ]);
        res.json({ digital, offset });
      } catch (err) { handle(res, err); }
    },
  );

  // ── Cambiar estado (ruta principal + alias legacy) ─────────────────────────

  const buildCambiarEstadoUseCase = () =>
    new CambiarEstadoProduccionUseCase({
      estadoDigitalRepo: estadoDigital,
      estadoOffsetRepo:  estadoOffset,
      getTipoOrden: async (id) => {
        const r = await client.query('SELECT tipo_orden FROM orden_trabajo WHERE id = $1', [id]);
        return r.rows[0]?.tipo_orden ?? null;
      },
      updateEstadoOrden: async (id, estadoId, isDigital) => {
        const col = isDigital ? 'estado_orden_digital_id' : 'estado_orden_offset_id';
        const r = await client.query(
          `UPDATE orden_trabajo SET ${col} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
          [estadoId, id],
        );
        return r.rows[0] ?? null;
      },
      updateResponsablesOffset: async (id, campos) => {
        const fields: string[] = [];
        const vals: any[] = [];
        let p = 1;
        if (campos.preprensa !== undefined) { fields.push(`preprensa = $${p++}`); vals.push(campos.preprensa); }
        if (campos.prensa     !== undefined) { fields.push(`prensa = $${p++}`);     vals.push(campos.prensa); }
        if (campos.terminados !== undefined) { fields.push(`terminados = $${p++}`); vals.push(campos.terminados); }
        if (!fields.length) return;
        vals.push(id);
        await client.query(
          `UPDATE detalle_orden_trabajo_offset SET ${fields.join(', ')}, updated_at=NOW() WHERE orden_trabajo_id = $${p}`,
          vals,
        );
      },
      registrarHistorial,
    });

  router.put('/produccion/:id/estado', authRequired(), async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await buildCambiarEstadoUseCase().execute(id, req.body, req.user?.id ?? null);
      res.json(result);
    } catch (err: any) {
      if (err.status === 400)
        return res.status(400).json({ success: false, error: err.message, allowed: err.allowed });
      handle(res, err);
    }
  });

  router.put('/produccion/workflow/:id/cambiar-estado', authRequired(), async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await buildCambiarEstadoUseCase().execute(id, req.body, req.user?.id ?? null);
      res.json(result);
    } catch (err: any) {
      if (err.status === 400)
        return res.status(400).json({ success: false, error: err.message, allowed: err.allowed });
      handle(res, err);
    }
  });

  router.get('/produccion/:id/trazabilidad', authRequired(), async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'ID de orden inválido' });
      const data = await produccionRepo.getTrazabilidad(id);
      if (!data) return res.status(404).json({ error: 'Orden no encontrada' });
      res.json(data);
    } catch (err) { handle(res, err); }
  });

  // =========================================================================
  // EJECUCIÓN DE ETAPA
  // =========================================================================

  router.post('/produccion/:id/ejecucion', authRequired(), async (req: any, res: any) => {
    try {
      const ordenId = parseInt(req.params.id, 10);
      const useCase = new SaveEjecucionUseCase(ejecucionRepo);
      const result = await useCase.execute({
        ...req.body,
        orden_trabajo_id: ordenId,
        created_by: req.user?.nombre || req.user?.email || null,
      });
      res.json({ success: true, ejecucion: result });
    } catch (err: any) {
      if (err.message?.includes('obligatorio')) return res.status(400).json({ error: err.message });
      handle(res, err);
    }
  });

  router.get('/produccion/:id/ejecucion', authRequired(), async (req: any, res: any) => {
    try {
      const ordenId = parseInt(req.params.id, 10);
      const ejecuciones = await ejecucionRepo.findByOrden(ordenId);
      res.json({ ejecuciones });
    } catch (err) { handle(res, err); }
  });

  router.patch('/produccion/:id/ejecucion/:etapa_id/fin', authRequired(), async (req: any, res: any) => {
    try {
      const ordenId = parseInt(req.params.id, 10);
      const { etapa_id } = req.params;
      const { fecha_fin, hora_fin } = req.body;
      if (!fecha_fin || !hora_fin)
        return res.status(400).json({ error: 'fecha_fin y hora_fin son obligatorios' });
      const result = await ejecucionRepo.updateFin(ordenId, etapa_id, fecha_fin, hora_fin);
      if (!result) return res.status(404).json({ error: 'No se encontró registro de ejecución para esa etapa' });
      res.json({ success: true, ejecucion: result });
    } catch (err) { handle(res, err); }
  });

  // =========================================================================
  // QA GATES
  // =========================================================================

  router.post('/produccion/:id/qa', authRequired(), async (req: any, res: any) => {
    try {
      const ordenId = parseInt(req.params.id, 10);
      const { etapa_id, etapa_titulo } = req.body;
      if (!etapa_id) return res.status(400).json({ error: 'etapa_id es obligatorio' });

      const estadoRes = await client.query(
        `SELECT ot.id, ot.tipo_orden, eod.key AS estado_digital_key, eoo.key AS estado_offset_key
         FROM orden_trabajo ot
         LEFT JOIN estado_orden_digital eod ON eod.id = ot.estado_orden_digital_id
         LEFT JOIN estado_orden_offset  eoo ON eoo.id = ot.estado_orden_offset_id
         WHERE ot.id = $1 LIMIT 1`,
        [ordenId],
      );
      if (!estadoRes.rows.length) return res.status(404).json({ error: 'Orden no encontrada' });
      const ot = estadoRes.rows[0];
      const esDigital = String(ot.tipo_orden || '').toLowerCase() === 'digital';
      const estadoKey = (esDigital ? ot.estado_digital_key : ot.estado_offset_key || '').toLowerCase();
      if (['entregado', 'facturado'].includes(estadoKey))
        return res.status(409).json({ error: 'La orden ya está entregada/facturada.' });

      const gate = await qaRepo.create({
        orden_trabajo_id: ordenId,
        etapa_id,
        etapa_titulo,
        created_by: req.user?.nombre || req.user?.email || null,
      });
      res.status(201).json({ success: true, gate });
    } catch (err) { handle(res, err); }
  });

  router.put('/produccion/:id/qa/:gateId', authRequired(), async (req: any, res: any) => {
    try {
      const gateId = parseInt(req.params.gateId, 10);
      const gate = await qaRepo.update(gateId, {
        ...req.body,
        updated_by: req.user?.nombre || req.user?.email || null,
      });
      if (!gate) return res.status(404).json({ error: 'Gate no encontrado' });
      res.json({ success: true, gate });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/:id/qa', authRequired(), async (req: any, res: any) => {
    try {
      const ordenId = parseInt(req.params.id, 10);
      const gates = await qaRepo.findByOrden(ordenId);
      res.json({ gates });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/qa/historial', authRequired(), async (req: any, res: any) => {
    try {
      const { desde, hasta, estado, inspector, etapa_id, numero_orden, page, limit } = req.query as any;
      const result = await qaRepo.getHistorial({
        desde, hasta, estado, inspector, etapa_id, numero_orden,
        page: Number(page || 1), limit: Number(limit || 50),
      });
      res.json({ ...result, page: Number(page || 1), limit: Number(limit || 50) });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/qa/pendientes', authRequired(), async (_req: any, res: any) => {
    try {
      res.json({ pendientes: await qaRepo.getPendientes() });
    } catch (err) { handle(res, err); }
  });

  router.get('/produccion/qa/estados', authRequired(), async (_req: any, res: any) => {
    try {
      res.json({ gates: await qaRepo.getEstados() });
    } catch (err) { handle(res, err); }
  });

  // =========================================================================
  // OBTENER ORDEN POR ID NUMÉRICO (ruta genérica — DEBE IR AL FINAL)
  // =========================================================================

  router.get('/:id(\\d+)', authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req: any, res: any) => {
      try {
        const id = parseInt(req.params.id, 10);
        const useCase = new GetOrdenByIdUseCase({
          ordenRepo,
          detalleDigitalRepo: detalleDigital,
          detalleOffsetRepo: detalleOffset,
          getTrazabilidadRaw,
        });
        const orden = await useCase.execute(id);
        if (!orden) return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
        res.json(orden);
      } catch (err) { handle(res, err); }
    },
  );

  // =========================================================================
  // SUB-MÓDULOS DIGITAL / OFFSET
  // =========================================================================

  router.use('/digital', createOrdenDigitalRoutes(client));
  router.use('/offset',  createOrdenOffsetRoutes(client));

  console.log('✅ [Órdenes Trabajo] Módulo migrado a arquitectura limpia');
  return router;
}
