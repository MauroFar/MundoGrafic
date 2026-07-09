import { Rol, RolCreateInput, RolUpdateInput } from "../../entities/roles/Rol";

export interface RolRepository {
  findActive(): Promise<Array<Pick<Rol, "id" | "nombre" | "descripcion">>>;
  findAll(): Promise<Rol[]>;
  findById(id: number): Promise<Rol | null>;
  create(input: RolCreateInput): Promise<Rol>;
  update(input: RolUpdateInput): Promise<Rol | null>;
  softDelete(id: number): Promise<boolean>;
  existsByName(nombre: string, excludeId?: number): Promise<boolean>;
  countUsersByRol(id: number): Promise<number>;
}
