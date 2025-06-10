import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CotizacionesVer() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  
  const [cotizaciones, setCotizaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    busqueda: "",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [loading, setLoading] = useState(true);

  // Función auxiliar para formatear el total de manera segura
  const formatearTotal = (total) => {
    if (total === null || total === undefined) return "0.00";
    const numero = typeof total === 'string' ? parseFloat(total) : total;
    return isNaN(numero) ? "0.00" : numero.toFixed(2);
  };

  // Cargar las últimas 5 cotizaciones al montar el componente
  useEffect(() => {
    console.log('Componente montado, cargando cotizaciones...');
    console.log('API URL:', apiUrl);
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filtros.busqueda) queryParams.append("busqueda", filtros.busqueda);
      if (filtros.fechaDesde) queryParams.append("fechaDesde", filtros.fechaDesde);
      if (filtros.fechaHasta) queryParams.append("fechaHasta", filtros.fechaHasta);

      const url = `${apiUrl}/api/cotizaciones/todas?${queryParams}`;
      console.log('Realizando petición a:', url);
      console.log('Filtros actuales:', filtros);
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log('Datos recibidos:', data);
      
      if (!Array.isArray(data)) {
        console.error('Los datos recibidos no son un array:', data);
        setCotizaciones([]);
        return;
      }
      
      setCotizaciones(data);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
      alert("Error al cargar las cotizaciones: " + error.message);
      setCotizaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    cargarCotizaciones();
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      fechaDesde: "",
      fechaHasta: "",
    });
    cargarCotizaciones();
  };

  const editarCotizacion = (id) => {
    navigate(`/cotizaciones/crear/${id}`);
  };

  const eliminarCotizacion = async (id) => {
    // Validación inicial
    if (!id) {
      alert("ID de cotización no válido");
      return;
    }

    // Confirmación con mensaje detallado
    const confirmacion = window.confirm(
      "¿Estás seguro de que deseas eliminar esta cotización?\nEsta acción no se puede deshacer."
    );

    if (!confirmacion) return;

    try {
      // Mostrar indicador de carga
      setLoading(true);

      const response = await fetch(`${apiUrl}/api/buscarCotizaciones/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Error al eliminar la cotización");
      }

      // Mostrar mensaje de éxito
      alert("Cotización eliminada exitosamente");
      
      // Recargar la lista de cotizaciones
      await cargarCotizaciones();
    } catch (error) {
      console.error("Error al eliminar la cotización:", error);
      alert(error.message || "Ocurrió un error al eliminar la cotización");
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/cotizaciones/${id}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Error al descargar el PDF');
      }

      // Crear un blob con la respuesta
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Crear un enlace temporal y hacer clic en él
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al descargar el PDF');
    }
  };

  const enviarCorreo = async (id) => {
    try {
      setLoading(true);
      
      // 1. Primero generamos el PDF en el servidor
      const response = await fetch(`${apiUrl}/api/cotizaciones/${id}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Error al generar el PDF');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Error al generar el PDF en el servidor');
      }

      // 2. Obtener información de la cotización para personalizar el asunto
      const cotizacion = cotizaciones.find(c => c.id === id);
      const numeroFormateado = cotizacion ? cotizacion.numero_cotizacion : id;
      
      // 3. Abrir el cliente de correo con un mensaje personalizado
      const subject = encodeURIComponent(`Cotización MUNDOGRAFIC #${numeroFormateado}`);
      const body = encodeURIComponent(
        "Estimado cliente,\n\n" +
        "Adjunto encontrará la cotización solicitada.\n\n" +
        "Saludos cordiales,\n" +
        "Equipo MUNDOGRAFIC"
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;

      // 4. Descargar el PDF automáticamente
      const pdfResponse = await fetch(`${apiUrl}${data.filePath}`);
      if (!pdfResponse.ok) {
        throw new Error('Error al descargar el PDF');
      }
      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 5. Mostrar instrucciones al usuario
      setTimeout(() => {
        alert(
          "Se ha abierto su cliente de correo y se ha descargado el PDF.\n\n" +
          "Por favor:\n" +
          "1. Localice el PDF descargado\n" +
          "2. Adjúntelo al correo que se acaba de abrir\n" +
          "3. Complete la dirección de correo del destinatario"
        );
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al preparar el correo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/cotizaciones")}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <span className="mr-2">←</span> Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Ver Cotizaciones</h1>
        <div></div>
      </div>

      {/* Filtros Simplificados */}
      <form onSubmit={aplicarFiltros} className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por N° o Cliente</label>
            <input
              type="text"
              name="busqueda"
              value={filtros.busqueda}
              onChange={handleFiltroChange}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Número de cotización o nombre del cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input
              type="date"
              name="fechaDesde"
              value={filtros.fechaDesde}
              onChange={handleFiltroChange}
              className="w-[150px] border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input
              type="date"
              name="fechaHasta"
              value={filtros.fechaHasta}
              onChange={handleFiltroChange}
              className="w-[150px] border border-gray-300 rounded-md p-2"
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

      {/* Tabla de Cotizaciones */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Cotización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RUC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ejecutivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cotizaciones.length > 0 ? (
                cotizaciones.map((cotizacion) => (
                  <tr key={cotizacion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cotizacion.numero_cotizacion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cotizacion.ruc}
                    </td>
                    <td className="px-6 py-4">{cotizacion.nombre_cliente}</td>
                    <td className="px-6 py-4">{cotizacion.nombre_ejecutivo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(cotizacion.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cotizacion.estado === "aprobada"
                            ? "bg-green-100 text-green-800"
                            : cotizacion.estado === "rechazada"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {cotizacion.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${formatearTotal(cotizacion.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => editarCotizacion(cotizacion.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarCotizacion(cotizacion.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => descargarPDF(cotizacion.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Descargar PDF
                      </button>
                      <button
                        onClick={() => enviarCorreo(cotizacion.id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Enviar al correo
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron cotizaciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default CotizacionesVer; 