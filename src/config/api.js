// Configuración de la API
const ENV_BASE_URL = import.meta?.env?.VITE_API_URL;

// Fallback seguro: si no hay VITE_API_URL, intenta usar el mismo host con puerto 3002
// Ej.: si la app corre en http://192.168.1.50:3001, el backend sería http://192.168.1.50:3002
function deriveFallbackBaseUrl() {
  try {
    const current = window?.location?.origin;
    if (!current) return undefined;
    const url = new URL(current);
    const host = url.hostname;
    return `${url.protocol}//${host}:3002`;
  } catch (_) {
    return undefined;
  }
}

export const API_CONFIG = {
  BASE_URL: ENV_BASE_URL || deriveFallbackBaseUrl() || 'http://186.33.129.130:3002',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      VERIFY: '/api/auth/verify'
    },
    USUARIOS: '/api/usuarios',
    AREAS: '/api/areas',
    COTIZACIONES: '/api/cotizaciones',
    ORDENES_TRABAJO: '/api/ordenes-trabajo',
    FIRMAS: '/api/firmas'
  }
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
