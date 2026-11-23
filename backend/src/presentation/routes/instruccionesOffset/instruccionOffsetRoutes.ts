import { Router } from 'express';
import { Client } from 'pg';
import authRequired from '../../../middleware/auth';
import { PgInstruccionOffsetRepository } from '../../../infrastructure/persistence/repositories/instruccionesOffset/PgInstruccionOffsetRepository';
import { CreateInstruccionOffsetUseCase } from '../../../application/use-cases/instruccionesOffset/CreateInstruccionOffsetUseCase';
import { ListInstruccionesOffsetUseCase } from '../../../application/use-cases/instruccionesOffset/ListInstruccionesOffsetUseCase';
import { InstruccionOffsetController } from '../../controllers/instruccionesOffset/InstruccionOffsetController';

export const createInstruccionOffsetRoutes = (client: Client) => {
  const router = Router();
  const repo = new PgInstruccionOffsetRepository(client);
  const controller = new InstruccionOffsetController(
    new ListInstruccionesOffsetUseCase(repo),
    new CreateInstruccionOffsetUseCase(repo),
  );

  router.get('/:categoria', authRequired(), controller.listar);
  router.post('/:categoria', authRequired(), controller.crear);

  return router;
};
