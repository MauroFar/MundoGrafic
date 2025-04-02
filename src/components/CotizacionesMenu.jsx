import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/CotizacionesMenu.css"; // Importamos los estilos

function CotizacionesMenu() {
  const navigate = useNavigate(); // Para regresar a la página anterior

  return (
    <div className="cotizaciones-menu-container">
      {/* Botón de regreso */}
      <button className="back-button" onClick={() => navigate("/Dashboard")}>← Volver</button>

      {/* Título */}
      <h1 className="title">Gestión de Cotizaciones</h1>

      {/* Botones de navegación */}
      <div className="button-container">
        <Link to="/cotizacionesCrear">
          <button className="menu-button">Crear Cotización</button>
        </Link>
        <Link to="/cotizacionesBuscar">
          <button className="menu-button">Buscar Cotización</button>
        </Link>
        <Link to="/cotizacionesVer">
          <button className="menu-button">Ver Cotizaciones</button>
        </Link>
      </div>
    </div>
  );
}

export default CotizacionesMenu;
