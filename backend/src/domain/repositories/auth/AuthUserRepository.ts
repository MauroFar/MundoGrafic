import { AuthenticatedUser } from "../../entities/auth/AuthenticatedUser";

export interface AuthUserRecord extends AuthenticatedUser {
  password_hash: string;
  nombre_usuario: string | null;
}

export interface AuthUserRepository {
  findByLoginIdentifier(loginIdentifier: string): Promise<AuthUserRecord | null>;
}
