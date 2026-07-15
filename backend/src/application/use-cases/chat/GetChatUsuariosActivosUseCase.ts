import { ChatRepository } from "../../../domain/repositories/chat/ChatRepository";

export class GetChatUsuariosActivosUseCase {
  constructor(private readonly repo: ChatRepository) {}

  async execute() {
    return this.repo.findUsuariosActivos();
  }
}
