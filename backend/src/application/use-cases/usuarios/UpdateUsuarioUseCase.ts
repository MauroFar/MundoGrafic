import { AppError } from "../../../shared/errors/AppError";
import { PasswordHasher } from "../../ports/security/PasswordHasher";
import {
  UpdateUsuarioRepositoryInput,
  UsuarioRepository,
} from "../../../domain/repositories/usuarios/UsuarioRepository";
import { buildEmailConfig, ensureAreaIds } from "./usuarioInputUtils";

export interface UpdateUsuarioInput {
  email: string;
  nombre_usuario: string;
  nombre: string;
  apellido?: string | null;
  rol: string;
  area_id?: number | string | null;
  area_ids?: Array<number | string>;
  activo: boolean;
  password?: string | null;
  email_personal?: string | null;
  celular?: string | null;
}

export class UpdateUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(id: number, input: UpdateUsuarioInput) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de usuario invalido", 400);
    }

    const areaIds = ensureAreaIds(input.area_ids, input.area_id);
    const trimmedPassword = input.password ? String(input.password).trim() : "";

    let passwordHash: string | null = null;
    if (trimmedPassword) {
      passwordHash = await this.passwordHasher.hash(trimmedPassword);
    }

    const payload: UpdateUsuarioRepositoryInput = {
      id,
      email: String(input.email || "").trim(),
      nombre_usuario: String(input.nombre_usuario || "").trim(),
      nombre: String(input.nombre || "").trim(),
      apellido: input.apellido ? String(input.apellido).trim() : null,
      rol: String(input.rol || "").trim(),
      area_ids: areaIds,
      activo: Boolean(input.activo),
      password_hash: passwordHash,
      email_personal: input.email_personal ? String(input.email_personal).trim() : null,
      email_config: buildEmailConfig(input.nombre, input.email_personal),
      celular: input.celular ? String(input.celular).trim() : null,
    };

    return this.usuarioRepository.updateUser(payload);
  }
}
