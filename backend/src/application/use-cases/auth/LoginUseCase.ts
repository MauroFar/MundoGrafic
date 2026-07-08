import bcrypt from "bcryptjs";
import { AuthUserRepository } from "../../../domain/repositories/auth/AuthUserRepository";
import { LoginCredentials } from "../../../domain/entities/auth/LoginCredentials";
import { AuthenticatedUser } from "../../../domain/entities/auth/AuthenticatedUser";

export interface TokenPayload extends AuthenticatedUser {}

export interface TokenService {
  sign(payload: TokenPayload): string;
}

export interface LoginResult {
  token: string;
  user: AuthenticatedUser;
}

export class LoginUseCase {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(credentials: LoginCredentials): Promise<LoginResult> {
    const loginIdentifier = credentials.email.trim();
    const userRecord = await this.authUserRepository.findByLoginIdentifier(loginIdentifier);

    if (!userRecord) {
      throw new Error("Usuario no encontrado");
    }

    const passwordIsValid = await bcrypt.compare(credentials.password, userRecord.password_hash);
    if (!passwordIsValid) {
      throw new Error("Contraseña incorrecta");
    }

    const user: AuthenticatedUser = {
      id: userRecord.id,
      rol: userRecord.rol,
      nombre: userRecord.nombre,
      email: userRecord.email,
      celular: userRecord.celular,
    };

    const token = this.tokenService.sign(user);

    return {
      token,
      user,
    };
  }
}
