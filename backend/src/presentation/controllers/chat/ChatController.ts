import { Request, Response } from "express";
import { GetChatUsuariosActivosUseCase } from "../../../application/use-cases/chat/GetChatUsuariosActivosUseCase";

export class ChatController {
  constructor(
    private readonly getUsuariosActivosUseCase: GetChatUsuariosActivosUseCase,
  ) {}

  getUsuarios = async (_req: Request, res: Response) => {
    try {
      const usuarios = await this.getUsuariosActivosUseCase.execute();
      res.json(usuarios);
    } catch (err: any) {
      console.error("Error al obtener usuarios del chat:", err);
      res.status(500).json({ error: "Error al obtener los usuarios del chat" });
    }
  };
}
