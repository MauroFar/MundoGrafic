import { AppError } from "../../../shared/errors/AppError";
import { PasswordHasher } from "../../ports/security/PasswordHasher";
import {
  CreateUsuarioRepositoryInput,
  UsuarioRepository,
} from "../../../domain/repositories/usuarios/UsuarioRepository";
import { buildEmailConfig, ensureAreaIds } from "./usuarioInputUtils";

export interface CreateUsuarioInput {
  email: string;
  nombre_usuario: string;
  password: string;
  nombre: string;
  apellido?: string | null;
  rol: string;
  area_id?: number | string | null;
  area_ids?: Array<number | string>;
  email_personal?: string | null;
  celular?: string | null;
}

export class CreateUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUsuarioInput) {
    const normalizedAreaIds = ensureAreaIds(input.area_ids, input.area_id);

    if (!input.password || !String(input.password).trim()) {
      throw new AppError("La contraseña es obligatoria", 400);
    }

    const passwordHash = await this.passwordHasher.hash(String(input.password));

    const payload: CreateUsuarioRepositoryInput = {
      email: String(input.email || "").trim(),
      nombre_usuario: String(input.nombre_usuario || "").trim(),
      password_hash: passwordHash,
      nombre: String(input.nombre || "").trim(),
      apellido: input.apellido ? String(input.apellido).trim() : null,
      rol: String(input.rol || "").trim(),
      area_ids: normalizedAreaIds,
      email_personal: input.email_personal ? String(input.email_personal).trim() : null,
      email_config: buildEmailConfig(input.nombre, input.email_personal),
      celular: input.celular ? String(input.celular).trim() : null,
    };

    return this.usuarioRepository.createUser(payload);
  }
}
