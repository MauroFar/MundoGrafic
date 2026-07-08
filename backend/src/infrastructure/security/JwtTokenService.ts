import jwt from "jsonwebtoken";
import { TokenPayload, TokenService } from "../../application/use-cases/auth/LoginUseCase";
import { getJwtSecret } from "../../shared/security/jwtConfig";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "8h") as jwt.SignOptions["expiresIn"];

export class JwtTokenService implements TokenService {
  sign(payload: TokenPayload): string {
    return jwt.sign(payload, getJwtSecret(), {
      expiresIn: JWT_EXPIRES_IN,
    });
  }
}
