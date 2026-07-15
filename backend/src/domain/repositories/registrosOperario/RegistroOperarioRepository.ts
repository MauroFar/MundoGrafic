import { RegistroOperario, RegistroOperarioCreateInput, RegistroOperarioFilters } from "../../entities/registrosOperario/RegistroOperario";

export interface RegistroOperarioRepository {
  findByFilters(filters: RegistroOperarioFilters): Promise<RegistroOperario[]>;
  create(input: RegistroOperarioCreateInput): Promise<RegistroOperario>;
}
