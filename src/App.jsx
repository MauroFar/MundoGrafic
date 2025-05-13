import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Cotizaciones
import CotizacionesMenu from "./pages/cotizaciones/CotizacionesMenu";
import CotizacionesCrear from "./pages/cotizaciones/CotizacionesCrear";
import CotizacionesBuscar from "./pages/cotizaciones/CotizacionesBuscar";
import CotizacionesEditar from "./pages/cotizaciones/CotizacionesEditar";

// Órdenes de Trabajo
import OrdenesTrabajoMenu from "./pages/ordendetrabajo/OrdenesTrabajoMenu";
import OrdendeTrabajo from "./pages/ordendeTrabajo/OrdendeTrabajoEditar";
////Produccion
import DashboardGeneral from "./pages/Produccion/DashboardGeneral";

// Otros
import PruebaQr from "./pages/PruebaQr";

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta raíz */}
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Cotizaciones */}
        <Route path="/cotizaciones" element={<CotizacionesMenu />} />
        <Route path="/cotizaciones/crear" element={<CotizacionesCrear />} />
        <Route path="/cotizaciones/buscar" element={<CotizacionesBuscar />} />
        <Route path="/cotizaciones/editar/:id" element={<CotizacionesEditar />} />

        {/* Órdenes de Trabajo */}
        <Route path="/ordenes-trabajo" element={<OrdenesTrabajoMenu />} />
        <Route path="/ordenes-trabajo/:id" element={<OrdendeTrabajo />} />

           {/* Produccion */}
        <Route path="dashboardGeneral" element={<DashboardGeneral /> } />
        {/* Nueva ruta para generar el PDF */}
<Route path="/cotizacion/:id" element={<CotizacionesCrear />} />

        {/* Otros */}
        <Route path="/pruebaQr" element={<PruebaQr />} />
      </Routes>
    </Router>
  );
}

export default App;
