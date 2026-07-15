import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import { PgChatRepository } from "../../../infrastructure/persistence/repositories/chat/PgChatRepository";
import { GetChatUsuariosActivosUseCase } from "../../../application/use-cases/chat/GetChatUsuariosActivosUseCase";
import { ChatController } from "../../controllers/chat/ChatController";

export const createChatRoutes = (client: Client) => {
  const router = Router();

  const repo       = new PgChatRepository(client);
  const useCase    = new GetChatUsuariosActivosUseCase(repo);
  const controller = new ChatController(useCase);

  router.get("/usuarios", authRequired(), controller.getUsuarios);

  return router;
};
