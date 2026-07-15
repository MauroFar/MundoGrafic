import { Ruc } from "../../entities/rucs/Ruc";

export interface RucRepository {
  findAll(): Promise<Ruc[]>;
}
