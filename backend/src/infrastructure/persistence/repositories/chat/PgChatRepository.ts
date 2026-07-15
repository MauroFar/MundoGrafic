import { Client } from "pg";
import { ChatRepository } from "../../../../domain/repositories/chat/ChatRepository";
import { ChatUsuario } from "../../../../domain/entities/chat/ChatUsuario";

export class PgChatRepository implements ChatRepository {
  constructor(private readonly client: Client) {}

  async findUsuariosActivos(): Promise<ChatUsuario[]> {
    const r = await this.client.query(
      "SELECT id, nombre, email, nombre_usuario, rol FROM usuarios WHERE activo = true",
    );
    return r.rows;
  }
}
