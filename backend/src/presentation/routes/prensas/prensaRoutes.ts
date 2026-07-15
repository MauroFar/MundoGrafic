import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import { PgPrensaRepository } from "../../../infrastructure/persistence/repositories/prensas/PgPrensaRepository";
import { ListPrensasUseCase } from "../../../application/use-cases/prensas/ListPrensasUseCase";
import { CreatePrensaUseCase } from "../../../application/use-cases/prensas/CreatePrensaUseCase";
import { UpdatePrensaUseCase } from "../../../application/use-cases/prensas/UpdatePrensaUseCase";
import { DeactivatePrensaUseCase } from "../../../application/use-cases/prensas/DeactivatePrensaUseCase";
import { PrensaController } from "../../controllers/prensas/PrensaController";

export const createPrensaRoutes = (client: Client) => {
  const router = Router();

  const repo             = new PgPrensaRepository(client);
  const listUseCase      = new ListPrensasUseCase(repo);
  const createUseCase    = new CreatePrensaUseCase(repo);
  const updateUseCase    = new UpdatePrensaUseCase(repo);
  const deactivateUseCase = new DeactivatePrensaUseCase(repo);
  const controller       = new PrensaController(listUseCase, createUseCase, updateUseCase, deactivateUseCase);

  router.get("/",       authRequired(), controller.listar);
  router.get("/todas",  authRequired(), controller.listarTodas);
  router.post("/",      authRequired(), controller.crear);
  router.put("/:id",    authRequired(), controller.editar);
  router.delete("/:id", authRequired(), controller.desactivar);

  return router;
};
