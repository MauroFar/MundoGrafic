import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Páginas
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Welcome from "./components/Welcome";


// Cotizaciones
import CotizacionesCrear from "./pages/cotizaciones/CotizacionesCrear";
import CotizacionesBuscar from "./pages/cotizaciones/CotizacionesBuscar";
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

        <Route
          path="/cotizaciones"
          element={
            <Layout>
              <Welcome title="Cotizaciones" message="Bienvenido a Cotizaciones. Selecciona una opción del menú para continuar." />
            </Layout>
          }
        />

        <Route
          path="/cotizaciones/crear"
          element={
            <Layout>
              <CotizacionesCrear />
            </Layout>
          }
        />

        <Route
          path="/cotizaciones/crear/:id"
          element={
            <Layout>
              <CotizacionesCrear />
            </Layout>
          }
        />

        <Route
          path="/cotizaciones/buscar"
          element={
            <Layout>
              <CotizacionesBuscar />
            </Layout>
          }
        />

        <Route
          path="/cotizaciones/ver"
          element={
            <Layout>
              <CotizacionesVer />
            </Layout>
          }
        />

        <Route
          path="/produccion"
          element={
            <Layout>
              <Welcome 
                title="Producción" 
                message="Bienvenido al área de Producción. Seleccione una opción del menú para continuar." 
              />
            </Layout>
          }
        />

        <Route
          path="/dashboardGeneral"
          element={
            <Layout>
              <DashboardGeneral />
            </Layout>
          }
        />

        <Route
          path="/produccionDiaria"
          element={
            <Layout>
              <ProduccionDiaria />
            </Layout>
          }
        />

        <Route
          path="/productosTerminados"
          element={
            <Layout>
              <ProductosTerminados />
            </Layout>
          }
        />

        {/* Ordenes de trabajo */}
        <Route path="/OrdendeTrabajo" element={
            <Layout>
              <Welcome title="Cotizaciones" message="Bienvenido a Ordenes de trabajo. Selecciona una opción del menú para continuar." />
            </Layout>
          } />
          
        <Route
          path="/ordendeTrabajo/crear/:cotizacionId"
          element={
            <Layout>
              <OrdendeTrabajo/>
            </Layout>
          }
        />
        <Route path="/ordendeTrabajo/crear" element={
<Layout>
  <OrdendeTrabajo />
</Layout>
} />
        <Route path="/ordendeTrabajoBuscar" element={
<Layout>
  <OrdendeTrabajoBuscar />
</Layout>
} />
<Route
  path="/ordendeTrabajo/editar/:ordenId"
  element={
    <Layout>
      <OrdendeTrabajo />
    </Layout>
  }
/>

        {/* Inventario */}
        <Route
          path="/inventario"
          element={
            <Layout>
              <Inventario />
            </Layout>
          }
        />

        {/* Ruta por defecto */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
