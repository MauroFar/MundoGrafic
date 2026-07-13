import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
const RETURN_PATH_KEY = 'mg_return_path_after_maintenance';
const POLL_INTERVAL_MS = 10000;

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

const getSafeReturnTarget = () => {
  const raw = sessionStorage.getItem(RETURN_PATH_KEY) || '/welcome';
  const pathOnly = raw.split('?')[0];
  return isValidAppPath(pathOnly) ? raw : '/welcome';
};

const fetchMaintenanceStatus = async () => {
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

  const data = await response.json();
  return { maintenance: data?.maintenance === true };
};

const Mantenimiento = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [maintenanceActive, setMaintenanceActive] = useState(true);
  const returnPath = useMemo(() => getSafeReturnTarget(), []);

  useEffect(() => {
    let mounted = true;

    const syncStatus = async () => {
      try {
        const status = await fetchMaintenanceStatus();
        if (!mounted) return;

        const active = Boolean(status?.maintenance);
        setMaintenanceActive(active);
        setChecking(false);

        if (!active) {
          const target = getSafeReturnTarget();
          sessionStorage.removeItem(RETURN_PATH_KEY);
          navigate(target, { replace: true });
        }
      } catch {
        if (!mounted) return;
        setMaintenanceActive(true);
        setChecking(false);
      }
    };

    syncStatus();
    const timer = setInterval(syncStatus, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [navigate]);

  useEffect(() => {
    const saveReturnPath = () => {
      if (window.location.pathname !== '/mantenimiento') {
        sessionStorage.setItem(RETURN_PATH_KEY, `${window.location.pathname}${window.location.search}${window.location.hash}`);
      }
    };

    window.addEventListener('beforeunload', saveReturnPath);
    return () => window.removeEventListener('beforeunload', saveReturnPath);
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      <main style={styles.card}>
        <div style={styles.badge}>Mantenimiento activo</div>
        <h1 style={styles.title}>Estamos actualizando el sistema</h1>
        <p style={styles.lead}>
          El servicio está temporalmente pausado para corregir errores y aplicar mejoras.
        </p>

        <div style={styles.progressShell}>
          <div style={styles.progressBar} />
        </div>

        <div style={styles.statusGrid}>
          <div style={styles.statusBox}>
            <span style={styles.label}>Estado</span>
            <strong style={styles.value}>{maintenanceActive ? 'En mantenimiento' : 'Reanudando'}</strong>
          </div>
          <div style={styles.statusBox}>
            <span style={styles.label}>Revisión</span>
            <strong style={styles.value}>{checking ? 'Verificando...' : 'Sincronizado'}</strong>
          </div>
        </div>

        <p style={styles.text}>
          Si estabas trabajando en el sistema, esta pantalla se cerrará automáticamente cuando el servicio vuelva.
        </p>
    


        <div style={styles.footer}>
          {returnPath !== '/welcome' ? `Volveremos a: ${returnPath}` : 'MundoGrafic'}
        </div>
      </main>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'radial-gradient(circle at top, #132238 0%, #08111f 48%, #050914 100%)',
    color: '#e5eefc',
    position: 'relative',
    overflow: 'hidden',
  },
  glowOne: {
    position: 'absolute',
    width: '420px',
    height: '420px',
    borderRadius: '999px',
    background: 'rgba(59, 130, 246, 0.18)',
    filter: 'blur(80px)',
    top: '-120px',
    left: '-120px',
  },
  glowTwo: {
    position: 'absolute',
    width: '320px',
    height: '320px',
    borderRadius: '999px',
    background: 'rgba(14, 165, 233, 0.15)',
    filter: 'blur(70px)',
    bottom: '-100px',
    right: '-80px',
  },
  card: {
    width: '100%',
    maxWidth: '620px',
    position: 'relative',
    zIndex: 1,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '28px',
    padding: '40px 32px',
    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45)',
    backdropFilter: 'blur(18px)',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(245, 158, 11, 0.14)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '18px',
  },
  title: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    margin: '0 0 12px',
    lineHeight: 1.1,
    color: '#f8fafc',
  },
  lead: {
    margin: '0 0 26px',
    fontSize: '1.05rem',
    lineHeight: 1.7,
    color: '#cbd5e1',
  },
  progressShell: {
    width: '100%',
    height: '12px',
    borderRadius: '999px',
    background: 'rgba(51, 65, 85, 0.9)',
    overflow: 'hidden',
    marginBottom: '26px',
  },
  progressBar: {
    width: '72%',
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #38bdf8, #6366f1, #f472b6)',
    animation: 'mantenimiento-progress 2.8s ease-in-out infinite alternate',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
    marginBottom: '24px',
  },
  statusBox: {
    background: 'rgba(15, 23, 42, 0.92)',
    border: '1px solid rgba(71, 85, 105, 0.9)',
    borderRadius: '18px',
    padding: '18px 16px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: '0.76rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    marginBottom: '6px',
  },
  value: {
    fontSize: '1rem',
    color: '#f8fafc',
  },
  text: {
    margin: '0 0 22px',
    color: '#94a3b8',
    lineHeight: 1.7,
  },
  button: {
    border: 'none',
    borderRadius: '14px',
    padding: '12px 18px',
    background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
    color: 'white',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 12px 28px rgba(37, 99, 235, 0.35)',
  },
  footer: {
    marginTop: '18px',
    fontSize: '0.82rem',
    color: '#64748b',
  },
};

if (typeof document !== 'undefined') {
  const styleId = 'mantenimiento-keyframes';
  if (!document.getElementById(styleId)) {
    const tag = document.createElement('style');
    tag.id = styleId;
    tag.textContent = `
      @keyframes mantenimiento-progress {
        from { transform: translateX(-18%); }
        to { transform: translateX(18%); }
      }
    `;
    document.head.appendChild(tag);
  }
}

export default Mantenimiento;
