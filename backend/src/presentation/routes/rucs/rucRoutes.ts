import { Router } from "express";
import { Client } from "pg";
import { PgRucRepository } from "../../../infrastructure/persistence/repositories/rucs/PgRucRepository";
import { ListRucsUseCase } from "../../../application/use-cases/rucs/ListRucsUseCase";

export const createRucRoutes = (client: Client) => {
  const router = Router();

  const repo       = new PgRucRepository(client);
  const listRucs   = new ListRucsUseCase(repo);

  router.get("/", async (_req, res: any) => {
    try {
      res.json(await listRucs.execute());
    } catch (err: any) {
      console.error("Error al obtener los RUCs:", err);
      res.status(500).json({ error: "Error al obtener los datos" });
    }
  });

  return router;
};
