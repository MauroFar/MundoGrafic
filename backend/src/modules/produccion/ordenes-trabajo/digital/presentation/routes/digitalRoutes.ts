import { Router } from 'express';
import { Client } from 'pg';
import authRequired from '../../../../../../middleware/auth';
import checkPermission from '../../../../../../middleware/checkPermission';
import { PgOrdenDigitalRepository } from '../../infrastructure/persistence/PgOrdenDigitalRepository';
import { PgProductoDigitalRepository } from '../../infrastructure/persistence/PgProductoDigitalRepository';
import { PgEstadoOrdenDigitalRepository } from '../../infrastructure/persistence/PgEstadoOrdenDigitalRepository';
import { CreateDetalleDigitalUseCase } from '../../application/use-cases/CreateDetalleDigitalUseCase';
import { GetDetalleDigitalUseCase } from '../../application/use-cases/GetDetalleDigitalUseCase';
import { CreateProductoDigitalUseCase } from '../../application/use-cases/CreateProductoDigitalUseCase';
import { GetProductosDigitalUseCase } from '../../application/use-cases/GetProductosDigitalUseCase';
import { ChangeDigitalEstadoUseCase } from '../../application/use-cases/ChangeDigitalEstadoUseCase';
import { GetDigitalEstadoHistorialUseCase } from '../../application/use-cases/GetDigitalEstadoHistorialUseCase';
import { CancelDigitalProduccionUseCase } from '../../application/use-cases/CancelDigitalProduccionUseCase';

export function createOrdenDigitalRoutes(client: Client) {
  const router = Router({ mergeParams: true });
  const detalleRepo = new PgOrdenDigitalRepository(client);
  const productoRepo = new PgProductoDigitalRepository(client);
  const estadoRepo = new PgEstadoOrdenDigitalRepository(client);

  router.get(
    '/estados',
    authRequired(),
    checkPermission(client, 'ordenes_trabajo', 'leer'),
    async (req, res) => {
      try {
        const estados = await estadoRepo.getActiveStates();
        res.json(estados);
      } catch (error: any) {
        console.error('Error obteniendo estados digitales:', error);
        res.status(500).json({ error: 'Error obteniendo estados digitales' });
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
        const useCase = new CreateDetalleDigitalUseCase(detalleRepo);
        const created = await useCase.execute(input);
        res.status(201).json(created);
      } catch (error: any) {
        console.error('Error creando detalle digital:', error);
        res.status(500).json({ error: 'Error creando detalle digital' });
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
        const useCase = new GetDetalleDigitalUseCase(detalleRepo);
        const detalle = await useCase.execute(ordenId);
        if (!detalle) return res.status(404).json({ error: 'Detalle no encontrado' });
        res.json(detalle);
      } catch (error: any) {
        console.error('Error obteniendo detalle digital:', error);
        res.status(500).json({ error: 'Error obteniendo detalle digital' });
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
        const useCase = new CreateProductoDigitalUseCase(productoRepo);
        const created = await useCase.execute(input);
        res.status(201).json(created);
      } catch (error: any) {
        console.error('Error creando producto digital:', error);
        res.status(500).json({ error: 'Error creando producto digital' });
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
        const useCase = new GetProductosDigitalUseCase(productoRepo);
        const productos = await useCase.execute(ordenId);
        res.json(productos);
      } catch (error: any) {
        console.error('Error listando productos digitales:', error);
        res.status(500).json({ error: 'Error listando productos digitales' });
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
        const useCase = new ChangeDigitalEstadoUseCase(estadoRepo);
        const result = await useCase.execute(
          ordenId,
          estado,
          req.user?.id ?? null,
          nota
        );
        res.json(result);
      } catch (error: any) {
        console.error('Error cambiando estado digital:', error);
        res.status(500).json({ error: 'Error cambiando estado digital' });
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
        const useCase = new GetDigitalEstadoHistorialUseCase(estadoRepo);
        const historial = await useCase.execute(ordenId);
        res.json(historial);
      } catch (error: any) {
        console.error('Error obteniendo historial de estado digital:', error);
        res.status(500).json({ error: 'Error obteniendo historial de estado digital' });
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

        const useCase = new CancelDigitalProduccionUseCase(estadoRepo);
        const result = await useCase.execute(
          ordenId,
          String(motivo_cancelacion).trim(),
          req.user?.id ?? null
        );
        res.json({ success: true, ...result });
      } catch (error: any) {
        console.error('Error cancelando producción digital:', error);
        res.status(500).json({ error: 'Error cancelando producción digital' });
      }
    }
  );

  return router;
}
