import { AppError } from "../../../shared/errors/AppError";
import { PermisoRepository } from "../../../domain/repositories/permisos/PermisoRepository";
import { PermisoUpsertInput } from "../../../domain/entities/permisos/Permiso";
import { isValidCrudModule } from "../../../config/permissionCatalog";

export class UpdatePermisosUsuarioUseCase {
  constructor(private readonly repo: PermisoRepository) {}

  async execute(usuarioId: number, permisos: any[]) {
    if (!Array.isArray(permisos))
      throw new AppError("Formato de permisos inválido", 400);

    const invalidos = permisos
      .map((p: any) => p?.modulo)
      .filter((m: string) => !isValidCrudModule(m));

    if (invalidos.length)
      throw new AppError(
        `Módulos no permitidos: ${[...new Set(invalidos)].join(", ")}`,
        400
      );

    const input: PermisoUpsertInput[] = permisos.map((p: any) => ({
      modulo:          p.modulo,
      puede_crear:     p.puede_crear     || false,
      puede_leer:      p.puede_leer      || false,
      puede_editar:    p.puede_editar    || false,
      puede_eliminar:  p.puede_eliminar  || false,
    }));

    await this.repo.replaceAll(usuarioId, input);
  }
}
