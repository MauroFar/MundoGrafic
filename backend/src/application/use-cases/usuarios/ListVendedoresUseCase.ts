import { UsuarioRepository } from "../../../domain/repositories/usuarios/UsuarioRepository";

export class ListVendedoresUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute() {
    return this.usuarioRepository.findVendedores();
  }
}
