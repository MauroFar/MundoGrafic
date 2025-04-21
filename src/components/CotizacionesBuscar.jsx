import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CotizacionesBuscar.css";

function CotizacionesBuscar() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [rucs, setRucs] = useState([]);
  const [rucSeleccionado, setRucSeleccionado] = useState("");
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    // Cargar RUCs desde tu backend al iniciar
    fetch(`${apiUrl}/api/rucs`)
      .then((res) => res.json())
      .then((data) => setRucs(data))
      .catch((error) => console.error("Error al cargar RUCs:", error));
  }, []);

  // Buscar automáticamente cuando se selecciona un RUC
  useEffect(() => {
    if (rucSeleccionado) {
      buscarCotizaciones();
    } else {
      setResultados([]);
    }
  }, [rucSeleccionado]);

  const buscarCotizaciones = async () => {
    if (!rucSeleccionado) {
      setResultados([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        ruc_id: rucSeleccionado,
      });

      const response = await fetch(`${apiUrl}/api/buscarCotizaciones/buscar?${params}`);
      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error("Error al buscar cotizaciones:", error);
    }
  };

  const editarCotizacion = (id) => {
    navigate(`/cotizaciones/editar/${id}`);
  };
  
  return (
    <div className="container">
      <button className="back-button" onClick={() => navigate("/cotizacionesMenu")}>
        ← Volver
      </button>

      <h1 className="title">Cotizaciones</h1>
      <h2 className="subtitle">Buscar</h2>

      {/* Selector de RUC */}
      <div className="ruc-selector">
        <label htmlFor="ruc">Filtrar por RUC:</label>
        <select
          id="ruc"
          value={rucSeleccionado}
          onChange={(e) => setRucSeleccionado(e.target.value)}
        >
          <option value="">-- Seleccionar RUC --</option>
          {rucs.map((ruc) => (
            <option key={ruc.id} value={ruc.id}>
              {ruc.ruc} - {ruc.descripcion} ({ruc.ejecutivo})
            </option>
          ))}
        </select>
      </div>

    {/* Tabla de resultados */}
    <table className="result-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Detalle</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Número de Cotización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {resultados.length > 0 ? (
            resultados.map((cot, index) => (
              <tr key={`${cot.numero_cotizacion}-${index}`}>
                <td>{cot.nombre_cliente}</td>
                <td className="detalle">{cot.detalle}</td>
                <td>{new Date(cot.fecha).toLocaleDateString()}</td>
                <td>{cot.estado}</td>
                <td>{cot.numero_cotizacion}</td>
                <td className="acciones">
                <button className="boton aprobar" onClick={() => aprobarCotizacion(cot.id)}>Ver</button>
                  <button className="boton aprobar" onClick={() => aprobarCotizacion(cot.id)}>Aprobar</button>
                  <button className="boton editar" onClick={() => editarCotizacion(cot.id)}>Editar</button>
                  <button className="boton eliminar" onClick={() => eliminarCotizacion(cot.id)}>Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                {rucSeleccionado
                  ? "No se encontraron cotizaciones para este RUC."
                  : "Selecciona un RUC para ver las cotizaciones."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CotizacionesBuscar;
