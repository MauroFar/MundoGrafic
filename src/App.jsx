import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from "./components/PrivateRoute";
import ToastNotificaciones from "./components/ToastNotificaciones";

// Páginas
import Login from "./pages/Login";
import Welcome from "./components/Welcome";
import MainMenu from "./pages/MainMenu";
import CotizacionesCrear from "./pages/cotizaciones/CotizacionesCrear";
import CotizacionesVer from "./pages/cotizaciones/CotizacionesVer";
import DashboardGeneral from "./pages/Produccion/DashboardGeneral";
import DashboardProduccion from "./pages/Produccion/DashboardProduccion";
import VistaKanban from "./pages/Produccion/VistaKanban";
import ModuloPreprensa from "./pages/Produccion/ModuloPreprensa";
import ModuloPrensa from "./pages/Produccion/ModuloPrensa";
import ModuloAcabados from "./pages/Produccion/ModuloAcabados";
import ModuloControlCalidad from "./pages/Produccion/ModuloControlCalidad";
import ModuloEmpacadoEntrega from "./pages/Produccion/ModuloEmpacadoEntrega";

import ProductosTerminados from "./pages/Produccion/ProductosTerminados";
import ProduccionDiaria from "./pages/Produccion/ProduccionDiaria";
import OrdendeTrabajo from "./pages/ordendeTrabajo/OrdendeTrabajo";
import OrdenesVer from "./pages/ordendeTrabajo/OrdenesVer";
import Inventario from "./pages/Inventario/Inventario";
import PageNotFound from "./pages/PageNotFound";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import ReportesTrabajoDiario from "./pages/Produccion/ReportesTrabajoDiario";
import Administracion from "./pages/Administracion";
import MainLayout from "./layouts/MainLayout";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <ToastNotificaciones />
      <Routes>
        {/* Ruta Login */}
        <Route path="/" element={<Login />} />

        {/* Rutas del sistema con MainLayout global */}
        <Route element={<MainLayout />}>
          <Route path="/welcome" element={<MainMenu />} />

          {/* Cotizaciones solo admin y ejecutivo */}
          <Route path="/cotizaciones" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo']}>
              <Welcome title="Cotizaciones" message="Bienvenido a Cotizaciones. Selecciona una opción del menú para continuar." />
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

          {/* Producción y órdenes de trabajo: admin, ejecutivo, impresion */}
          <Route path="/produccion" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <DashboardProduccion />
            </PrivateRoute>
          } />
          <Route path="/produccion/dashboard" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <DashboardProduccion />
            </PrivateRoute>
          } />
          <Route path="/produccion/kanban" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <VistaKanban />
            </PrivateRoute>
          } />
          <Route path="/produccion/preprensa" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ModuloPreprensa />
            </PrivateRoute>
          } />
          <Route path="/produccion/prensa" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ModuloPrensa />
            </PrivateRoute>
          } />
          <Route path="/produccion/acabados" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ModuloAcabados />
            </PrivateRoute>
          } />
          <Route path="/produccion/calidad" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ModuloControlCalidad />
            </PrivateRoute>
          } />
          <Route path="/produccion/entrega" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ModuloEmpacadoEntrega />
            </PrivateRoute>
          } />
          
          <Route path="/dashboardGeneral" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <DashboardGeneral />
            </PrivateRoute>
          } />
          <Route path="/produccionDiaria" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ProduccionDiaria />
            </PrivateRoute>
          } />
          <Route path="/productosTerminados" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <ProductosTerminados />
            </PrivateRoute>
          } />
          {/* Ordenes de trabajo */}
          <Route path="/OrdendeTrabajo" element={
            <PrivateRoute allowedRoles={['admin', 'ejecutivo', 'impresion']}>
              <Welcome title="Cotizaciones" message="Bienvenido a Ordenes de trabajo. Selecciona una opción del menú para continuar." />
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
          {/* Inventario: todos los roles */}
          <Route path="/inventario" element={<Inventario />} />

          {/* Ruta para no autorizado */}
          <Route path="/no-autorizado" element={<div className="text-center text-2xl mt-20">No tienes permisos para acceder a esta página.</div>} />
          {/* Ruta por defecto */}
          <Route path="*" element={<PageNotFound />} />

          <Route path="/admin/usuarios" element={
            <PrivateRoute allowedRoles={['admin']}>
              <GestionUsuarios />
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
  );
}

export default App;
