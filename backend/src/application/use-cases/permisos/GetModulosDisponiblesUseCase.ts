import { PermisoRepository } from "../../../domain/repositories/permisos/PermisoRepository";
import { ADMIN_PANEL_MODULES } from "../../../config/permissionCatalog";

export class GetModulosDisponiblesUseCase {
  constructor(private readonly repo: PermisoRepository) {}

  async execute(userId: number, rolJwt: string) {
    if (rolJwt === "admin")
      return { esAdmin: true, modulos: ADMIN_PANEL_MODULES };

    const esAdmin = await this.repo.isAdmin(userId);
    if (esAdmin)
      return { esAdmin: true, modulos: ADMIN_PANEL_MODULES };

    const modulos = await this.repo.findModulosDisponibles(userId);
    return { esAdmin: false, modulos };
  }
}
