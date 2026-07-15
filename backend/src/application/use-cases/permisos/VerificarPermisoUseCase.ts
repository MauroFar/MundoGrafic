import { PermisoRepository } from "../../../domain/repositories/permisos/PermisoRepository";

export class VerificarPermisoUseCase {
  constructor(private readonly repo: PermisoRepository) {}

  async execute(userId: number, modulo: string, accion: string, esAdmin: boolean) {
    if (esAdmin) return true;
    return this.repo.tienePermiso(userId, modulo, accion);
  }
}
