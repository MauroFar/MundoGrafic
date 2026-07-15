import { API_CONFIG, buildApiUrl } from "../config/api";

const loginUrl = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN);

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  [key: string]: unknown;
}

interface AuthResult {
  token: string;
  user: AuthUser;
}

export async function loginRequest({ email, password }: LoginPayload): Promise<AuthResult> {
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error ?? "Credenciales incorrectas. Intenta nuevamente.");
  }

  return data as AuthResult;
}

export function persistSession(authResult: AuthResult): void {
  const { token, user } = authResult;

  if (!token || !user) {
    throw new Error("Respuesta de autenticacion invalida");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("rol", user.rol ?? "");
  localStorage.setItem("nombre", user.nombre ?? "");

  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    // Storage best-effort for user profile cache.
  }
}
