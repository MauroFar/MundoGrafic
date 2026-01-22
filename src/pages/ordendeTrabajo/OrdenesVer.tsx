import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaDownload, FaEnvelope, FaEye, FaTimes, FaUserFriends, FaFileAlt, FaTools, FaHistory } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usePermisos } from '../../hooks/usePermisos';

interface OrdenTrabajo {
  id: number;
  numero_orden: string;
  nombre_cliente: string;
  concepto: string;
  fecha_creacion?: string;
  estado?: string;
  email_cliente?: string;
  tipo_orden?: string;
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
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState<boolean>(false);
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null);
  const { puedeEditar, puedeEliminar, verificarYMostrarError } = usePermisos();

  useEffect(() => {
    setPagina(1);
    cargarOrdenes(true);
    // eslint-disable-next-line
  }, []);

  const cargarOrdenes = async (reset = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filtros.busqueda) queryParams.append("busqueda", filtros.busqueda);
      if (filtros.fechaDesde) queryParams.append("fechaDesde", filtros.fechaDesde);
      if (filtros.fechaHasta) queryParams.append("fechaHasta", filtros.fechaHasta);
      queryParams.append("limite", LIMITE_POR_PAGINA.toString());
      const url = `${apiUrl}/api/ordenTrabajo/listar?${queryParams}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
    if (!verificarYMostrarError('ordenes_trabajo', 'eliminar', 'eliminar esta orden de trabajo')) {
      return;
    }
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta orden de trabajo?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/eliminar/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Error al eliminar la orden");
      toast.success("✅ Orden eliminada exitosamente");
      cargarOrdenes(true);
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error al eliminar la orden");
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (id: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
      toast.success('✅ PDF descargado exitosamente');
    } catch (error: any) {
      toast.error('Error al descargar el PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verPDF = async (id: number) => {
    try {
      console.log('🔍 Iniciando vista previa de PDF para orden:', id);
      setPreviewUrl(null);
      setShowPreview(true);
      setPreviewLoading(true);
      
      console.log('📡 Solicitando PDF al backend...');
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${id}/preview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('📥 Respuesta recibida:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ Error en respuesta:', response.status);
        throw new Error('Error al obtener el PDF');
      }
      
      const data = await response.json();
      console.log('📦 Datos recibidos:', data.success);
      
      if (!data.success || !data.pdf) {
        console.error('❌ Respuesta inválida:', data);
        throw new Error('Respuesta inválida al generar vista previa');
      }
      
      console.log('✅ PDF en base64 recibido');
      setPreviewUrl(data.pdf);
      console.log('🎉 Vista previa lista para mostrar');
    } catch (error: any) {
      console.error('❌ Error en verPDF:', error);
      toast.error('Error al cargar el PDF: ' + error.message);
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const cerrarPreview = () => {
    setShowPreview(false);
    setPreviewUrl(null);
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

  const handleVerDetalle = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/orden/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la orden');
      }

      const data = await response.json();
      
      // Aplanar los campos de detalle al nivel principal para facilitar el acceso
      if (data.detalle) {
        Object.keys(data.detalle).forEach(key => {
          if (!data[key]) { // Solo si no existe ya en el nivel principal
            data[key] = data.detalle[key];
          }
        });
      }
      
      setOrdenDetalle(data);
      setShowDetalleModal(true);
    } catch (error: any) {
      console.error('Error al cargar detalle:', error);
      toast.error('Error al cargar los detalles de la orden de trabajo');
    }
  };

  const handleCerrarDetalleModal = () => {
    setShowDetalleModal(false);
    setOrdenDetalle(null);
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
                <th className="px-6 py-3 border-b text-left">Tipo</th>
                <th className="px-6 py-3 border-b text-left">Fecha</th>
                <th className="px-6 py-3 border-b text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr 
                  key={orden.id} 
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleVerDetalle(orden.id)}
                >
                  <td className="px-6 py-4 border-b">{orden.numero_orden}</td>
                  <td className="px-6 py-4 border-b">{orden.nombre_cliente}</td>
                  <td className="px-6 py-4 border-b">{orden.concepto}</td>
                  <td className="px-6 py-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      orden.tipo_orden === 'digital' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {orden.tipo_orden === 'digital' ? 'DIGITAL' : 'OFFSET'}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b">{orden.fecha_creacion?.slice(0,10)}</td>
                  <td className="px-6 py-4 border-b" onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                      <button
                        className="p-2 text-green-600 hover:bg-green-100 rounded flex flex-col items-center"
                        onClick={() => verPDF(orden.id)}
                        title="Ver PDF/Imprimir"
                      >
                        <FaEye />
                        <span className="text-xs mt-1 text-gray-600">Ver PDF/Imprimir</span>
                      </button>
                      {puedeEditar('ordenes_trabajo') && (
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded flex flex-col items-center"
                          onClick={() => editarOrden(orden.id)}
                          title="Editar"
                        >
                          <FaEdit />
                          <span className="text-xs mt-1 text-gray-600">Editar</span>
                        </button>
                      )}
                      {puedeEliminar('ordenes_trabajo') && !(orden.estado && orden.estado.toLowerCase() === "en producción") && (
                        <button
                          className="p-2 text-red-600 hover:bg-red-100 rounded flex flex-col items-center"
                          onClick={() => eliminarOrden(orden.id)}
                          title="Eliminar"
                        >
                          <FaTrash />
                          <span className="text-xs mt-1 text-gray-600">Eliminar</span>
                        </button>
                      )}
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded flex flex-col items-center"
                        onClick={() => descargarPDF(orden.id)}
                        title="Descargar PDF"
                      >
                        <FaDownload />
                        <span className="text-xs mt-1 text-gray-600">Descargar</span>
                      </button>
                      {orden.estado && orden.estado.toLowerCase() === "en producción" ? (
                        <button
                          className="p-2 text-gray-400 bg-gray-200 rounded cursor-not-allowed flex flex-col items-center"
                          disabled
                          title="En Producción"
                        >
                          <span className="font-bold text-xs">En Producción</span>
                        </button>
                      ) : (
                        <button
                          className="p-2 text-green-600 hover:bg-green-100 rounded flex flex-col items-center"
                          onClick={() => setModalProduccionId(orden.id)}
                          title="Enviar a Producción"
                        >
                          <span className="font-bold text-xs">Enviar a Producción</span>
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

      {/* Modal de Preview de PDF */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vista Previa del PDF</h2>
              <button
                onClick={cerrarPreview}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generando vista previa...</p>
                  </div>
                </div>
              ) : (
                <object
                  data={previewUrl || ''}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <p>No se puede mostrar el PDF. Por favor, intente nuevamente.</p>
                </object>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Orden de Trabajo */}
      {showDetalleModal && ordenDetalle && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCerrarDetalleModal}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Detalles de la Orden de Trabajo</h2>
                  <div className="text-green-100 text-lg font-semibold">
                    Orden N° {ordenDetalle.numero_orden}
                  </div>
                </div>
                <button
                  onClick={handleCerrarDetalleModal}
                  className="text-white hover:bg-green-500 rounded-full p-2 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="mt-3">
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white text-green-700">
                  {ordenDetalle.estado?.toUpperCase() || 'PENDIENTE'}
                </span>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información del Cliente */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaUserFriends className="mr-2 text-green-600" />
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                    <p className="text-gray-900 font-medium">{ordenDetalle.nombre_cliente || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Contacto</label>
                    <p className="text-gray-900 font-medium">{ordenDetalle.contacto || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Teléfono</label>
                    <p className="text-gray-900 font-medium">{ordenDetalle.telefono || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Email</label>
                    <p className="text-gray-900 font-medium">{ordenDetalle.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la Orden */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaFileAlt className="mr-2 text-green-600" />
                  Detalles de la Orden
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">N° Cotización</label>
                    <p className="text-gray-900 font-medium">{ordenDetalle.numero_cotizacion || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Fecha Creación</label>
                    <p className="text-gray-900 font-medium">
                      {ordenDetalle.fecha_creacion 
                        ? new Date(ordenDetalle.fecha_creacion).toLocaleDateString('es-EC')
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Fecha Entrega</label>
                    <p className="text-gray-900 font-medium">
                      {ordenDetalle.fecha_entrega 
                        ? new Date(ordenDetalle.fecha_entrega).toLocaleDateString('es-EC')
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Concepto y Cantidad */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaTools className="mr-2 text-green-600" />
                  Trabajo a Realizar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Concepto</label>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{ordenDetalle.concepto || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Cantidad</label>
                    <p className="text-gray-900 font-medium text-2xl">{ordenDetalle.cantidad || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Tipo de Orden</label>
                    <p className="text-gray-900 font-medium">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        ordenDetalle.tipo_orden === 'digital' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {ordenDetalle.tipo_orden === 'digital' ? 'DIGITAL' : 'OFFSET'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalles Técnicos OFFSET */}
              {ordenDetalle.tipo_orden === 'offset' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaTools className="mr-2 text-blue-600" />
                    Especificaciones Técnicas - Impresión Offset
                  </h3>
                  <div className="space-y-4">
                    {/* Material y Corte */}
                    {(ordenDetalle.material || ordenDetalle.corte_material) && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-3">Material y Corte</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {ordenDetalle.material && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Material</label>
                              <p className="text-gray-900">{ordenDetalle.material}</p>
                            </div>
                          )}
                          {ordenDetalle.corte_material && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Corte de Material</label>
                              <p className="text-gray-900">{ordenDetalle.corte_material}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pliegos */}
                    {(ordenDetalle.cantidad_pliegos_compra || ordenDetalle.exceso || ordenDetalle.total_pliegos) && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Información de Pliegos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {ordenDetalle.cantidad_pliegos_compra && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Pliegos a Comprar</label>
                              <p className="text-gray-900 font-medium">{ordenDetalle.cantidad_pliegos_compra}</p>
                            </div>
                          )}
                          {ordenDetalle.exceso && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Exceso</label>
                              <p className="text-gray-900 font-medium">{ordenDetalle.exceso}</p>
                            </div>
                          )}
                          {ordenDetalle.total_pliegos && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Total Pliegos</label>
                              <p className="text-gray-900 font-medium text-lg">{ordenDetalle.total_pliegos}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tamaños */}
                    {(ordenDetalle.tamano || ordenDetalle.tamano_abierto_1 || ordenDetalle.tamano_cerrado_1) && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Tamaños</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {ordenDetalle.tamano && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Tamaño</label>
                              <p className="text-gray-900">{ordenDetalle.tamano}</p>
                            </div>
                          )}
                          {ordenDetalle.tamano_abierto_1 && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Tamaño Abierto</label>
                              <p className="text-gray-900">{ordenDetalle.tamano_abierto_1}</p>
                            </div>
                          )}
                          {ordenDetalle.tamano_cerrado_1 && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Tamaño Cerrado</label>
                              <p className="text-gray-900">{ordenDetalle.tamano_cerrado_1}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prensa e Impresión */}
                    {(ordenDetalle.prensa_seleccionada || ordenDetalle.impresion) && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-3">Impresión</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {ordenDetalle.prensa_seleccionada && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Prensa Seleccionada</label>
                              <p className="text-gray-900 font-medium">{ordenDetalle.prensa_seleccionada}</p>
                            </div>
                          )}
                          {ordenDetalle.impresion && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1">Tipo de Impresión</label>
                              <p className="text-gray-900">{ordenDetalle.impresion}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Instrucciones */}
                    {(ordenDetalle.instrucciones_impresion || ordenDetalle.instrucciones_acabados || ordenDetalle.instrucciones_empacado) && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-yellow-800 mb-3">Instrucciones</h4>
                        <div className="space-y-3">
                          {ordenDetalle.instrucciones_impresion && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1 font-semibold">Impresión</label>
                              <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.instrucciones_impresion}</p>
                            </div>
                          )}
                          {ordenDetalle.instrucciones_acabados && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1 font-semibold">Acabados</label>
                              <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.instrucciones_acabados}</p>
                            </div>
                          )}
                          {ordenDetalle.instrucciones_empacado && (
                            <div>
                              <label className="text-sm text-gray-600 block mb-1 font-semibold">Empacado</label>
                              <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.instrucciones_empacado}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {ordenDetalle.observaciones && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-600 block mb-2 font-semibold">Observaciones Adicionales</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detalles Técnicos DIGITAL */}
              {ordenDetalle.tipo_orden === 'digital' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaTools className="mr-2 text-purple-600" />
                    Especificaciones Técnicas - Impresión Digital
                  </h3>
                  <div className="space-y-4">
                    {/* Productos Digital */}
                    {ordenDetalle.productos_digital && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-3">Productos</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white rounded-lg">
                            <thead className="bg-purple-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Cantidad</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Cód. MG</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Cód. Cliente</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Producto</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Avance</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Medidas</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Cavidad</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Metros</th>
                              </tr>
                            </thead>
                            <tbody>
                              {JSON.parse(ordenDetalle.productos_digital).map((producto: any, index: number) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm">{producto.cantidad}</td>
                                  <td className="px-3 py-2 text-sm">{producto.cod_mg}</td>
                                  <td className="px-3 py-2 text-sm">{producto.cod_cliente}</td>
                                  <td className="px-3 py-2 text-sm">{producto.producto}</td>
                                  <td className="px-3 py-2 text-sm">{producto.avance}</td>
                                  <td className="px-3 py-2 text-sm">{producto.medidas}</td>
                                  <td className="px-3 py-2 text-sm">{producto.cavidad}</td>
                                  <td className="px-3 py-2 text-sm">{producto.metros}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Información Técnica Digital */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Información Técnica</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ordenDetalle.adherencia && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Adherencia</label>
                            <p className="text-gray-900">{ordenDetalle.adherencia}</p>
                          </div>
                        )}
                        {ordenDetalle.tipo_impresion && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Material/Tipo Impresión</label>
                            <p className="text-gray-900">{ordenDetalle.tipo_impresion}</p>
                          </div>
                        )}
                        {ordenDetalle.troquel && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Troquel</label>
                            <p className="text-gray-900">{ordenDetalle.troquel}</p>
                          </div>
                        )}
                        {ordenDetalle.codigo_troquel && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Código Troquel</label>
                            <p className="text-gray-900">{ordenDetalle.codigo_troquel}</p>
                          </div>
                        )}
                        {ordenDetalle.lote_material && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Lote Material</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.lote_material}</p>
                          </div>
                        )}
                        {ordenDetalle.lote_produccion && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Lote Producción</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.lote_produccion}</p>
                          </div>
                        )}
                        {ordenDetalle.terminado_etiqueta && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Terminado Etiqueta</label>
                            <p className="text-gray-900">{ordenDetalle.terminado_etiqueta}</p>
                          </div>
                        )}
                        {ordenDetalle.terminados_especiales && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Terminados Especiales</label>
                            <p className="text-gray-900">{ordenDetalle.terminados_especiales}</p>
                          </div>
                        )}
                        {ordenDetalle.cantidad_por_rollo && (
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">Cantidad por Rollo</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.cantidad_por_rollo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Responsables del Proceso */}
              {(ordenDetalle.vendedor || ordenDetalle.preprensa || ordenDetalle.prensa || ordenDetalle.terminados || ordenDetalle.facturado) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaUserFriends className="mr-2 text-green-600" />
                    Responsables del Proceso
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ordenDetalle.vendedor && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="text-sm text-gray-600 block mb-1 font-semibold">Vendedor</label>
                        <p className="text-gray-900">{ordenDetalle.vendedor}</p>
                      </div>
                    )}
                    {ordenDetalle.preprensa && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <label className="text-sm text-gray-600 block mb-1 font-semibold">Preprensa</label>
                        <p className="text-gray-900">{ordenDetalle.preprensa}</p>
                      </div>
                    )}
                    {ordenDetalle.prensa && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <label className="text-sm text-gray-600 block mb-1 font-semibold">Prensa</label>
                        <p className="text-gray-900">{ordenDetalle.prensa}</p>
                      </div>
                    )}
                    {ordenDetalle.terminados && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <label className="text-sm text-gray-600 block mb-1 font-semibold">Terminados</label>
                        <p className="text-gray-900">{ordenDetalle.terminados}</p>
                      </div>
                    )}
                    {ordenDetalle.facturado && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <label className="text-sm text-gray-600 block mb-1 font-semibold">Facturado</label>
                        <p className="text-gray-900">{ordenDetalle.facturado}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {ordenDetalle.notas_observaciones && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-green-600" />
                    Observaciones
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{ordenDetalle.notas_observaciones}</p>
                  </div>
                </div>
              )}
              {/* Información de Auditoría */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaHistory className="mr-2 text-blue-600" />
                  Auditoría
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <label className="text-sm text-gray-600 block mb-2 font-semibold">
                      Creado por
                    </label>
                    <p className="text-gray-900 font-medium mb-1">
                      {ordenDetalle.created_by_nombre || 'Sistema'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ordenDetalle.created_at 
                        ? new Date(ordenDetalle.created_at).toLocaleString('es-EC', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  {ordenDetalle.updated_by_nombre && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="text-sm text-gray-600 block mb-2 font-semibold">
                        Última modificación por
                      </label>
                      <p className="text-gray-900 font-medium mb-1">
                        {ordenDetalle.updated_by_nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ordenDetalle.updated_at 
                          ? new Date(ordenDetalle.updated_at).toLocaleString('es-EC', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleCerrarDetalleModal();
                    editarOrden(ordenDetalle.id);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaEdit />
                  Editar Orden
                </button>
                <button
                  onClick={() => {
                    handleCerrarDetalleModal();
                    verPDF(ordenDetalle.id);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaEye />
                  Ver PDF/Imprimir
                </button>
                <button
                  onClick={handleCerrarDetalleModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaTimes />
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesVer; 