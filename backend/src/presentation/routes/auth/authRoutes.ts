import { Router } from "express";
import { Client } from "pg";
import { AuthController } from "../../controllers/auth/AuthController";
import { LoginUseCase } from "../../../application/use-cases/auth/LoginUseCase";
import { PgAuthUserRepository } from "../../../infrastructure/persistence/repositories/auth/PgAuthUserRepository";
import { JwtTokenService } from "../../../infrastructure/security/JwtTokenService";

export const createAuthRoutes = (client: Client) => {
  const router = Router();
  const authUserRepository = new PgAuthUserRepository(client);
  const tokenService = new JwtTokenService();
  const loginUseCase = new LoginUseCase(authUserRepository, tokenService);
  const authController = new AuthController(loginUseCase);

  router.post("/login", authController.login);

  return router;
};
