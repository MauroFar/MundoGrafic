import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";


function BuscarCotizaciones() {
  // Estado para las cotizaciones (se llenará más adelante con los datos de la base de datos)
  const [cotizaciones, setCotizaciones] = useState([]);

  // Simularemos algunas cotizaciones para la vista visual por ahora
  useEffect(() => {
    // Esto se conectará con la base de datos más tarde, por ahora vamos a simular
        // Esto se conectará con la base de datos más tarde, por ahora vamos a simular
    setCotizaciones([
      { id: 1, nombre: "Cotización 001", estado: "Pendiente" },
      { id: 2, nombre: "Cotización 002", estado: "Aprobada" },
      { id: 3, nombre: "Cotización 003", estado: "Pendiente" },
    ]);
  }, []);

  return (
    <div>
      <h1>Buscar Cotizaciones</h1>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cotizaciones.map((cotizacion) => (
            <tr key={cotizacion.id}>
              <td>{cotizacion.nombre}</td>
              <td>{cotizacion.estado}</td>
              <td>
                {/* Botones para Ver, Editar y Aprobar */}
                <Link to={`/cotizaciones/ver/${cotizacion.id}`}>
                  <button>Ver Cotización</button>
                </Link>
                <Link to={`/cotizaciones/editar/${cotizacion.id}`}>
                  <button>Editar Cotización</button>
                </Link>
                <button
                  onClick={() => alert(`Aprobar Cotización ${cotizacion.id}`)}
                >
                  Aprobar Cotización
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BuscarCotizaciones;
