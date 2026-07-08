import { Client } from "pg";
import { AuthUserRecord, AuthUserRepository } from "../../../../domain/repositories/auth/AuthUserRepository";

export class PgAuthUserRepository implements AuthUserRepository {
  constructor(private readonly client: Client) {}

  async findByLoginIdentifier(loginIdentifier: string): Promise<AuthUserRecord | null> {
    const result = await this.client.query(
      "SELECT id, rol, nombre, email, celular, password_hash, nombre_usuario FROM usuarios WHERE email = $1 OR nombre_usuario = $1 LIMIT 1",
      [loginIdentifier],
    );

    return result.rows[0] ?? null;
  }
}
