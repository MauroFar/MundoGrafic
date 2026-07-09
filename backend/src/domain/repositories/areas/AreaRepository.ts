import { Area, AreaCreateInput, AreaUpdateInput } from "../../entities/areas/Area";

export interface AreaRepository {
  findActive(): Promise<Array<Pick<Area, "id" | "nombre" | "descripcion">>>;
  findAll(): Promise<Area[]>;
  findById(id: number): Promise<Area | null>;
  create(input: AreaCreateInput): Promise<Area>;
  update(input: AreaUpdateInput): Promise<Area | null>;
  softDelete(id: number): Promise<boolean>;
  existsByName(nombre: string, excludeId?: number): Promise<boolean>;
  countUsersByArea(id: number): Promise<number>;
}
