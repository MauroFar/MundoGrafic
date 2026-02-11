import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaDownload, FaEnvelope, FaEye, FaTimes, FaUser, FaCalendar, FaFileAlt, FaDollarSign, FaHistory, FaClipboardList } from 'react-icons/fa';
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
  id_cotizacion?: number;
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
  const [showCotizacionModal, setShowCotizacionModal] = useState<boolean>(false);
  const [cotizacionDetalle, setCotizacionDetalle] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [ordenToDelete, setOrdenToDelete] = useState<OrdenTrabajo | null>(null);
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
    
    // Buscar la orden para mostrar información en el modal
    const orden = ordenes.find(o => o.id === id);
    setOrdenToDelete(orden || null);
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!ordenToDelete) return;

    try {
      setLoading(true);
      setShowDeleteModal(false);
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/api/ordenTrabajo/eliminar/${ordenToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar la orden");
      
      toast.success("✅ Orden eliminada exitosamente");
      setOrdenToDelete(null);
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

  const imprimirPDF = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${id}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener el PDF');
      const pdfBlob = await response.blob();
      if (pdfBlob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
      
      // Crear URL del blob y abrirlo en nueva ventana para impresión
      const url = window.URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        toast.error('No se pudo abrir la ventana de impresión. Por favor, permite ventanas emergentes.');
      }
      
      // Limpiar URL después de un tiempo
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      
      toast.success('✅ Abriendo vista de impresión');
    } catch (error: any) {
      toast.error('Error al imprimir el PDF: ' + error.message);
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
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la orden de trabajo');
      }

      const data = await response.json();
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

  const handleVerCotizacion = async (cotizacionId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/cotizaciones/${cotizacionId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la cotización');
      }

      const data = await response.json();
      setCotizacionDetalle(data);
      setShowCotizacionModal(true);
    } catch (error: any) {
      console.error('Error al cargar detalle de cotización:', error);
      toast.error('Error al cargar los detalles de la cotización');
    }
  };

  const handleCerrarCotizacionModal = () => {
    setShowCotizacionModal(false);
    setCotizacionDetalle(null);
  };

  const formatearTotal = (total: any) => {
    if (total === null || total === undefined) return "0.00";
    const numero = typeof total === 'string' ? parseFloat(total) : total;
    return isNaN(numero) ? "0.00" : numero.toFixed(2);
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
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleVerDetalle(orden.id)}
                >
                  <td className="px-6 py-4 border-b">{orden.numero_orden}</td>
                  <td className="px-6 py-4 border-b">{orden.nombre_cliente}</td>
                  <td className="px-6 py-4 border-b">{orden.concepto}</td>
                  <td className="px-6 py-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      orden.tipo_orden === 'digital' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {orden.tipo_orden === 'digital' ? 'Digital' : 'Offset'}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b">{orden.fecha_creacion?.slice(0,10)}</td>
                  <td className="px-6 py-4 border-b">
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
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
                      {orden.id_cotizacion && (
                        <button
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded flex flex-col items-center"
                          onClick={() => handleVerCotizacion(orden.id_cotizacion!)}
                          title="Ver Cotización"
                        >
                          <FaFileAlt />
                          <span className="text-xs mt-1 text-gray-600">Ver Cotización</span>
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
                  <h2 className="text-2xl font-bold mb-2">
                    Detalles de la Orden de Trabajo - {ordenDetalle.tipo_orden === 'digital' ? 'Digital' : 'Offset'}
                  </h2>
                  <div className="text-green-100 text-lg font-semibold">
                    Orden N° {ordenDetalle.numero_orden}
                  </div>
                  {ordenDetalle.numero_cotizacion && (
                    <div className="text-green-200 text-sm">
                      Cotización: {ordenDetalle.numero_cotizacion}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {ordenDetalle.tipo_orden === 'offset' && (
                    <>
                      {ordenDetalle.fecha_creacion && (
                        <div className="text-right">
                          <div className="text-green-200 text-xs">Fecha de Creación</div>
                          <div className="text-white text-sm font-semibold">
                            {new Date(ordenDetalle.fecha_creacion).toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                      {ordenDetalle.fecha_entrega && (
                        <div className="text-right">
                          <div className="text-green-200 text-xs">Fecha de Entrega</div>
                          <div className="text-white text-sm font-semibold">
                            {new Date(ordenDetalle.fecha_entrega).toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={handleCerrarDetalleModal}
                    className="text-white hover:bg-green-500 rounded-full p-2 transition-colors"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              {ordenDetalle.estado && (
                <div className="mt-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      ordenDetalle.estado.toLowerCase() === "en producción"
                        ? "bg-blue-500 text-white"
                        : ordenDetalle.estado.toLowerCase() === "completado"
                        ? "bg-green-500 text-white"
                        : ordenDetalle.estado.toLowerCase() === "pendiente"
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {ordenDetalle.estado.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Detalles específicos según tipo de orden */}
              {ordenDetalle.tipo_orden === 'digital' ? (
                /* Detalles para Orden Digital */
                <div className="space-y-6">
                  {/* Información del Cliente */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                      <FaUser className="mr-2 text-green-600" />
                      Información del Cliente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.nombre_cliente || 'N/A'}</p>
                      </div>
                      {ordenDetalle.contacto && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Contacto</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.contacto}</p>
                        </div>
                      )}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Email</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.email || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Teléfono</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.telefono || 'N/A'}</p>
                      </div>
                      {ordenDetalle.orden_compra && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Orden de Compra</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.orden_compra}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalles de la Orden */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                      <FaFileAlt className="mr-2 text-green-600" />
                      Detalles de la Orden
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                        <FaCalendar className="text-green-600 mr-3" />
                        <div>
                          <label className="text-sm text-gray-500 block">Fecha de Creación</label>
                          <p className="text-gray-900 font-medium">
                            {ordenDetalle.fecha_creacion 
                              ? new Date(ordenDetalle.fecha_creacion).toLocaleDateString('es-EC', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                        <FaCalendar className="text-green-600 mr-3" />
                        <div>
                          <label className="text-sm text-gray-500 block">Fecha de Entrega</label>
                          <p className="text-gray-900 font-medium">
                            {ordenDetalle.fecha_entrega 
                              ? new Date(ordenDetalle.fecha_entrega).toLocaleDateString('es-EC', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Concepto</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.concepto || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Cantidad</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.cantidad || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Responsables del Proceso */}
                  {(ordenDetalle.vendedor || ordenDetalle.preprensa || ordenDetalle.prensa || 
                    ordenDetalle.terminados || ordenDetalle.laminado_barnizado || ordenDetalle.troquelado || 
                    ordenDetalle.liberacion_producto || ordenDetalle.facturado) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaClipboardList className="mr-2 text-green-600" />
                        Responsables del Proceso
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ordenDetalle.vendedor && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <label className="text-xs text-gray-600 block mb-1">Vendedor</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.vendedor}</p>
                          </div>
                        )}
                        {ordenDetalle.preprensa && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <label className="text-xs text-gray-600 block mb-1">Pre-prensa</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.preprensa}</p>
                          </div>
                        )}
                        {ordenDetalle.prensa && (
                          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                            <label className="text-xs text-gray-600 block mb-1">Impresión</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.prensa}</p>
                          </div>
                        )}
                        {ordenDetalle.laminado_barnizado && (
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <label className="text-xs text-gray-600 block mb-1">Laminado/Barnizado</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.laminado_barnizado}</p>
                          </div>
                        )}
                        {ordenDetalle.troquelado && (
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <label className="text-xs text-gray-600 block mb-1">Troquelado</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.troquelado}</p>
                          </div>
                        )}
                        {ordenDetalle.terminados && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <label className="text-xs text-gray-600 block mb-1">Terminados</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.terminados}</p>
                          </div>
                        )}
                        {ordenDetalle.liberacion_producto && (
                          <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                            <label className="text-xs text-gray-600 block mb-1">Liberación Producto</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.liberacion_producto}</p>
                          </div>
                        )}
                        {ordenDetalle.facturado && (
                          <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                            <label className="text-xs text-gray-600 block mb-1">Facturado</label>
                            <p className="text-gray-900 font-medium text-sm">{ordenDetalle.facturado}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Información del Trabajo - Digital */}
                  {ordenDetalle.detalle?.productos_digital && 
                   ordenDetalle.detalle.productos_digital.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaClipboardList className="mr-2 text-green-600" />
                        Información del Trabajo
                      </h3>
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cantidad</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cod MG</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cod Cliente</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Producto</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Avance (mm)</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Medida Ancho (mm)</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Medida Alto (mm)</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cavidad</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Metros Impresos</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ordenDetalle.detalle.productos_digital.map((producto: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cantidad || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cod_mg || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cod_cliente || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.producto || producto.descripcion || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.avance || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.medida_ancho || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.medida_alto || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cavidad || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.metros_impresos || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Información Técnica - Digital */}
                  {(ordenDetalle.detalle?.adherencia || ordenDetalle.detalle?.material || 
                    ordenDetalle.detalle?.impresion || ordenDetalle.detalle?.tipo_impresion) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaClipboardList className="mr-2 text-green-600" />
                        Información Técnica
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ordenDetalle.detalle?.adherencia && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Adherencia</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.adherencia}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.material && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Material</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.material}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.lote_material && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Lote Material</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.lote_material}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.lote_produccion && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Lote de Producción</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.lote_produccion}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.impresion && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Impresión</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.impresion}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.tipo_impresion && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Tipo de Impresión</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.tipo_impresion}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.troquel && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Troquel</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.troquel}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.codigo_troquel && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Código Troquel</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.codigo_troquel}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.numero_salida && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Número de Salida</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.numero_salida}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Detalles para Orden Offset */
                <div className="space-y-6">
                  {/* 1. Información del Cliente */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                      <FaUser className="mr-2 text-green-600" />
                      Información del Cliente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.nombre_cliente || 'N/A'}</p>
                      </div>
                      {ordenDetalle.contacto && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Contacto</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.contacto}</p>
                        </div>
                      )}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Email</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.email || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="text-sm text-gray-500 block mb-1">Teléfono</label>
                        <p className="text-gray-900 font-medium">{ordenDetalle.telefono || 'N/A'}</p>
                      </div>
                      {ordenDetalle.orden_compra && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Orden de Compra</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.orden_compra}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Información del Trabajo */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                      <FaClipboardList className="mr-2 text-green-600" />
                      Información del Trabajo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ordenDetalle.concepto && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Concepto</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.concepto}</p>
                        </div>
                      )}
                      {ordenDetalle.cantidad && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Cantidad</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.cantidad}</p>
                        </div>
                      )}
                      {ordenDetalle.detalle?.tamano_abierto_1 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Tamaño Abierto</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.tamano_abierto_1}</p>
                        </div>
                      )}
                      {ordenDetalle.detalle?.tamano_cerrado_1 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Tamaño Cerrado</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.tamano_cerrado_1}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Material y Corte */}
                  {(ordenDetalle.detalle?.material || ordenDetalle.detalle?.corte_material) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaClipboardList className="mr-2 text-green-600" />
                        Material y Corte
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ordenDetalle.detalle?.material && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Material</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.material}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.corte_material && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Corte de Material</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.corte_material}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. Cantidad de Pliegos */}
                  {(ordenDetalle.detalle?.cantidad_pliegos_compra || ordenDetalle.detalle?.exceso || ordenDetalle.detalle?.total_pliegos) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaClipboardList className="mr-2 text-green-600" />
                        Cantidad de Pliegos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {ordenDetalle.detalle?.cantidad_pliegos_compra && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Pliegos de Compra</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.cantidad_pliegos_compra}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.exceso && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Exceso</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.exceso}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.total_pliegos && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Total</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.total_pliegos}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. Impresión y Acabados */}
                  {(ordenDetalle.detalle?.impresion || ordenDetalle.detalle?.instrucciones_impresion || 
                    ordenDetalle.detalle?.instrucciones_acabados || ordenDetalle.detalle?.instrucciones_empacado) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaClipboardList className="mr-2 text-green-600" />
                        Impresión y Acabados
                      </h3>
                      <div className="space-y-4">
                        {ordenDetalle.detalle?.impresion && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Impresión</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.impresion}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.instrucciones_impresion && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <label className="text-sm text-gray-600 block mb-2 font-semibold">Instrucciones de Impresión</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.instrucciones_impresion}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.instrucciones_acabados && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <label className="text-sm text-gray-600 block mb-2 font-semibold">Instrucciones de Acabados</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.instrucciones_acabados}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.instrucciones_empacado && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <label className="text-sm text-gray-600 block mb-2 font-semibold">Instrucciones de Empacado</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.instrucciones_empacado}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6. Prensa y Observaciones */}
                  {(ordenDetalle.detalle?.prensa_seleccionada || ordenDetalle.detalle?.observaciones || 
                    ordenDetalle.notas_observaciones) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaClipboardList className="mr-2 text-green-600" />
                        Prensa y Observaciones
                      </h3>
                      <div className="space-y-4">
                        {ordenDetalle.detalle?.prensa_seleccionada && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Prensa Seleccionada</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.prensa_seleccionada}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.observaciones && (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <label className="text-sm text-gray-600 block mb-2 font-semibold">Observaciones Generales</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.detalle.observaciones}</p>
                          </div>
                        )}
                        {ordenDetalle.notas_observaciones && (
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <label className="text-sm text-gray-600 block mb-2 font-semibold">Notas Adicionales</label>
                            <p className="text-gray-900 whitespace-pre-wrap">{ordenDetalle.notas_observaciones}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Notas y Observaciones */}
              {ordenDetalle.notas_observaciones && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-green-600" />
                    Notas y Observaciones
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{ordenDetalle.notas_observaciones}</p>
                  </div>
                </div>
              )}

              {/* Responsables del Proceso */}
              {(ordenDetalle.vendedor || ordenDetalle.preprensa || ordenDetalle.prensa || 
                ordenDetalle.terminados || ordenDetalle.facturado) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaClipboardList className="mr-2 text-green-600" />
                    Responsables del Proceso
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {ordenDetalle.vendedor && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <label className="text-xs text-gray-600 block mb-1">Vendedor</label>
                        <p className="text-gray-900 font-medium text-sm">{ordenDetalle.vendedor}</p>
                      </div>
                    )}
                    {ordenDetalle.preprensa && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <label className="text-xs text-gray-600 block mb-1">Pre-prensa</label>
                        <p className="text-gray-900 font-medium text-sm">{ordenDetalle.preprensa}</p>
                      </div>
                    )}
                    {ordenDetalle.prensa && (
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                        <label className="text-xs text-gray-600 block mb-1">Offset</label>
                        <p className="text-gray-900 font-medium text-sm">{ordenDetalle.prensa}</p>
                      </div>
                    )}
                    {ordenDetalle.terminados && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <label className="text-xs text-gray-600 block mb-1">Terminados</label>
                        <p className="text-gray-900 font-medium text-sm">{ordenDetalle.terminados}</p>
                      </div>
                    )}
                    {ordenDetalle.facturado && (
                      <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                        <label className="text-xs text-gray-600 block mb-1">Facturado</label>
                        <p className="text-gray-900 font-medium text-sm">{ordenDetalle.facturado}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Información de Auditoría */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaHistory className="mr-2 text-green-600" />
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
                {puedeEditar('ordenes_trabajo') && (
                  <button
                    onClick={() => {
                      handleCerrarDetalleModal();
                      editarOrden(ordenDetalle.id);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FaEdit />
                    Editar Orden
                  </button>
                )}
                <button
                  onClick={() => {
                    handleCerrarDetalleModal();
                    verPDF(ordenDetalle.id);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaEye />
                  Ver PDF
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

      {/* Modal de Detalles de Cotización */}
      {showCotizacionModal && cotizacionDetalle && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCerrarCotizacionModal}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Detalles de la Cotización</h2>
                  <div className="text-blue-100 text-lg font-semibold">
                    {cotizacionDetalle.codigo_cotizacion || `COT${String(cotizacionDetalle.id).padStart(10, '0')}`}
                  </div>
                </div>
                <button
                  onClick={handleCerrarCotizacionModal}
                  className="text-white hover:bg-blue-500 rounded-full p-2 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="mt-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    cotizacionDetalle.estado === "aprobada"
                      ? "bg-green-500 text-white"
                      : cotizacionDetalle.estado === "rechazada"
                      ? "bg-red-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {cotizacionDetalle.estado?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información del Cliente */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaUser className="mr-2 text-blue-600" />
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.empresa_cliente || cotizacionDetalle.nombre_cliente || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Email</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.email_cliente || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Ejecutivo</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.nombre_ejecutivo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Detalles de la Cotización */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaFileAlt className="mr-2 text-blue-600" />
                  Detalles de la Cotización
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <FaCalendar className="text-blue-600 mr-3" />
                    <div>
                      <label className="text-sm text-gray-500 block">Fecha</label>
                      <p className="text-gray-900 font-medium">
                        {cotizacionDetalle.fecha 
                          ? new Date(cotizacionDetalle.fecha).toLocaleDateString('es-EC', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">RUC</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.ruc || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Tiempo de Entrega</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.tiempo_entrega || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Productos y Montos */}
              {cotizacionDetalle.detalles && cotizacionDetalle.detalles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaDollarSign className="mr-2 text-blue-600" />
                    Productos y Valores
                  </h3>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Cant.</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Detalle</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">P. Unit.</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cotizacionDetalle.detalles.map((detalle: any, index: number) => (
                            <tr key={detalle.id || index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 border-b text-center">
                                <span className="font-semibold text-gray-900">{detalle.cantidad}</span>
                              </td>
                              <td className="px-4 py-3 border-b">
                                <p className="text-gray-900 whitespace-pre-wrap">{detalle.detalle}</p>
                              </td>
                              <td className="px-4 py-3 border-b text-right text-gray-900">
                                ${formatearTotal(detalle.precio_unitario)}
                              </td>
                              <td className="px-4 py-3 border-b text-right">
                                <span className="font-semibold text-gray-900">${formatearTotal(detalle.subtotal)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Resumen de totales */}
                    <div className="bg-gray-50 p-4 border-t-2 border-gray-300">
                      <div className="max-w-md ml-auto space-y-2">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">Subtotal:</span>
                          <span className="text-gray-900 font-semibold text-lg">${formatearTotal(cotizacionDetalle.subtotal)}</span>
                        </div>
                        {parseFloat(cotizacionDetalle.descuento || 0) > 0 && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700 font-medium">Descuento:</span>
                            <span className="text-red-600 font-semibold text-lg">-${formatearTotal(cotizacionDetalle.descuento)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-700 font-medium">IVA (15%):</span>
                          <span className="text-gray-900 font-semibold text-lg">${formatearTotal(cotizacionDetalle.iva)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-t-2 border-gray-400">
                          <span className="text-gray-900 font-bold text-lg">Total:</span>
                          <span className="text-blue-600 font-bold text-2xl">${formatearTotal(cotizacionDetalle.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Observaciones */}
              {cotizacionDetalle.observaciones && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-blue-600" />
                    Observaciones
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{cotizacionDetalle.observaciones}</p>
                  </div>
                </div>
              )}

              {/* Botón de Cerrar */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleCerrarCotizacionModal}
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && ordenToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                ¿Estás seguro de que deseas eliminar la orden de trabajo <strong>N° {ordenToDelete.numero_orden}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Cliente: <strong>{ordenToDelete.nombre_cliente}</strong>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta acción no se puede deshacer y eliminará permanentemente la orden y todos sus detalles.
              </p>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setOrdenToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenesVer; 