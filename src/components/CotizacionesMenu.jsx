import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function CotizacionesMenu() {
  return (
    <div>
      <h1>Gestión de Cotizaciones</h1>
      <Link to="/cotizacionesCrear">
        <button>Crear Cotización</button>
      </Link>
      <Link to="/cotizacionesBuscar">
        <button>Buscar Cotización</button>
      </Link>
      <Link to="/cotizaciones/ver">
        <button>Ver Cotizaciones</button>
      </Link>
    </div>
  );
}

export default CotizacionesMenu;
 