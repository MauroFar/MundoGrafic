import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaDownload, FaEnvelope } from 'react-icons/fa';

interface OrdenTrabajo {
  id: number;
  numero_orden: string;
  nombre_cliente: string;
  concepto: string;
  fecha_creacion?: string;
  estado?: string;
  email_cliente?: string;
  // Agrega más campos según tu modelo
}

const OrdenesVer: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [pagina, setPagina] = useState<number>(1);
  const [hayMas, setHayMas] = useState<boolean>(true);
  const LIMITE_POR_PAGINA = 15;
  const [modalProduccionId, setModalProduccionId] = useState<number | null>(null);
  const [produccionEnviada, setProduccionEnviada] = useState<{ [id: number]: boolean }>({});

  useEffect(() => {
    setPagina(1);
    cargarOrdenes(true);
    // eslint-disable-next-line
  }, []);

  const cargarOrdenes = async (reset = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filtros.busqueda) queryParams.append("busqueda", filtros.busqueda);
      if (filtros.fechaDesde) queryParams.append("fechaDesde", filtros.fechaDesde);
      if (filtros.fechaHasta) queryParams.append("fechaHasta", filtros.fechaHasta);
      queryParams.append("limite", LIMITE_POR_PAGINA.toString());
      const url = `${apiUrl}/api/ordenTrabajo/listar?${queryParams}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al cargar las órdenes de trabajo");
      const data = await response.json();
      if (reset) {
        setOrdenes(data);
      } else {
        setOrdenes(prev => [...prev, ...data]);
      }
      setHayMas(data.length === LIMITE_POR_PAGINA);
    } catch (error: any) {
      setOrdenes([]);
      setHayMas(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros(prev => ({ ...prev, busqueda: e.target.value }));
    setPagina(1);
    cargarOrdenes(true);
  };

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    cargarOrdenes(true);
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      fechaDesde: "",
      fechaHasta: "",
    });
    setPagina(1);
    cargarOrdenes(true);
  };

  const editarOrden = (id: number) => {
    navigate(`/ordendeTrabajo/editar/${id}`);
  };

  const eliminarOrden = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta orden de trabajo?")) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/eliminar/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar la orden");
      alert("Orden eliminada exitosamente");
      cargarOrdenes(true);
    } catch (error: any) {
      alert(error.message || "Ocurrió un error al eliminar la orden");
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${id}/pdf`);
      if (!response.ok) throw new Error('Error al obtener el PDF');
      const pdfBlob = await response.blob();
      if (pdfBlob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orden_trabajo_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert('PDF descargado exitosamente');
    } catch (error: any) {
      alert('Error al descargar el PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const enviarAProduccion = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${id}/enviar-produccion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Error al enviar a producción");
      // Actualizar el estado de la orden localmente para reflejar el cambio inmediato
      setOrdenes(prev => prev.map(orden => orden.id === id ? { ...orden, estado: "en producción" } : orden));
      setProduccionEnviada(prev => ({ ...prev, [id]: true }));
      setModalProduccionId(null);
    } catch (error: any) {
      alert(error.message || "Ocurrió un error al enviar a producción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Órdenes de Trabajo</h1>
      <form onSubmit={aplicarFiltros} className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por N° o Cliente</label>
            <input
              type="text"
              name="busqueda"
              value={filtros.busqueda}
              onChange={handleBusquedaChange}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Número de orden o nombre del cliente"
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input
              type="date"
              name="fechaDesde"
              value={filtros.fechaDesde}
              onChange={handleFiltroChange}
              style={{ width: '140px' }}
              className="border border-gray-300 rounded-md p-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input
              type="date"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFiltroChange}
              style={{ width: '140px' }}
              className="border border-gray-300 rounded-md p-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={limpiarFiltros}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Limpiar Filtros
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Buscar
          </button>
        </div>
      </form>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 border-b text-left">N° Orden</th>
                <th className="px-6 py-3 border-b text-left">Cliente</th>
                <th className="px-6 py-3 border-b text-left">Concepto</th>
                <th className="px-6 py-3 border-b text-left">Fecha</th>
                <th className="px-6 py-3 border-b text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b">{orden.numero_orden}</td>
                  <td className="px-6 py-4 border-b">{orden.nombre_cliente}</td>
                  <td className="px-6 py-4 border-b">{orden.concepto}</td>
                  <td className="px-6 py-4 border-b">{orden.fecha_creacion?.slice(0,10)}</td>
                  <td className="px-6 py-4 border-b">
                    <div className="flex space-x-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        onClick={() => editarOrden(orden.id)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      {!(orden.estado && orden.estado.toLowerCase() === "en producción") && (
                        <button
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                          onClick={() => eliminarOrden(orden.id)}
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
                      )}
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded"
                        onClick={() => descargarPDF(orden.id)}
                        title="Descargar PDF"
                      >
                        <FaDownload />
                      </button>
                      {orden.estado && orden.estado.toLowerCase() === "en producción" ? (
                        <button
                          className="p-2 text-gray-400 bg-gray-200 rounded cursor-not-allowed"
                          disabled
                          title="En Producción"
                        >
                          <span className="font-bold">En Producción</span>
                        </button>
                      ) : (
                        <button
                          className="p-2 text-green-600 hover:bg-green-100 rounded"
                          onClick={() => setModalProduccionId(orden.id)}
                          title="Enviar a Producción"
                        >
                          <span className="font-bold">Enviar a Producción</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {!loading && hayMas && (
        <button
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => { setPagina(p => p + 1); cargarOrdenes(false); }}
        >
          Cargar más
        </button>
      )}
      {modalProduccionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <h3 className="text-lg font-semibold mb-2 text-green-700">¿Enviar esta orden a producción?</h3>
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => enviarAProduccion(modalProduccionId)}
              >
                Sí, enviar
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setModalProduccionId(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesVer; 