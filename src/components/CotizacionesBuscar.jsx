import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import "../styles/CotizacionesBuscar.css"; // Importamos los estilos

function CotizacionesBuscar() {
  const navigate = useNavigate(); // Definir navigate
  return (
    <div className="container">
    <button className="back-button" onClick={() => navigate("/cotizacionesMenu")}>← Volver</button>

      <h1 className="title">Cotizaciones</h1>
      <h2 className="subtitle">Buscar</h2>
      
      <div className="search-container">
        <input type="text" className="search-input" placeholder="Ingrese el valor de búsqueda" />
        <select className="search-select">
          <option value="nombre_cotizacion">Nombre Cotización</option>
          <option value="nombre_cliente">Nombre Cliente</option>
          <option value="numero_cotizacion">Número de Cotización</option>
        </select>
      </div>
      
      <button className="search-button">Buscar</button>
    </div>
  );
}

export default CotizacionesBuscar;
