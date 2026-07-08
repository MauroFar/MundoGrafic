import { AppError } from "../../../shared/errors/AppError";
import { UsuarioRepository } from "../../../domain/repositories/usuarios/UsuarioRepository";

export class GetUsuarioFirmaUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de usuario invalido", 400);
    }

    return this.usuarioRepository.findFirmaById(id);
  }
}
