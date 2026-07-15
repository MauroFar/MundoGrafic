import { Client } from "pg";
import { RucRepository } from "../../../../domain/repositories/rucs/RucRepository";
import { Ruc } from "../../../../domain/entities/rucs/Ruc";

export class PgRucRepository implements RucRepository {
  constructor(private readonly client: Client) {}

  async findAll(): Promise<Ruc[]> {
    const r = await this.client.query(
      "SELECT id, ruc, descripcion FROM rucs ORDER BY ruc"
    );
    return r.rows;
  }
}
