// Configuración de la API

const ENV_BASE_URL = import.meta.env.VITE_API_URL as string | undefined;

function deriveFallbackBaseUrl(): string | undefined {
  try {
    const current = window?.location?.origin;
    if (!current) return undefined;
    const url = new URL(current);
    return `${url.protocol}//${url.hostname}:3002`;
  } catch {
    return undefined;
  }
}

export interface ApiConfig {
  BASE_URL: string;
  ENDPOINTS: {
    AUTH: {
      LOGIN: string;
      LOGOUT: string;
      VERIFY: string;
    };
    USUARIOS: string;
    AREAS: string;
    COTIZACIONES: string;
    ORDENES_TRABAJO: string;
    FIRMAS: string;
  };
}

export const API_CONFIG: ApiConfig = {
  BASE_URL: ENV_BASE_URL ?? deriveFallbackBaseUrl() ?? "http://186.33.129.130:3002",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      LOGOUT: "/api/auth/logout",
      VERIFY: "/api/auth/verify",
    },
    USUARIOS: "/api/usuarios",
    AREAS: "/api/areas",
    COTIZACIONES: "/api/cotizaciones",
    ORDENES_TRABAJO: "/api/ordenes-trabajo",
    FIRMAS: "/api/firmas",
  },
};

export const buildApiUrl = (endpoint: string): string =>
  `${API_CONFIG.BASE_URL}${endpoint}`;
