import { UsuarioRepository } from "../../../domain/repositories/usuarios/UsuarioRepository";

export class ListUsuariosUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute() {
    return this.usuarioRepository.findAll();
  }
}
