import { Prensa, PrensaCreateInput, PrensaUpdateInput } from "../../entities/prensas/Prensa";

export interface PrensaRepository {
  findAllActive(): Promise<Prensa[]>;
  findAll(): Promise<Prensa[]>;
  findById(id: number): Promise<Prensa | null>;
  existsByNombre(nombre: string, excludeId?: number): Promise<boolean>;
  create(input: PrensaCreateInput): Promise<Prensa>;
  update(input: PrensaUpdateInput): Promise<Prensa | null>;
  deactivate(id: number): Promise<Prensa | null>;
}
