import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import { PgRegistroOperarioRepository } from "../../../infrastructure/persistence/repositories/registrosOperario/PgRegistroOperarioRepository";
import { ListRegistrosOperarioUseCase } from "../../../application/use-cases/registrosOperario/ListRegistrosOperarioUseCase";
import { CreateRegistroOperarioUseCase } from "../../../application/use-cases/registrosOperario/CreateRegistroOperarioUseCase";
import { RegistroOperarioController } from "../../controllers/registrosOperario/RegistroOperarioController";

export const createRegistroOperarioRoutes = (client: Client) => {
  const router = Router();

  const repo          = new PgRegistroOperarioRepository(client);
  const listUseCase   = new ListRegistrosOperarioUseCase(repo);
  const createUseCase = new CreateRegistroOperarioUseCase(repo);
  const controller    = new RegistroOperarioController(listUseCase, createUseCase);

  const roles = ["admin", "ejecutivo", "impresion", "usuario"] as string[];

  router.get("/",  authRequired(roles), controller.listar);
  router.post("/", authRequired(roles), controller.crear);

  return router;
};
