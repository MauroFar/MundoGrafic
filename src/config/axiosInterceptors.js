import axios from 'axios';
import { toast } from 'react-toastify';

const PERMISSION_EVENT = 'app:permission-denied';
const AUTH_EXPIRED_EVENT = 'app:auth-expired';
const MAINTENANCE_EVENT = 'app:maintenance-active';

const notifyPermissionDenied = (detail = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PERMISSION_EVENT, { detail }));
  }
};

const METHOD_ACTION_MAP = {
  GET: 'leer',
  POST: 'crear',
  PUT: 'editar',
  PATCH: 'editar',
  DELETE: 'eliminar',
};

const matchModuleFromUrl = (url = '') => {
  if (!url) return '';
  const cleanUrl = String(url).toLowerCase();

  if (cleanUrl.includes('/api/clientes')) return 'clientes';
  if (cleanUrl.includes('/api/cotizaciones')) return 'cotizaciones';
  if (cleanUrl.includes('/api/ordentrabajo') || cleanUrl.includes('/api/ordenes-trabajo')) return 'ordenes_trabajo';
  if (cleanUrl.includes('/api/certificados')) return 'certificados';
  if (cleanUrl.includes('/api/reportes')) return 'reportes';
  if (cleanUrl.includes('/api/inventario')) return 'inventario';
  if (cleanUrl.includes('/api/produccion')) return 'produccion';
  if (cleanUrl.includes('/api/usuarios')) return 'usuarios';
  if (cleanUrl.includes('/api/roles')) return 'roles';
  if (cleanUrl.includes('/api/areas')) return 'areas';
  if (cleanUrl.includes('/api/permisos')) return 'usuarios';

  return '';
};

const extractPermissionContext = ({ method = 'GET', url = '' } = {}) => {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const modulo = matchModuleFromUrl(url);
  let accion = METHOD_ACTION_MAP[normalizedMethod] || 'leer';
  let customActionText = '';

  if (String(url).includes('/api/permisos')) {
    accion = 'editar';
    customActionText = 'configurar permisos de usuarios';
  }

  if (String(url).includes('/api/usuarios/') && String(url).includes('/firma')) {
    accion = 'editar';
    customActionText = 'configurar firma de usuarios';
  }

  return { accion, modulo, customActionText };
};

const notifyAuthExpired = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
};

const notifyMaintenanceActive = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MAINTENANCE_EVENT));
    if (window.location.pathname !== '/mantenimiento') {
      window.location.replace('/mantenimiento');
    }
  }
};

// Configurar interceptor de respuestas para manejar errores 403
export const setupAxiosInterceptors = () => {
  if (typeof window !== 'undefined' && window.__axiosInterceptorsConfigured) {
    return;
  }

  if (typeof window !== 'undefined') {
    window.__axiosInterceptorsConfigured = true;
  }

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403) {
        const { accion, modulo, customActionText } = extractPermissionContext({
          method: error.config?.method,
          url: error.config?.url,
        });
        notifyPermissionDenied({
          accion,
          modulo,
          customActionText,
          source: 'axios',
        });
      } else if (error.response?.status === 401) {
        if (!window.__sessionExpiredHandled) {
          window.__sessionExpiredHandled = true;
          toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          notifyAuthExpired();
          // La ruta correcta del login es "/" no "/login"
          window.location.replace('/');
          setTimeout(() => { window.__sessionExpiredHandled = false; }, 3000);
        }
      } else if (error.response?.status === 503 && error.config?.url !== '/api/system/maintenance-status') {
        notifyMaintenanceActive();
      }
      
      return Promise.reject(error);
    }
  );
};

// Interceptor global para peticiones hechas con fetch
export const setupFetchInterceptor = () => {
  if (typeof window === 'undefined' || window.__fetchInterceptorConfigured) {
    return;
  }

  window.__fetchInterceptorConfigured = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    const requestInfo = args[0];
    const requestInit = args[1] || {};
    const method = requestInit?.method || 'GET';
    const url = typeof requestInfo === 'string' ? requestInfo : requestInfo?.url || '';
    const response = await originalFetch(...args);

    if (response.status === 403) {
      const { accion, modulo, customActionText } = extractPermissionContext({ method, url });
      notifyPermissionDenied({
        accion,
        modulo,
        customActionText,
        source: 'fetch',
      });
    }

    // Ignorar respuestas de mantenimiento y auth-status para no causar loops
    const isMaintenanceUrl = url.includes('/api/system/maintenance-status');
    const isAuthUrl = url.includes('/api/auth');

    if (response.status === 401 && !isAuthUrl) {
      // Evitar múltiples redirecciones simultáneas
      if (!window.__sessionExpiredHandled) {
        window.__sessionExpiredHandled = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        notifyAuthExpired();
        // La ruta correcta del login es "/" no "/login"
        window.location.replace('/');
        // Resetear el flag después de un tiempo para futuros usos
        setTimeout(() => { window.__sessionExpiredHandled = false; }, 3000);
      }
    }

    if (response.status === 503 && !isMaintenanceUrl) {
      notifyMaintenanceActive();
    }

    return response;
  };
};

export const setupHttpInterceptors = () => {
  setupAxiosInterceptors();
  setupFetchInterceptor();
};
