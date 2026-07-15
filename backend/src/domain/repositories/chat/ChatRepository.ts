import { ChatUsuario } from "../../entities/chat/ChatUsuario";

export interface ChatRepository {
  findUsuariosActivos(): Promise<ChatUsuario[]>;
}
