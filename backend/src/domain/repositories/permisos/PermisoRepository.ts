import { Permiso, PermisoUpsertInput } from "../../entities/permisos/Permiso";

export interface PermisoRepository {
  findByUsuario(usuarioId: number): Promise<Permiso[]>;
  replaceAll(usuarioId: number, permisos: PermisoUpsertInput[]): Promise<void>;
  findModulosDisponibles(userId: number): Promise<string[]>;
  isAdmin(userId: number): Promise<boolean>;
  tienePermiso(userId: number, modulo: string, accion: string): Promise<boolean>;
}
