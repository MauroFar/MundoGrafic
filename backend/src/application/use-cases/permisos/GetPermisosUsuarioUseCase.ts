import { PermisoRepository } from "../../../domain/repositories/permisos/PermisoRepository";
import { getCrudModuleIds } from "../../../config/permissionCatalog";

export class GetPermisosUsuarioUseCase {
  constructor(private readonly repo: PermisoRepository) {}

  async execute(userId: number, esAdminJwt: boolean) {
    if (esAdminJwt) {
      return getCrudModuleIds().map(modulo => ({
        modulo,
        puede_crear: true,
        puede_leer: true,
        puede_editar: true,
        puede_eliminar: true,
      }));
    }
    return this.repo.findByUsuario(userId);
  }
}
