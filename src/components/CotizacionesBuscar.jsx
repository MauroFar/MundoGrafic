import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CotizacionesBuscar.css";

function CotizacionesBuscar() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [rucs, setRucs] = useState([]);
  const [rucSeleccionado, setRucSeleccionado] = useState("");
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    // Cargar RUCs desde tu backend
    fetch(`${apiUrl}/api/rucs`)
      .then((res) => res.json())
      .then((data) => setRucs(data))
      .catch((error) => console.error("Error al cargar RUCs:", error));
  }, []);

  const buscarClientes = async () => {
    if (!rucSeleccionado || busqueda.trim() === "") {
      setResultados([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        ruc_id: rucSeleccionado,
        nombre: busqueda.trim()
      });

      const response = await fetch(`${apiUrl}/api/clientes?${params}`);
      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    }
  };

  // Ejecutar búsqueda al presionar Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      buscarClientes();
    }
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

      {/* Cuadro de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Ingrese el nombre del cliente"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="search-button" onClick={buscarClientes}>Buscar</button>
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
          </tr>
        </thead>
        <tbody>
          {resultados.length > 0 ? (
            resultados.map((cliente, index) => (
              <tr key={cliente.id || `${cliente.nombre_cliente}-${index}`}>
                <td>{cliente.nombre_cliente}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "1rem" }}>
                No hay resultados aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CotizacionesBuscar;
