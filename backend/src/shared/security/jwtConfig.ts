const DEV_FALLBACK_JWT_SECRET = "dev-local-jwt-secret-change-me";
let warnedDevFallback = false;

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    if (!warnedDevFallback) {
      console.warn("[AUTH] JWT_SECRET no esta configurado. Usando secreto de desarrollo temporal.");
      warnedDevFallback = true;
    }
    return DEV_FALLBACK_JWT_SECRET;
  }

  throw new Error("JWT_SECRET no esta configurado en produccion");
};
