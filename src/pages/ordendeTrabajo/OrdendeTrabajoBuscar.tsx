import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Tipo para una orden de trabajo
interface OrdenTrabajo {
  id: number | string;
  nombre_cliente: string;
  detalle: string;
  fecha: string;
  numero_orden: string;
  // Puedes agregar más campos según tu backend
}

function OrdenDeTrabajoBuscar() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [busqueda, setBusqueda] = useState<string>("");

  useEffect(() => {
    if (busqueda) {
      buscarOrdenes();
    } else {
      // Si no hay filtro, traer todas las órdenes
      fetch(`${apiUrl}/api/ordenTrabajo/buscar`)
        .then(res => res.json())
        .then(data => setOrdenes(data))
        .catch(() => setOrdenes([]));
    }
  }, [busqueda]);

  const buscarOrdenes = async () => {
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      const url = params.toString()
        ? `${apiUrl}/api/ordenTrabajo/buscar?${params}`
        : `${apiUrl}/api/ordenTrabajo/buscar`;
      const response = await fetch(url);
      const data = await response.json();
      setOrdenes(data);
    } catch (error) {
      console.error("Error al buscar órdenes:", error);
    }
  };

  const verDetalle = (id: number | string) => {
    navigate(`/ordendeTrabajo/editar/${id}`);
  };

  // Función para eliminar o cancelar la orden
  const eliminarOrden = async (id: number | string) => {
    if (window.confirm("¿Estás seguro de eliminar/cancelar esta orden?")) {
      try {
        await fetch(`${apiUrl}/api/ordenTrabajo/eliminar/${id}`, {
          method: "DELETE",
        });
        // Recargar lista después de eliminar
        buscarOrdenes();
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Error al eliminar la orden:", err.message);
      }
    }
  };

  // Función para enviar la orden a producción
  const enviarAProduccion = async (id: number | string) => {
    if (window.confirm("¿Enviar esta orden a producción?")) {
      try {
        // Aquí llamarías a la API para cambiar el estado de la orden
        await fetch(`${apiUrl}/api/ordenTrabajo/enviarProduccion/${id}`, {
          method: "POST",
        });
        // Recargar lista después de actualizar
        buscarOrdenes();
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Error al enviar a producción:", err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
      >
        ← Volver
      </button>

      <h1 className="text-3xl font-semibold mb-2 text-gray-900">Órdenes de Trabajo</h1>
      <h2 className="text-xl font-medium mb-6 text-gray-700">Buscar</h2>

      <div className="mb-6 flex items-center space-x-4">
        <input
          type="text"
          placeholder="Buscar por N° Orden, N° Cotización o Cliente"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ minWidth: 250 }}
        />
        <button
          onClick={buscarOrdenes}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Buscar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Cliente</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Detalle</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Fecha</th>
              <th className="border border-gray-300 px-4 py-2 text-left">N° Orden</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.length > 0 ? (
              ordenes.map((orden) => (
                <tr key={orden.id + '-' + (orden.numero_orden || '')} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">{orden.nombre_cliente}</td>
                  <td className="border border-gray-300 px-4 py-2">{orden.detalle}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(orden.fecha).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{orden.numero_orden}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => verDetalle(orden.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                      Ver Detalle
                    </button>
                    <button
                      onClick={() => eliminarOrden(orden.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => enviarAProduccion(orden.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Enviar a Producción
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center px-4 py-6 text-gray-500">
                  {"No se encontraron órdenes de trabajo."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdenDeTrabajoBuscar;
