import { Client } from "pg";
import { createAuthRoutes } from "../presentation/routes/auth/authRoutes";

/**
 * Punto de montaje de autenticación.
 * La implementación vive en presentation/routes/auth/authRoutes.ts (Clean Architecture).
 */
export default (client: Client) => createAuthRoutes(client);
