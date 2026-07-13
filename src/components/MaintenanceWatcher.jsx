import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const POLL_INTERVAL_MS = 8000;
const RETURN_PATH_KEY = 'mg_return_path_after_maintenance';

// Rutas válidas conocidas en la aplicación
const VALID_PATH_PREFIXES = [
  '/welcome', '/clientes', '/cotizaciones', '/ordendeTrabajo',
  '/produccion', '/certificados', '/inventario', '/admin',
  '/administracion', '/productosTerminados', '/productosEntregados',
  '/reportesTrabajoDiario', '/pedidos', '/registros', '/mantenimiento',
];

const isValidAppPath = (path) => {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  return VALID_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
};

const getMaintenanceStatus = async () => {
  const response = await fetch(`${API_URL}/api/system/maintenance-status`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    // Solo considerar mantenimiento si el servidor explícitamente devuelve 503
    return { maintenance: response.status === 503 };
  }

  const data = await response.json();
  // Asegurarse de que el campo maintenance sea explícitamente true (no truthy por error)
  return { maintenance: data?.maintenance === true };
};

const MaintenanceWatcher = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Limpiar sessionStorage corrupto al montar
    const storedPath = sessionStorage.getItem(RETURN_PATH_KEY);
    if (storedPath && !isValidAppPath(storedPath.split('?')[0])) {
      sessionStorage.removeItem(RETURN_PATH_KEY);
    }

    const syncMaintenance = async () => {
      try {
        const status = await getMaintenanceStatus();
        if (!mounted) return;

        const active = Boolean(status?.maintenance);
        const onMaintenancePage = window.location.pathname === '/mantenimiento';

        if (active && !onMaintenancePage) {
          // Guardar solo la ruta base sin parámetros inválidos
          const pathToSave = `${location.pathname}${location.search}${location.hash}`;
          // Solo guardar si es una ruta válida de la app
          if (isValidAppPath(location.pathname)) {
            sessionStorage.setItem(RETURN_PATH_KEY, pathToSave);
          }
          navigate('/mantenimiento', { replace: true });
          return;
        }

        if (!active && onMaintenancePage) {
          const rawTarget = sessionStorage.getItem(RETURN_PATH_KEY) || '/welcome';
          sessionStorage.removeItem(RETURN_PATH_KEY);
          // Validar que el target sea una ruta conocida antes de navegar
          const targetPath = rawTarget.split('?')[0];
          const target = isValidAppPath(targetPath) ? rawTarget : '/welcome';
          navigate(target, { replace: true });
        }
      } catch {
        // Si falla la red, no hacer nada — esperamos al siguiente ciclo
      }
    };

    syncMaintenance();
    const timer = setInterval(syncMaintenance, POLL_INTERVAL_MS);

    const onFocus = () => syncMaintenance();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [location, navigate]);

  return null;
};

export default MaintenanceWatcher;
