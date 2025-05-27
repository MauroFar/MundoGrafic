import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
      const params = new URLSearchParams({ ruc_id: rucSeleccionado });
      const response = await fetch(`${apiUrl}/api/buscarCotizaciones/buscar?${params}`);
      const data = await response.json();
      setResultados(data);
    } catch (error) {
      console.error("Error al buscar cotizaciones:", error);
    }
  };

  const aprobarCotizacion = async (id, ruc_id) => {
    try {
      const response = await fetch(`${apiUrl}/api/buscarCotizaciones/${id}/aprobar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruc_id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al aprobar la cotización");

      alert(data.message);
      buscarCotizaciones();
    } catch (error) {
      console.error("Error al aprobar cotización:", error);
      alert("Error al aprobar la cotización.");
    }
  };

const eliminarCotizacion = async (id) => {
  const confirmacion = window.confirm("¿Estás seguro de que deseas eliminar esta cotización?");
  if (!confirmacion) return;

  try {
    const response = await fetch(`${apiUrl}/api/buscarCotizaciones/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Error al eliminar la cotización");

    alert(data.message);
    buscarCotizaciones(); // Recarga la lista
  } catch (error) {
    console.error("Error al eliminar cotización:", error);
    alert("Hubo un error al eliminar la cotización.");
  }
};

  const editarCotizacion = (id) => {
    navigate(`/cotizaciones/Editar/${id}`);
  };

  const ordendeTrabajo = (id) => {
    navigate(`/ordendeTrabajo/crear/${id}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <button
        className="mb-4 text-blue-600 hover:underline"
        onClick={() => navigate("/cotizaciones")}
      >
        ← Volver
      </button>

      <h1 className="text-3xl font-bold mb-2">Cotizaciones</h1>
      <h2 className="text-xl font-semibold mb-6">Buscar</h2>

      <div className="mb-6">
        <label htmlFor="ruc" className="block mb-2 font-medium text-gray-700">
          Filtrar por RUC:
        </label>
        <select
          id="ruc"
          value={rucSeleccionado}
          onChange={(e) => setRucSeleccionado(e.target.value)}
          className="w-full border border-gray-300 rounded px-4 py-2"
        >
          <option value="">-- Seleccionar RUC --</option>
          {rucs.map((ruc) => (
            <option key={ruc.id} value={ruc.id}>
              {ruc.ruc} - {ruc.descripcion} ({ruc.ejecutivo})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
              <th className="p-3 border">Cliente</th>
              <th className="p-3 border">Detalle</th>
              <th className="p-3 border">Fecha</th>
              <th className="p-3 border">Estado</th>
              <th className="p-3 border">N° Cotización</th>
              <th className="p-3 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resultados.length > 0 ? (
              resultados.map((cot, index) => (
                <tr key={`${cot.numero_cotizacion}-${index}`} className="text-sm">
                  <td className="p-3 border">{cot.nombre_cliente}</td>
                  <td className="p-3 border">{cot.detalle}</td>
                  <td className="p-3 border">
                    {new Date(cot.fecha).toLocaleDateString()}
                  </td>
                  <td className="p-3 border">{cot.estado}</td>
                  <td className="p-3 border">{cot.numero_cotizacion}</td>
                  <td className="p-3 border space-y-1 flex flex-col">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      onClick={() => editarCotizacion(cot.cotizacion_id)}
                    >
                      Editar
                    </button>

                    <button
                      className={`px-2 py-1 rounded text-white ${
                        cot.estado === "aprobada"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                      onClick={() =>
                        aprobarCotizacion(cot.cotizacion_id, rucSeleccionado)
                      }
                      disabled={cot.estado === "aprobada"}
                    >
                      {cot.estado === "aprobada" ? "Aprobada" : "Aprobar"}
                    </button>

                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                      onClick={() => ordendeTrabajo(cot.cotizacion_id)}
                    >
                      Orden de Trabajo
                    </button>

                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => eliminarCotizacion(cot.cotizacion_id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  {rucSeleccionado
                    ? "No se encontraron cotizaciones para este RUC."
                    : "Selecciona un RUC para ver las cotizaciones."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CotizacionesBuscar;
