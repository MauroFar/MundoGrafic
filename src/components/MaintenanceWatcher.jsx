import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const POLL_INTERVAL_MS = 8000;
const RETURN_PATH_KEY = 'mg_return_path_after_maintenance';

const getMaintenanceStatus = async () => {
  const response = await fetch(`${API_URL}/api/system/maintenance-status`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  if (!response.ok) {
    return { maintenance: response.status === 503 };
  }

  return response.json();
};

const MaintenanceWatcher = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const syncMaintenance = async () => {
      try {
        const status = await getMaintenanceStatus();
        if (!mounted) return;

        const active = Boolean(status?.maintenance);
        const onMaintenancePage = window.location.pathname === '/mantenimiento';

        if (active && !onMaintenancePage) {
          sessionStorage.setItem(
            RETURN_PATH_KEY,
            `${location.pathname}${location.search}${location.hash}`,
          );
          navigate('/mantenimiento', { replace: true });
          return;
        }

        if (!active && onMaintenancePage) {
          const target = sessionStorage.getItem(RETURN_PATH_KEY) || '/welcome';
          sessionStorage.removeItem(RETURN_PATH_KEY);
          navigate(target, { replace: true });
        }
      } catch {
        // Si falla la red, esperamos al siguiente ciclo.
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
