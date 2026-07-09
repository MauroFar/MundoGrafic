import { Router } from 'express';
import { Client } from 'pg';
import authRequired from '../../../../../../middleware/auth';
import checkPermission from '../../../../../../middleware/checkPermission';
import { PgOrdenOffsetRepository } from '../../infrastructure/persistence/PgOrdenOffsetRepository';
import { PgProductoOffsetRepository } from '../../infrastructure/persistence/PgProductoOffsetRepository';
import { PgEstadoOrdenOffsetRepository } from '../../infrastructure/persistence/PgEstadoOrdenOffsetRepository';
import { CreateDetalleOffsetUseCase } from '../../application/use-cases/CreateDetalleOffsetUseCase';
import { GetDetalleOffsetUseCase } from '../../application/use-cases/GetDetalleOffsetUseCase';
import { CreateProductoOffsetUseCase } from '../../application/use-cases/CreateProductoOffsetUseCase';
import { GetProductosOffsetUseCase } from '../../application/use-cases/GetProductosOffsetUseCase';
import { ChangeOffsetEstadoUseCase } from '../../application/use-cases/ChangeOffsetEstadoUseCase';
import { GetOffsetEstadoHistorialUseCase } from '../../application/use-cases/GetOffsetEstadoHistorialUseCase';
import { CancelOffsetProduccionUseCase } from '../../application/use-cases/CancelOffsetProduccionUseCase';

export function createOrdenOffsetRoutes(client: Client) {
  const router = Router({ mergeParams: true });
  const detalleRepo = new PgOrdenOffsetRepository(client);
  const productoRepo = new PgProductoOffsetRepository(client);
  const estadoRepo = new PgEstadoOrdenOffsetRepository(client);

  router.get(
    '/estados',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const estados = await estadoRepo.getActiveStates();
        res.json(estados);
      } catch (error: any) {
        console.error('Error obteniendo estados offset:', error);
        res.status(500).json({ error: 'Error obteniendo estados offset' });
      }
    }
  );

  router.post(
    '/:ordenId/detalle',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const ordenId = parseInt(req.params.ordenId, 10);
        const input = { ...req.body, orden_trabajo_id: ordenId };
        const useCase = new CreateDetalleOffsetUseCase(detalleRepo);
        const created = await useCase.execute(input);
        res.status(201).json(created);
      } catch (error: any) {
        console.error('Error creando detalle offset:', error);
        res.status(500).json({ error: 'Error creando detalle offset' });
      }
    }
  );

  router.get(
    '/:ordenId/detalle',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const ordenId = parseInt(req.params.ordenId, 10);
        const useCase = new GetDetalleOffsetUseCase(detalleRepo);
        const detalle = await useCase.execute(ordenId);
        if (!detalle) return res.status(404).json({ error: 'Detalle no encontrado' });
        res.json(detalle);
      } catch (error: any) {
        console.error('Error obteniendo detalle offset:', error);
        res.status(500).json({ error: 'Error obteniendo detalle offset' });
      }
    }
  );

  router.post(
    '/:ordenId/productos',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const ordenId = parseInt(req.params.ordenId, 10);
        const input = { ...req.body, orden_trabajo_id: ordenId };
        const useCase = new CreateProductoOffsetUseCase(productoRepo);
        const created = await useCase.execute(input);
        res.status(201).json(created);
      } catch (error: any) {
        console.error('Error creando producto offset:', error);
        res.status(500).json({ error: 'Error creando producto offset' });
      }
    }
  );

  router.get(
    '/:ordenId/productos',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const ordenId = parseInt(req.params.ordenId, 10);
        const useCase = new GetProductosOffsetUseCase(productoRepo);
        const productos = await useCase.execute(ordenId);
        res.json(productos);
      } catch (error: any) {
        console.error('Error listando productos offset:', error);
        res.status(500).json({ error: 'Error listando productos offset' });
      }
    }
  );

  router.post(
    '/:ordenId/estado',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const ordenId = parseInt(req.params.ordenId, 10);
        const { estado, nota } = req.body;
        const useCase = new ChangeOffsetEstadoUseCase(estadoRepo);
        const result = await useCase.execute(
          ordenId,
          estado,
          req.user?.id ?? null,
          nota
        );
        res.json(result);
      } catch (error: any) {
        console.error('Error cambiando estado offset:', error);
        res.status(500).json({ error: 'Error cambiando estado offset' });
      }
    }
  );

  router.get(
    '/:ordenId/estado/historial',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const ordenId = parseInt(req.params.ordenId, 10);
        const useCase = new GetOffsetEstadoHistorialUseCase(estadoRepo);
        const historial = await useCase.execute(ordenId);
        res.json(historial);
      } catch (error: any) {
        console.error('Error obteniendo historial de estado offset:', error);
        res.status(500).json({ error: 'Error obteniendo historial de estado offset' });
      }
    }
  );

  router.put(
    '/:ordenId/cancelar-produccion',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'editar'),
    async (req, res) => {
      try {
        const ordenId = parseInt(req.params.ordenId, 10);
        const { motivo_cancelacion } = req.body;

        if (!motivo_cancelacion || String(motivo_cancelacion).trim() === '') {
          return res.status(400).json({ error: 'El motivo de cancelación es obligatorio' });
        }

        const useCase = new CancelOffsetProduccionUseCase(estadoRepo);
        const result = await useCase.execute(
          ordenId,
          String(motivo_cancelacion).trim(),
          req.user?.id ?? null
        );
        res.json({ success: true, ...result });
      } catch (error: any) {
        console.error('Error cancelando producción offset:', error);
        res.status(500).json({ error: 'Error cancelando producción offset' });
      }
    }
  );

  return router;
}
