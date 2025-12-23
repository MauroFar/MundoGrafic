import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importar componentes de producción
import DashboardProduccion from '../pages/produccion/DashboardProduccion';
import VistaKanban from '../pages/produccion/VistaKanban';
import ModuloPreprensa from '../pages/produccion/ModuloPreprensa';
import ModuloPrensa from '../pages/produccion/ModuloPrensa';
import ModuloAcabados from '../pages/produccion/ModuloAcabados';
import ModuloControlCalidad from '../pages/produccion/ModuloControlCalidad';
import ModuloEmpacadoEntrega from '../pages/produccion/ModuloEmpacadoEntrega';

// Importar componentes existentes
import CotizacionesVer from '../pages/cotizaciones/CotizacionesVer';
import OrdendeTrabajoEditar from '../pages/ordendeTrabajo/OrdendeTrabajo';

const ProduccionRoutes = () => {
  return (
    <Routes>
      {/* Rutas de Producción */}
      <Route path="/produccion" element={<DashboardProduccion />} />
      <Route path="/produccion/dashboard" element={<DashboardProduccion />} />
      <Route path="/produccion/kanban" element={<VistaKanban />} />
      <Route path="/produccion/preprensa" element={<ModuloPreprensa />} />
      <Route path="/produccion/prensa" element={<ModuloPrensa />} />
      <Route path="/produccion/acabados" element={<ModuloAcabados />} />
      <Route path="/produccion/calidad" element={<ModuloControlCalidad />} />
      <Route path="/produccion/entrega" element={<ModuloEmpacadoEntrega />} />
      <Route path="/produccion/seguimiento/:id" element={<OrdendeTrabajoEditar />} />
      
      {/* Rutas existentes de Cotizaciones */}
      <Route path="/cotizaciones" element={<CotizacionesVer />} />
      <Route path="/cotizaciones/ver" element={<CotizacionesVer />} />
      
      {/* Rutas existentes de Órdenes de Trabajo */}
      <Route path="/ordendeTrabajo/crear" element={<OrdendeTrabajoEditar />} />
      <Route path="/ordendeTrabajo/crear/:cotizacionId" element={<OrdendeTrabajoEditar />} />
      <Route path="/ordendeTrabajo/editar/:ordenId" element={<OrdendeTrabajoEditar />} />
    </Routes>
  );
};

export default ProduccionRoutes;
