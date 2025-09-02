// Configuración de la API
export const API_CONFIG = {
  // URL del backend - cambiar según el entorno
  BASE_URL: 'http://186.33.129.130:3002',
  
  // Endpoints
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
