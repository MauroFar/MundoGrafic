import { Router } from 'express';
import { Client } from 'pg';
import authRequired from '../../../../../middleware/auth';
import checkPermission from '../../../../../middleware/checkPermission';
import { PgOrdenQueryRepository } from '../../shared/infrastructure/persistence/PgOrdenQueryRepository';
import { PgOrdenCommandRepository } from '../../shared/infrastructure/persistence/PgOrdenCommandRepository';
import { CotizacionAuxiliaryRepository } from '../../shared/infrastructure/persistence/CotizacionAuxiliaryRepository';
import { PgEstadoOrdenDigitalRepository } from '../../digital/infrastructure/persistence/PgEstadoOrdenDigitalRepository';
import { PgEstadoOrdenOffsetRepository } from '../../offset/infrastructure/persistence/PgEstadoOrdenOffsetRepository';
import { GetProximoNumeroUseCase } from '../../shared/application/use-cases/GetProximoNumeroUseCase';
import { SearchOrdenesUseCase } from '../../shared/application/use-cases/SearchOrdenesUseCase';
import { CreateOrdenUseCase } from '../../shared/application/use-cases/CreateOrdenUseCase';
import { VincularCotizacionUseCase } from '../../shared/application/use-cases/VincularCotizacionUseCase';
import { createOrdenDigitalRoutes } from '../../digital/presentation/routes/digitalRoutes';
import { createOrdenOffsetRoutes } from '../../offset/presentation/routes/offsetRoutes';

export function createOrdenesTrabajoModuleRoutes(client: Client) {
  const router = Router();

  // Instanciar repositorios compartidos
  const ordenQueryRepo = new PgOrdenQueryRepository(client);
  const ordenCommandRepo = new PgOrdenCommandRepository(client);
  const cotizacionAuxRepo = new CotizacionAuxiliaryRepository(client);
  const estadoDigitalRepo = new PgEstadoOrdenDigitalRepository(client);
  const estadoOffsetRepo = new PgEstadoOrdenOffsetRepository(client);

  // === ENDPOINTS COMPARTIDOS ===

  // GET /ordenTrabajo/proximoNumero - Obtener próximo número de orden
  router.get(
    '/proximoNumero',
    authRequired(),
    async (req, res) => {
      try {
        const useCase = new GetProximoNumeroUseCase(ordenQueryRepo);
        const proximoNumero = await useCase.execute();
        
        res.json({ proximoNumero });
      } catch (error: any) {
        console.error('Error al obtener próximo número:', error);
        res.status(500).json({ error: 'Error al obtener próximo número de orden' });
      }
    }
  );

  // POST /ordenTrabajo/ - Crear nueva orden de trabajo
  router.post(
    '/',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'crear'),
    async (req, res) => {
      try {
        const tipoOrden = req.body.tipo_orden;

        const input: any = {
          tipo_orden: tipoOrden,
          fecha: new Date(req.body.fecha),
          cliente_id: req.body.cliente_id,
          ruc_id: req.body.ruc_id,
          cotizacion_id: req.body.cotizacion_id,
          artes_aprobados: req.body.artes_aprobados,
          observaciones: req.body.observaciones,
          created_by: req.body.created_by,
        };

        if (tipoOrden === 'digital') {
          const pendingStateId = await estadoDigitalRepo.getPendingStateId();
          if (pendingStateId !== null) {
            input.estado_orden_digital_id = pendingStateId;
          }
        }

        if (tipoOrden === 'offset') {
          const pendingStateId = await estadoOffsetRepo.getPendingStateId();
          if (pendingStateId !== null) {
            input.estado_orden_offset_id = pendingStateId;
          }
        }

        const useCase = new CreateOrdenUseCase(ordenCommandRepo);
        const ordenCreada = await useCase.execute(input);
        res.status(201).json(ordenCreada);
      } catch (error: any) {
        console.error('Error creando orden de trabajo:', error);
        res.status(500).json({ error: 'Error creando orden de trabajo' });
      }
    }
  );

  // GET /ordenTrabajo/ - Listar órdenes con filtros
  router.get(
    '/',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const filters = {
          tipo_orden: req.query.tipo_orden as any,
          numero_orden: req.query.numero_orden as string,
          cliente_id: req.query.cliente_id ? parseInt(req.query.cliente_id as string) : undefined,
        };

        const useCase = new SearchOrdenesUseCase(ordenQueryRepo);
        const ordenes = await useCase.execute(filters);
        
        res.json(ordenes.map(o => o.toPersistence()));
      } catch (error: any) {
        console.error('Error al listar órdenes:', error);
        res.status(500).json({ error: 'Error al listar órdenes de trabajo' });
      }
    }
  );

  // GET /ordenTrabajo/buscar - Búsqueda compatible con la ruta legacy
  router.get(
    '/buscar',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const filters = {
          tipo_orden: req.query.tipo_orden as any,
          busqueda: req.query.busqueda as string,
          ruc_id: req.query.ruc_id ? parseInt(req.query.ruc_id as string) : undefined,
        };

        const useCase = new SearchOrdenesUseCase(ordenQueryRepo);
        const ordenes = await useCase.execute(filters);
        res.json(ordenes.map(o => o.toPersistence()));
      } catch (error: any) {
        console.error('Error al buscar órdenes:', error);
        res.status(500).json({ error: 'Error al buscar órdenes de trabajo' });
      }
    }
  );

  // GET /ordenTrabajo/orden/:id - Alias compatible con la ruta legacy
  router.get(
    '/orden/:id',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        const orden = await ordenQueryRepo.findById(id);

        if (!orden) {
          return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
        }

        res.json(orden.toPersistence());
      } catch (error: any) {
        console.error('Error al obtener orden de trabajo por ID:', error);
        res.status(500).json({ error: 'Error al obtener orden de trabajo' });
      }
    }
  );

  // DELETE /ordenTrabajo/eliminar/:id - Eliminar orden compatible con la ruta legacy
  router.delete(
    '/eliminar/:id',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'eliminar'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        await ordenCommandRepo.delete(id);
        res.json({ message: 'Orden eliminada correctamente' });
      } catch (error: any) {
        console.error('Error al eliminar orden de trabajo:', error);
        res.status(500).json({ error: 'Error al eliminar orden de trabajo' });
      }
    }
  );

  // GET /ordenTrabajo/:id - Obtener una orden por ID
  router.get(
    '/:id',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        const orden = await ordenQueryRepo.findById(id);

        if (!orden) {
          return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
        }

        res.json(orden.toPersistence());
      } catch (error: any) {
        console.error('Error al obtener orden de trabajo por ID:', error);
        res.status(500).json({ error: 'Error al obtener orden de trabajo' });
      }
    }
  );

  // PUT /ordenTrabajo/:id - Actualizar una orden base
  router.put(
    '/:id',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        const updates: any = {};

        if (req.body.fecha !== undefined) updates.fecha = new Date(req.body.fecha);
        if (req.body.cliente_id !== undefined) updates.cliente_id = req.body.cliente_id;
        if (req.body.ruc_id !== undefined) updates.ruc_id = req.body.ruc_id;
        if (req.body.artes_aprobados !== undefined) updates.artes_aprobados = req.body.artes_aprobados;
        if (req.body.observaciones !== undefined) updates.observaciones = req.body.observaciones;
        if (req.body.updated_by !== undefined) updates.updated_by = req.body.updated_by;

        const ordenActualizada = await ordenCommandRepo.update(id, updates);
        res.json(ordenActualizada);
      } catch (error: any) {
        console.error('Error al actualizar orden de trabajo:', error);
        res.status(500).json({ error: 'Error al actualizar orden de trabajo' });
      }
    }
  );

  // GET /ordenTrabajo/datosCotizacion/:id - Obtener datos de una cotización
  router.get(
    '/datosCotizacion/:id',
    authRequired(),
    async (req, res) => {
      try {
        const { id } = req.params;
        const datos = await cotizacionAuxRepo.getDatosCotizacion(parseInt(id, 10));
        
        if (!datos) {
          return res.status(404).json({ error: 'Cotización no encontrada' });
        }
        
        res.json(datos);
      } catch (error: any) {
        console.error('Error al obtener datos de cotización:', error);
        res.status(500).json({ error: 'Error al obtener datos de la cotización' });
      }
    }
  );

  // GET /ordenTrabajo/cotizaciones-vinculables - Listar cotizaciones disponibles
  router.get(
    '/cotizaciones-vinculables',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const busqueda = req.query.busqueda as string;
        const limite = Math.min(Math.max(parseInt(req.query.limite as string) || 10, 1), 50);
        
        const cotizaciones = await cotizacionAuxRepo.getCotizacionesVinculables(busqueda, limite);
        res.json(cotizaciones);
      } catch (error: any) {
        console.error('Error al obtener cotizaciones vinculables:', error);
        res.status(500).json({ error: 'Error al obtener cotizaciones vinculables' });
      }
    }
  );

  // GET /ordenTrabajo/produccion/estados - Catálogo de estados para producción
  router.get(
    '/produccion/estados',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (_req, res) => {
      try {
        const [digital, offset] = await Promise.all([
          estadoDigitalRepo.getActiveStates(),
          estadoOffsetRepo.getActiveStates(),
        ]);

        res.json({ digital, offset });
      } catch (error: any) {
        console.error('Error al obtener estados de producción:', error);
        res.status(500).json({ error: 'Error al obtener estados de producción' });
      }
    }
  );

  // GET /ordenTrabajo/produccion/actividades - Actividades recientes de producción
  router.get(
    '/produccion/actividades',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string) || 10));
        const result = await client.query(
          `
            SELECT
              ot.id,
              ot.numero_orden,
              ot.tipo_orden,
              ot.updated_at,
              COALESCE(eod.titulo, eoo.titulo, 'Sin estado') AS estado,
              COALESCE(eod.key, eoo.key) AS estado_key
            FROM orden_trabajo ot
            LEFT JOIN estado_orden_digital eod ON ot.estado_orden_digital_id = eod.id
            LEFT JOIN estado_orden_offset eoo ON ot.estado_orden_offset_id = eoo.id
            ORDER BY ot.updated_at DESC
            LIMIT $1
          `,
          [limit]
        );

        res.json(result.rows);
      } catch (error: any) {
        console.error('Error al obtener actividades de producción:', error);
        res.status(500).json({ error: 'Error al obtener actividades de producción' });
      }
    }
  );

  // PUT /ordenTrabajo/produccion/:id/estado - Actualizar estado de producción de una orden
  router.put(
    '/produccion/:id/estado',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        const { estado, preprensa, prensa, terminados, nota } = req.body;
        const notaNormalizada = typeof nota === 'string' ? nota.trim() : '';

        const orden = await ordenQueryRepo.findById(id);
        if (!orden) {
          return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        }

        const tipoOrden = String((orden as any).tipo_orden || '').toLowerCase();
        const isDigitalOrder = tipoOrden === 'digital';
        const stateRepo = isDigitalOrder ? estadoDigitalRepo : estadoOffsetRepo;

        let estadoId: number | null = null;
        if (estado !== undefined) {
          if (typeof estado === 'number' || /^\d+$/.test(String(estado))) {
            const state = await stateRepo.getStateById(Number(estado));
            estadoId = state?.id ?? null;
          } else if (typeof estado === 'string') {
            const rows = await stateRepo.getActiveStates();
            const normalize = (value: string) => value
              .toString()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .toLowerCase()
              .trim()
              .replace(/[_\s]+/g, '');

            const target = normalize(estado);
            const matched = rows.find((row: any) => {
              const keyNorm = normalize(row.key || '');
              const titleNorm = normalize(row.titulo || '');
              return keyNorm === target || titleNorm === target || keyNorm.includes(target) || titleNorm.includes(target) || target.includes(keyNorm) || target.includes(titleNorm);
            });

            estadoId = matched?.id ?? null;
          }

          if (!estadoId) {
            const allowed = (await stateRepo.getActiveStates()).map((row: any) => ({ id: row.id, key: row.key, titulo: row.titulo }));
            return res.status(400).json({ success: false, error: `${isDigitalOrder ? 'Estado digital' : 'Estado offset'} no reconocido`, allowed });
          }
        }

        const updates: any = {};
        if (estadoId !== null) {
          updates[isDigitalOrder ? 'estado_orden_digital_id' : 'estado_orden_offset_id'] = estadoId;
        }

        const updatedOrder = await ordenCommandRepo.update(id, updates);

        if (preprensa !== undefined || prensa !== undefined || terminados !== undefined) {
          const detalleFields: string[] = [];
          const detalleValues: any[] = [];
          let index = 1;

          if (preprensa !== undefined) {
            detalleFields.push(`preprensa = $${index++}`);
            detalleValues.push(preprensa);
          }
          if (prensa !== undefined) {
            detalleFields.push(`prensa = $${index++}`);
            detalleValues.push(prensa);
          }
          if (terminados !== undefined) {
            detalleFields.push(`terminados = $${index++}`);
            detalleValues.push(terminados);
          }

          detalleValues.push(id);
          await client.query(
            `UPDATE detalle_orden_trabajo_offset SET ${detalleFields.join(', ')}, updated_at = NOW() WHERE orden_trabajo_id = $${index}`,
            detalleValues
          );
        }

        if (estadoId !== null) {
          const historyNote = notaNormalizada || null;
          try {
            if (isDigitalOrder) {
              await estadoDigitalRepo.createHistory(id, estadoId, req.user?.id ?? null, historyNote);
            } else {
              await estadoOffsetRepo.createHistory(id, estadoId, req.user?.id ?? null, historyNote);
            }
          } catch (historyError: any) {
            console.warn('No se pudo registrar historial de estado:', historyError?.message || historyError);
          }
        }

        res.json({ success: true, orden: updatedOrder });
      } catch (error: any) {
        console.error('Error al actualizar estado de producción:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar estado de producción', details: error.message });
      }
    }
  );

  // Alias compatible con la ruta legacy de workflow
  router.put(
    '/produccion/workflow/:id/cambiar-estado',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      req.params.id = String(req.params.id);
      return res.status(307).redirect(`/api/ordenTrabajo/produccion/${req.params.id}/estado`);
    }
  );

  // PUT /ordenTrabajo/:id/vincular-cotizacion - Vincular cotización a orden
  router.put(
    '/:id/vincular-cotizacion',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const { id } = req.params;
        const { cotizacion_id } = req.body;
        const userId = req.user?.id || null;

        if (!Number.isInteger(parseInt(cotizacion_id, 10)) || parseInt(cotizacion_id, 10) <= 0) {
          return res.status(400).json({ error: 'cotizacion_id inválido' });
        }

        // Verificar que la cotización existe
        const cotizacion = await cotizacionAuxRepo.getDatosCotizacion(parseInt(cotizacion_id, 10));
        if (!cotizacion) {
          return res.status(404).json({ error: 'Cotización no encontrada' });
        }

        const useCase = new VincularCotizacionUseCase(ordenCommandRepo);
        await useCase.execute(parseInt(id, 10), parseInt(cotizacion_id, 10), userId || 0);

        res.json({ 
          success: true, 
          message: 'Cotización vinculada correctamente',
          cotizacion 
        });
      } catch (error: any) {
        console.error('Error al vincular cotización:', error);
        res.status(500).json({ error: 'Error al vincular cotización' });
      }
    }
  );

  // Montar rutas de digital y offset
  router.use('/digital', createOrdenDigitalRoutes(client));
  router.use('/offset', createOrdenOffsetRoutes(client));

  console.log('✅ [Órdenes Trabajo] Módulo limpio registrado (shared endpoints)');

  return router;
}
