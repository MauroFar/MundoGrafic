import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PermisosProvider } from "./context/PermisosContext";
import { useTheme } from "./hooks/useTheme";
import PrivateRoute from "./components/PrivateRoute";
import ToastNotificaciones from "./components/ToastNotificaciones";
import MaintenanceWatcher from "./components/MaintenanceWatcher";

// Páginas
import Login from "./pages/Login";
import Mantenimiento from "./pages/Mantenimiento";
import MainMenu from "./pages/MainMenu";
import CotizacionesCrear from "./pages/cotizaciones/CotizacionesCrear";
import CotizacionesVer from "./pages/cotizaciones/CotizacionesVer";
import VistaKanban from "./pages/produccion/VistaKanban";
import GestionCalidadKanban from "./pages/produccion/GestionCalidadKanban";
import ProductosTerminados from "./pages/produccion/ProductosTerminados";
import ProductosEntregados from "./pages/produccion/ProductosEntregados";
import OrdendeTrabajo from "./pages/ordendeTrabajo/OrdendeTrabajo";
import OrdenesVer from "./pages/ordendeTrabajo/OrdenesVer";
import ListaPedidos from "./pages/pedidos/ListaPedidos";
import Certificados from "./pages/certificados/Certificados";
import CertificadoForm from "./pages/certificados/CertificadoForm";
import Inventario from "./pages/inventario/Inventario";
import PageNotFound from "./pages/PageNotFound";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import GestionRoles from "./pages/admin/GestionRoles";
import GestionAreas from "./pages/admin/GestionAreas";
import CatalogoProcesos from "./pages/admin/CatalogoProcesos";
import TiposTrabajo from "./pages/admin/TiposTrabajo";
import ReportesTrabajoDiario from "./pages/produccion/ReportesTrabajoDiario";
import SeguimientoOrden from "./pages/produccion/SeguimientoOrden";
import Administracion from "./pages/Administracion";
import MainLayout from "./layouts/MainLayout";
import ClientesVer from "./pages/clientes/ClientesVer";
import ClientesCrear from "./pages/clientes/ClientesCrear";
import CotizacionItems from "./pages/cotizaciones/CotizacionItems";
import RegistroOperario from "./pages/registros/RegistroOperario";

function App() {
  // Inicializar el tema desde localStorage
  useTheme();

  return (
    <PermisosProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <ToastNotificaciones />
        <MaintenanceWatcher />
        <Routes>
          <Route path="/mantenimiento" element={<Mantenimiento />} />

          {/* Ruta Login */}
          <Route path="/" element={<Login />} />

          {/* Rutas del sistema con MainLayout global */}
          <Route element={<MainLayout />}>
            <Route path="/welcome" element={<MainMenu />} />

            {/* Clientes: admin y ejecutivo */}
            <Route path="/clientes" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <ClientesVer />
              </PrivateRoute>
            } />
            <Route path="/clientes/ver" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <ClientesVer />
              </PrivateRoute>
            } />
            <Route path="/clientes/crear" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <ClientesCrear />
              </PrivateRoute>
            } />
            <Route path="/clientes/editar/:id" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <ClientesCrear />
              </PrivateRoute>
            } />

            {/* Cotizaciones: admin y ejecutivo */}
            <Route path="/cotizaciones" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <CotizacionesVer />
              </PrivateRoute>
            } />
            <Route path="/cotizaciones/crear" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <CotizacionesCrear />
              </PrivateRoute>
            } />
            <Route path="/cotizaciones/crear/:id" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <CotizacionesCrear />
              </PrivateRoute>
            } />
            <Route path="/cotizaciones/ver" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <CotizacionesVer />
              </PrivateRoute>
            } />
            <Route path="/cotizaciones/items-prototipo" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
                <CotizacionItems />
              </PrivateRoute>
            } />

            {/* Producción y órdenes de trabajo: admin, ejecutivo, impresion */}
            <Route path="/produccion" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <VistaKanban />
              </PrivateRoute>
            } />
            <Route path="/produccion/kanban" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <VistaKanban />
              </PrivateRoute>
            } />
            <Route path="/produccion/control-calidad" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <GestionCalidadKanban />
              </PrivateRoute>
            } />
            <Route path="/produccion/seguimiento/:id" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <SeguimientoOrden />
              </PrivateRoute>
            } />
            <Route path="/registros/operario" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <RegistroOperario />
              </PrivateRoute>
            } />
            <Route path="/productosTerminados" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <ProductosTerminados />
              </PrivateRoute>
            } />
            <Route path="/productosEntregados" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <ProductosEntregados />
              </PrivateRoute>
            } />

            {/* Órdenes de trabajo */}
            <Route path="/ordendeTrabajo" element={<Navigate to="/ordendeTrabajo/ver" replace />} />
            <Route path="/OrdendeTrabajo" element={<Navigate to="/ordendeTrabajo/ver" replace />} />
            <Route path="/ordendeTrabajo/crear/:cotizacionId" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <OrdendeTrabajo />
              </PrivateRoute>
            } />
            <Route path="/ordendeTrabajo/crear" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <OrdendeTrabajo />
              </PrivateRoute>
            } />
            <Route path="/ordendeTrabajo/editar/:ordenId" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <OrdendeTrabajo />
              </PrivateRoute>
            } />
            <Route path="/ordendeTrabajo/ver" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <OrdenesVer />
              </PrivateRoute>
            } />

            {/* Pedidos */}
            <Route path="/pedidos/lista" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion', 'operador']}>
                <ListaPedidos />
              </PrivateRoute>
            } />

            {/* Certificados de Calidad */}
            <Route path="/certificados" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <Certificados />
              </PrivateRoute>
            } />
            <Route path="/certificados/crear" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <CertificadoForm />
              </PrivateRoute>
            } />
            <Route path="/certificados/editar/:id" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <CertificadoForm />
              </PrivateRoute>
            } />
            <Route path="/certificados/ver/:id" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <CertificadoForm />
              </PrivateRoute>
            } />

            {/* Inventario: todos los roles */}
            <Route path="/inventario" element={<Inventario />} />

            {/* Reportes de trabajo diario */}
            <Route path="/reportesTrabajoDiario" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <ReportesTrabajoDiario modo="visualizacion" />
              </PrivateRoute>
            } />
            <Route path="/reportesTrabajoDiario/ingresar" element={
              <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
                <ReportesTrabajoDiario modo="completo" />
              </PrivateRoute>
            } />

            {/* Administración */}
            <Route path="/admin/usuarios" element={
              <PrivateRoute requiredModule="usuarios">
                <GestionUsuarios />
              </PrivateRoute>
            } />
            <Route path="/admin/roles" element={
              <PrivateRoute requiredModule="roles">
                <GestionRoles />
              </PrivateRoute>
            } />
            <Route path="/admin/areas" element={
              <PrivateRoute requiredModule="areas">
                <GestionAreas />
              </PrivateRoute>
            } />
            <Route path="/admin/catalogo-procesos" element={
              <PrivateRoute requiredModule="catalogo-procesos">
                <CatalogoProcesos />
              </PrivateRoute>
            } />
            <Route path="/admin/tipos-trabajo" element={
              <PrivateRoute requiredModule="tipos-trabajo">
                <TiposTrabajo />
              </PrivateRoute>
            } />
            <Route path="/administracion" element={
              <PrivateRoute requireAnyAdminModule={true}>
                <Administracion />
              </PrivateRoute>
            } />

            {/* Sin permisos */}
            <Route path="/no-autorizado" element={
              <div className="text-center text-2xl mt-20">No tienes permisos para acceder a esta página.</div>
            } />

            {/* 404 - debe ir al final */}
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </Router>
    </PermisosProvider>
  );
}

export default App;
