import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { LoginUseCase } from "../../../application/use-cases/auth/LoginUseCase";

export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError("Email y contraseña son obligatorios", 400);
      }

      const result = await this.loginUseCase.execute({
        email: String(email),
        password: String(password),
      });

      res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : "Error interno del servidor";
      return res.status(500).json({ error: message });
    }
  };
}
