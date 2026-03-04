import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const MainLayout = () => {
  const location = useLocation();

  // Mostrar Sidebar solo en secciones de Producción y páginas relacionadas
  // Incluye Clientes, Cotizaciones y Ordenes de Trabajo porque son parte del flujo de Producción
  const showSidebar = location.pathname.startsWith('/produccion') ||
    location.pathname.startsWith('/clientes') ||
    location.pathname.startsWith('/cotizaciones') ||
    location.pathname.startsWith('/ordendeTrabajo') ||
    location.pathname.startsWith('/certificados') ||
    location.pathname === '/dashboardGeneral' ||
    location.pathname === '/productosTerminados' ||
    location.pathname === '/productosEntregados' ||
    location.pathname === '/produccionDiaria';

  const [menuVisible, setMenuVisible] = useState(true);

  // Restaurar el menú al navegar a una nueva ruta (excepto kanban que lo oculta a propósito)
  useEffect(() => {
    if (!location.pathname.startsWith('/produccion/kanban')) {
      setMenuVisible(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onToggle = (e) => {
      setMenuVisible((v) => !v);
    };
    const onShow = (e) => setMenuVisible(true);
    const onHide = (e) => setMenuVisible(false);
    window.addEventListener('toggle-sidebar', onToggle);
    window.addEventListener('show-sidebar', onShow);
    window.addEventListener('hide-sidebar', onHide);
    return () => {
      window.removeEventListener('toggle-sidebar', onToggle);
      window.removeEventListener('show-sidebar', onShow);
      window.removeEventListener('hide-sidebar', onHide);
    };
  }, []);

  return (
    <div className="main-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <Header />
      <div className="layout-body" style={{ display: 'flex', flex: 1, width: '100%', overflowX: 'hidden' }}>
        {showSidebar && menuVisible && <Sidebar />}
        <div className="layout-content" style={{ flex: 1, padding: '1rem', minWidth: 0, overflowX: 'hidden', overflowY: 'auto' }}>
          <Outlet />
        </div>
        {/* Floating button to show sidebar when hidden (visible on Kanban route) */}
        {showSidebar && !menuVisible && (
          <button
            onClick={() => window.dispatchEvent(new Event('show-sidebar'))}
            className="fixed bottom-6 left-6 z-50 bg-blue-600 text-white px-3 py-2 rounded shadow-lg hover:bg-blue-700"
            title="Mostrar menú"
          >
            Mostrar menú
          </button>
        )}
      </div>
    </div>
  );
};

export default MainLayout;
