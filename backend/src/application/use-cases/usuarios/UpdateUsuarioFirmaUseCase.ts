import { AppError } from "../../../shared/errors/AppError";
import { UsuarioRepository } from "../../../domain/repositories/usuarios/UsuarioRepository";

export interface UpdateUsuarioFirmaInput {
  firma_html: string | null;
  firma_activa: boolean;
}

export class UpdateUsuarioFirmaUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(id: number, input: UpdateUsuarioFirmaInput) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de usuario invalido", 400);
    }

    return this.usuarioRepository.updateFirma(id, {
      firma_html: input.firma_html,
      firma_activa: Boolean(input.firma_activa),
    });
  }
}
