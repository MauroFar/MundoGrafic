import React from "react";
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
    location.pathname === '/dashboardGeneral' ||
    location.pathname === '/productosTerminados' ||
    location.pathname === '/produccionDiaria';

  return (
    <div className="main-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="layout-body" style={{ display: 'flex', flex: 1, width: '100%' }}>
        {showSidebar && <Sidebar />}
        <div className="layout-content" style={{ width: '100%', flex: 1, padding: '1rem' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
