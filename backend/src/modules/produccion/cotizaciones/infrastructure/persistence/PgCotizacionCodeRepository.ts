import { Client } from "pg";
import { CotizacionCodeRepository } from "../../domain/repositories/CotizacionCodeRepository";

export class PgCotizacionCodeRepository implements CotizacionCodeRepository {
  constructor(private readonly client: Client) {}

  async getNextCotizacionCode(): Promise<string> {
    try {
      const query = "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM cotizaciones";
      const result = await this.client.query(query);
      const nextId = Number(result.rows[0]?.next_id || 1);
      return String(nextId).padStart(9, "0");
    } catch (_) {
      return "000000001";
    }
  }
}
