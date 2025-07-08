import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from "./components/PrivateRoute";

// Páginas
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Welcome from "./components/Welcome";


// Cotizaciones
import CotizacionesCrear from "./pages/cotizaciones/CotizacionesCrear";
import CotizacionesVer from "./pages/cotizaciones/CotizacionesVer";

// Producción
import DashboardGeneral from "./pages/Produccion/DashboardGeneral";
import ProductosTerminados from "./pages/Produccion/ProductosTerminados";
import ProduccionDiaria from "./pages/Produccion/ProduccionDiaria";
//////Orden de Trabajo
import OrdendeTrabajo from "./pages/ordendeTrabajo/OrdendeTrabajo";
import OrdendeTrabajoBuscar from "./pages/ordendeTrabajo/OrdendeTrabajoBuscar";

// Inventario
import Inventario from "./pages/Inventario/Inventario";

//pagenotfound
import PageNotFound from "./pages/PageNotFound";

// Layout que incluye el Sidebar
const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  const hideSidebarPaths = [
    "/cotizaciones/crear",
    "/cotizaciones/buscar"
  ];

  // Esta es la nueva lógica que ocultará el sidebar para cualquier ID
  const shouldHideSidebar = hideSidebarPaths.some(path => 
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  return (
    <div className="flex">
      {!isLoginPage && !shouldHideSidebar && <Sidebar />}
      <div className="flex-grow p-4">{children}</div>
    </div>
  );
};

import GestionUsuarios from "./pages/admin/GestionUsuarios";
import ReportesTrabajoDiario from "./pages/Produccion/ReportesTrabajoDiario";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Ruta Login */}
        <Route path="/" element={<Login />} />

        {/* Rutas del sistema */}
        <Route
          path="/welcome"
          element={
            <Layout>
              <Welcome title="Bienvenido" message="Has iniciado sesión correctamente." />
            </Layout>
          }
        />

        {/* Cotizaciones solo admin y ejecutivo */}
        <Route
          path="/cotizaciones"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
              <Layout>
                <Welcome title="Cotizaciones" message="Bienvenido a Cotizaciones. Selecciona una opción del menú para continuar." />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/cotizaciones/crear"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
              <Layout>
                <CotizacionesCrear />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/cotizaciones/crear/:id"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
              <Layout>
                <CotizacionesCrear />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/cotizaciones/ver"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
              <Layout>
                <CotizacionesVer />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Producción y órdenes de trabajo: admin, ejecutivo, impresion */}
        <Route
          path="/produccion"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Layout>
                <Welcome 
                  title="Producción" 
                  message="Bienvenido al área de Producción. Seleccione una opción del menú para continuar." 
                />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboardGeneral"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Layout>
                <DashboardGeneral />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/produccionDiaria"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Layout>
                <ProduccionDiaria />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/productosTerminados"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Layout>
                <ProductosTerminados />
              </Layout>
            </PrivateRoute>
          }
        />
        {/* Ordenes de trabajo */}
        <Route path="/OrdendeTrabajo" element={
          <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
            <Layout>
              <Welcome title="Cotizaciones" message="Bienvenido a Ordenes de trabajo. Selecciona una opción del menú para continuar." />
            </Layout>
          </PrivateRoute>
        } />
        <Route
          path="/ordendeTrabajo/crear/:cotizacionId"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Layout>
                <OrdendeTrabajo/>
              </Layout>
            </PrivateRoute>
          }
        />
        <Route path="/ordendeTrabajo/crear" element={
          <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
            <Layout>
              <OrdendeTrabajo />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/ordendeTrabajoBuscar" element={
          <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
            <Layout>
              <OrdendeTrabajoBuscar />
            </Layout>
          </PrivateRoute>
        } />
        <Route
          path="/ordendeTrabajo/editar/:ordenId"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Layout>
                <OrdendeTrabajo />
              </Layout>
            </PrivateRoute>
          }
        />
        {/* Inventario: todos los roles */}
        <Route
          path="/inventario"
          element={
            <Layout>
              <Inventario />
            </Layout>
          }
        />
        {/* Ruta para no autorizado */}
        <Route path="/no-autorizado" element={<div className="text-center text-2xl mt-20">No tienes permisos para acceder a esta página.</div>} />
        {/* Ruta por defecto */}
        <Route path="*" element={<PageNotFound />} />

        <Route
          path="/admin/usuarios"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <GestionUsuarios />
            </PrivateRoute>
          }
        />
        <Route
          path="/reportesTrabajoDiario"
          element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Layout>
                <ReportesTrabajoDiario />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
