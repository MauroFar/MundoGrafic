import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/cotizaciones/CotizacionesBuscar.css";

function CotizacionesBuscar() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [rucs, setRucs] = useState([]);
  const [rucSeleccionado, setRucSeleccionado] = useState("");
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    fetch(`${apiUrl}/api/rucs`)
      .then((res) => res.json())
      .then((data) => setRucs(data))
      .catch((error) => console.error("Error al cargar RUCs:", error));
  }, []);

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
      console.log("Cotizaciones recibidas:", data); // 👈 Aquí ves qué campo tiene: `id` o `_id`
      setResultados(data);
      console.log("Cotizaciones recibidas:", data);
    } catch (error) {
      console.error("Error al buscar cotizaciones:", error);
    }
  };
const aprobarCotizacion = async (id, ruc_id) => {
  try {
    const response = await fetch(`http://localhost:5000/api/buscarCotizaciones/${id}/aprobar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ruc_id }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error al aprobar la cotización");

    alert(data.message);
    buscarCotizaciones(); // Para refrescar la lista después de aprobar
  } catch (error) {
    console.error("Error al aprobar cotización:", error);
    alert("Error al aprobar la cotización.");
  }
};



  const eliminarCotizacion = (id) => {
    console.log("Eliminando cotización con ID:", id);
  };

  const editarCotizacion = (id) => {
    navigate(`/cotizaciones/Editar/${id}`); // Redirige a la ruta de edición
  };
const ordendeTrabajo = (id) => {
  navigate(`/ordendeTrabajo/crear/${id}`);
};


  
  return (
    <div className="container">
      <button className="back-button" onClick={() => navigate("/cotizaciones")}>
        ← Volver
      </button>

      <h1 className="title">Cotizaciones</h1>
      <h2 className="subtitle">Buscar</h2>

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
        <button onClick={() => editarCotizacion(cot.cotizacion_id)}>Editar</button>
          
          <button
  className="boton aprobar"
  onClick={() => aprobarCotizacion(cot.cotizacion_id,rucSeleccionado)}
  disabled={cot.estado === "aprobada"}
>
  {cot.estado === "aprobada" ? "Aprobada" : "Aprobar"}
</button>

          <button className="boton aprobar" onClick={() => ordendeTrabajo(cot.cotizacion_id)}>
          Generar orden de trabajo
          </button>
          
          <button className="boton eliminar" onClick={() => eliminarCotizacion(cot.cotizacion_id)}>
            Eliminar
          </button>
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
