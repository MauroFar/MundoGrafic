import { API_CONFIG, buildApiUrl } from "../config/api";

const loginUrl = buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN);

export async function loginRequest({ email, password }) {
  const response = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Credenciales incorrectas. Intenta nuevamente.");
  }

  return data;
}

export function persistSession(authResult) {
  const token = authResult?.token;
  const user = authResult?.user;

  if (!token || !user) {
    throw new Error("Respuesta de autenticacion invalida");
  }

  localStorage.setItem("token", token);
  localStorage.setItem("rol", user.rol || "");
  localStorage.setItem("nombre", user.nombre || "");

  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (_) {
    // Storage best-effort for user profile cache.
  }
}
