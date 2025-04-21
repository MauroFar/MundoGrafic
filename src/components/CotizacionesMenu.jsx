import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/CotizacionesMenu.css";

function CotizacionesMenu() {
  const navigate = useNavigate();

  return (
    <div className="cotizaciones-menu-container">
      {/* Botón de regreso */}
      <button className="back-button" onClick={() => navigate("/Dashboard")}>
        ← Volver
      </button>

      {/* Contenido centrado */}
      <div className="menu-content">
        <h1 className="title">Gestión de Cotizaciones</h1>

        <div className="button-container">
          <Link to="/cotizacionesCrear">
            <button className="menu-button">Crear Cotización</button>
          </Link>
          <Link to="/cotizacionesBuscar">
            <button className="menu-button">Buscar Cotización</button>
          </Link>
          <Link to="/cotizacionesEditar">
            <button className="menu-button">Ver Cotizaciones</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CotizacionesMenu;
