import React from 'react';
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import '../styles/CotizacionesVer.css';  // Aquí incluirás los estilos para la interfaz

function CotizacionesVer() {
  const navigate = useNavigate(); // Definir navigate
  const cotizaciones = [
    { id: 1, numero: 'C001', cliente: 'Cliente A', total: 500 },
    { id: 2, numero: 'C002', cliente: 'Cliente B', total: 700 },
    { id: 3, numero: 'C003', cliente: 'Cliente C', total: 450 },
  ];

  return (
    <div className="cotizaciones-container">
  <button className="back-button" onClick={() => navigate("/cotizacionesMenu")}>← Volver</button>
  <h1 className="title">Cotizaciones</h1>

  {/* Contenedor con margen superior */}
  <div className="cotizaciones-content">
    <table className="cotizaciones-table">
      <thead>
        <tr>
          <th>Nombre Cliente</th>
          <th>Número Cotización</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Cliente 1</td>
          <td>001</td>
          <td>01/01/2025</td>
          <td className="cotizacion-actions">
            <button className="btn btn-edit">Editar</button>
            <button className="btn btn-approve">Aprobar</button>
            <button className="btn btn-delete">Eliminar</button>
          </td>
        </tr>
        <tr>
          <td>Cliente 2</td>
          <td>002</td>
          <td>02/01/2025</td>
          <td className="cotizacion-actions">
            <button className="btn btn-edit">Editar</button>
            <button className="btn btn-approve">Aprobar</button>
            <button className="btn btn-delete">Eliminar</button>
          </td>
        </tr>
        {/* Más filas de cotización */}
      </tbody>
    </table>
  </div>
</div>

  );
}

export default CotizacionesVer;
