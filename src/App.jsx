import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PermisosProvider } from "./context/PermisosContext";
import PrivateRoute from "./components/PrivateRoute";
import ToastNotificaciones from "./components/ToastNotificaciones";

// Páginas
import Login from "./pages/Login";
import Welcome from "./components/Welcome";
import MainMenu from "./pages/MainMenu";
import CotizacionesCrear from "./pages/cotizaciones/CotizacionesCrear";
import CotizacionesVer from "./pages/cotizaciones/CotizacionesVer";
import VistaKanban from "./pages/Produccion/VistaKanban";
import ProductosTerminados from "./pages/Produccion/ProductosTerminados";
import ProductosEntregados from "./pages/Produccion/ProductosEntregados";
import OrdendeTrabajo from "./pages/ordendeTrabajo/OrdendeTrabajo";
import OrdenesVer from "./pages/ordendeTrabajo/OrdenesVer";
import Certificados from "./pages/certificados/Certificados";
import CertificadoForm from "./pages/certificados/CertificadoForm";
import Inventario from "./pages/Inventario/Inventario";
import PageNotFound from "./pages/PageNotFound";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import GestionRoles from "./pages/admin/GestionRoles";
import GestionAreas from "./pages/admin/GestionAreas";
import CatalogoProcesos from "./pages/admin/CatalogoProcesos";
import TiposTrabajo from "./pages/admin/TiposTrabajo";
import ReportesTrabajoDiario from "./pages/Produccion/ReportesTrabajoDiario";
import Administracion from "./pages/Administracion";
import MainLayout from "./layouts/MainLayout";
import ClientesVer from "./pages/clientes/ClientesVer";
import ClientesCrear from "./pages/clientes/ClientesCrear";
import CotizacionItems from "./pages/cotizaciones/CotizacionItems";

function App() {
  return (
    <PermisosProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <ToastNotificaciones />
        <Routes>
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

          {/* Cotizaciones solo admin y ejecutivo */}
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

          {/* PROTOTIPO: Vista de ítems de cotización */}
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
          {/* Ordenes de trabajo */}
          <Route path="/OrdendeTrabajo" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <OrdenesVer />
            </PrivateRoute>
          } />
          <Route path="/ordendeTrabajo/crear/:cotizacionId" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <OrdendeTrabajo/>
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

          {/* Ruta para no autorizado */}
          <Route path="/no-autorizado" element={<div className="text-center text-2xl mt-20">No tienes permisos para acceder a esta página.</div>} />
          {/* Ruta por defecto */}
          <Route path="*" element={<PageNotFound />} />

          <Route path="/admin/usuarios" element={
            <PrivateRoute requireAdmin={true}>
              <GestionUsuarios />
            </PrivateRoute>
          } />

          {/* Gestión de Roles */}
          <Route path="/admin/roles" element={
            <PrivateRoute requireAdmin={true}>
              <GestionRoles />
            </PrivateRoute>
          } />

          {/* Gestión de Áreas */}
          <Route path="/admin/areas" element={
            <PrivateRoute allowedRoles={['admin']}>
              <GestionAreas />
            </PrivateRoute>
          } />

          {/* Catálogo de Procesos */}
          <Route path="/admin/catalogo-procesos" element={
            <PrivateRoute allowedRoles={['admin']}>
              <CatalogoProcesos />
            </PrivateRoute>
          } />

          {/* Catálogo de Tipos de Trabajo */}
          <Route path="/admin/tipos-trabajo" element={
            <PrivateRoute allowedRoles={['admin']}>
              <TiposTrabajo />
            </PrivateRoute>
          } />

          {/* Administración: placeholder para futuras herramientas (solo admin) */}
          <Route path="/administracion" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Administracion />
            </PrivateRoute>
          } />

          <Route path="/reportesTrabajoDiario" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ReportesTrabajoDiario />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </Router>
    </PermisosProvider>
  );
}

export default App;

