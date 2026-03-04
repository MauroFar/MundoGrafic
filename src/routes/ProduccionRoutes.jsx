import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importar componentes de producción
import VistaKanban from '../pages/produccion/VistaKanban';

// Importar componentes existentes
import CotizacionesVer from '../pages/cotizaciones/CotizacionesVer';
import OrdendeTrabajoEditar from '../pages/ordendeTrabajo/OrdendeTrabajo';

const ProduccionRoutes = () => {
  return (
    <Routes>
      {/* Rutas de Producción */}
      <Route path="/produccion" element={<VistaKanban />} />
      <Route path="/produccion/kanban" element={<VistaKanban />} />
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
