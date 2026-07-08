import bcrypt from "bcryptjs";
import { PasswordHasher } from "../../application/ports/security/PasswordHasher";

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
  }
}
