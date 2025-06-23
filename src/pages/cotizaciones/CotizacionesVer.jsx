import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash, FaDownload, FaEnvelope, FaEnvelopeOpen, FaCheck, FaUserFriends } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
  const [showModal, setShowModal] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState(null);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [showModalAlternativo, setShowModalAlternativo] = useState(false);
  const [emailDataAlternativo, setEmailDataAlternativo] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [sugerenciaIndex, setSugerenciaIndex] = useState(-1);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      queryParams.append("limite", "15");
      queryParams.append("ordenar", "fecha_desc");

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
      setLoading(true);
      
      // Obtener el PDF directamente
      const response = await fetch(`${apiUrl}/api/cotizaciones/${id}/pdf`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Error al obtener el PDF');
      }

      // Obtener el blob del PDF
      const pdfBlob = await response.blob();
      
      // Verificar que el blob sea un PDF válido
      if (pdfBlob.type !== 'application/pdf') {
        throw new Error('El archivo recibido no es un PDF válido');
      }

      // Crear un enlace temporal para la descarga
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'cotizacion.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename=(.+)/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      
      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Mostrar mensaje de éxito
      alert('PDF descargado exitosamente');
      return true;
    } catch (error) {
      // Solo mostrar error si realmente hubo un problema
      if (error.message !== 'Failed to fetch') {
        console.error('Error:', error);
        alert('Error al descargar el PDF: ' + error.message);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const enviarCorreo = async (id) => {
    let numeroFormateado;
    try {
      setLoading(true);

      // Obtener información de la cotización
      const cotizacion = cotizaciones.find(c => c.id === id);
      numeroFormateado = cotizacion ? cotizacion.numero_cotizacion : id;

      // Obtener el PDF
      const response = await fetch(`${apiUrl}/api/cotizaciones/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener el PDF');
      }

      const pdfBlob = await response.blob();
      
      // Crear un archivo a partir del blob
      const pdfFile = new File([pdfBlob], `Cotizacion-${numeroFormateado}.pdf`, { type: 'application/pdf' });

      // Crear un enlace para descargar el PDF
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(pdfFile);
      downloadLink.download = `Cotizacion-${numeroFormateado}.pdf`;
      
      // Descargar el PDF
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Esperar un momento para asegurar que la descarga comience
      await new Promise(resolve => setTimeout(resolve, 500));

      // Crear un enlace mailto y hacer clic en él
      const mailtoLink = document.createElement('a');
      mailtoLink.href = `mailto:?subject=Cotización MUNDOGRAFIC #${numeroFormateado}&body=Estimado cliente,%0A%0AAdjunto encontrará la cotización solicitada.%0A%0ASaludos cordiales,%0AEquipo MUNDOGRAFIC`;
      mailtoLink.target = '_blank';
      mailtoLink.rel = 'noopener noreferrer';
      document.body.appendChild(mailtoLink);
      mailtoLink.click();
      document.body.removeChild(mailtoLink);

    } catch (error) {
      console.error('Error:', error);
      // Si falla la descarga del PDF, al menos intentar abrir el correo
      try {
        if (!numeroFormateado) {
          const cotizacion = cotizaciones.find(c => c.id === id);
          numeroFormateado = cotizacion ? cotizacion.numero_cotizacion : id;
        }
        
        const mailtoLink = document.createElement('a');
        mailtoLink.href = `mailto:?subject=Cotización MUNDOGRAFIC #${numeroFormateado}&body=Estimado cliente,%0A%0AAdjunto encontrará la cotización solicitada.%0A%0ASaludos cordiales,%0AEquipo MUNDOGRAFIC`;
        mailtoLink.target = '_blank';
        mailtoLink.rel = 'noopener noreferrer';
        document.body.appendChild(mailtoLink);
        mailtoLink.click();
        document.body.removeChild(mailtoLink);
      } catch (mailError) {
        console.error('Error al abrir el correo:', mailError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarCorreoAlternativo = async (id) => {
    try {
      setLoading(true);
      const cotizacion = cotizaciones.find(c => c.id === id);
      setSelectedCotizacion(cotizacion);
      setEmailDataAlternativo({
        to: '',
        subject: `Cotización MUNDOGRAFIC #${cotizacion.numero_cotizacion}`,
        message: 'Estimado cliente,\n\nAdjunto encontrará la cotización solicitada.\n\nSaludos cordiales,\nEquipo MUNDOGRAFIC'
      });
      setShowModalAlternativo(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al preparar el envío del correo');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarCorreoAlternativoSubmit = async (e) => {
    e.preventDefault();
    setShowLoadingModal(true);
    try {
      setLoading(true);

      if (!emailDataAlternativo.to) {
        toast.error('Se requiere un correo electrónico válido');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailDataAlternativo.to)) {
        toast.error('El formato del correo electrónico no es válido');
        return;
      }

      const response = await fetch(`${apiUrl}/api/cotizaciones/${selectedCotizacion.id}/enviar-correo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailDataAlternativo.to,
          asunto: emailDataAlternativo.subject,
          mensaje: emailDataAlternativo.message
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el correo');
      }

      setShowSuccessModal(true);
      setShowModalAlternativo(false);
      setEmailDataAlternativo({ to: '', subject: '', message: '' });

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000); // El modal se oculta después de 2 segundos

    } catch (error) {
      console.error('Error detallado:', error);
      toast.error(error.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
      setShowLoadingModal(false);
    }
  };

  const handleEnviarCorreoSubmit = async () => {
    try {
      setLoading(true);
      
      // Enviar el correo a través del backend
      const response = await fetch(`${apiUrl}/api/cotizaciones/${selectedCotizacion.id}/enviar-correo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar el correo');
      }

      const data = await response.json();
      setShowModal(false);
      toast.success('Correo enviado correctamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  const aprobarCotizacion = async (id) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${apiUrl}/api/buscarCotizaciones/${id}/aprobar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al aprobar la cotización');
      }

      toast.success('✅ Cotización aprobada exitosamente');
      await cargarCotizaciones();
    } catch (error) {
      console.error('Error al aprobar la cotización:', error);
      toast.error(error.message || 'Error al aprobar la cotización');
    } finally {
      setLoading(false);
    }
  };

  // Función para buscar clientes reales
  const buscarClientes = async (q) => {
    if (!q || q.length < 2) {
      setClientesSugeridos([]);
      setShowSugerencias(false);
      return;
    }
    setLoadingClientes(true);
    try {
      const res = await fetch(`${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClientesSugeridos(data);
      setShowSugerencias(true); // Siempre mostrar si la búsqueda es válida (>=2)
      setSugerenciaIndex(-1);
    } catch (e) {
      setClientesSugeridos([]);
      setShowSugerencias(false);
    } finally {
      setLoadingClientes(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
    
        <h1 className="text-3xl font-bold text-gray-800">Ver Cotizaciones</h1>
        <div></div>
      </div>

      {/* Filtros Simplificados */}
      <form onSubmit={aplicarFiltros} className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
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

      {/* Tabla de Cotizaciones */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 border-b text-left">Número</th>
                <th className="px-6 py-3 border-b text-left">Cliente</th>
                <th className="px-6 py-3 border-b text-left">Fecha</th>
                <th className="px-6 py-3 border-b text-left">Total</th>
                <th className="px-6 py-3 border-b text-left">Estado</th>
                <th className="px-6 py-3 border-b text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((cotizacion) => (
                <tr key={cotizacion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b">{cotizacion.numero_cotizacion}</td>
                  <td className="px-6 py-4 border-b">{cotizacion.nombre_cliente}</td>
                  <td className="px-6 py-4 border-b">{new Date(cotizacion.fecha).toLocaleDateString()}</td>
                  <td className="px-6 py-4 border-b">${formatearTotal(cotizacion.total)}</td>
                  <td className="px-6 py-4 border-b">
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
                  <td className="px-6 py-4 border-b">
                    <div className="flex space-x-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        onClick={() => editarCotizacion(cotizacion.id)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        onClick={() => eliminarCotizacion(cotizacion.id)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded"
                        onClick={() => descargarPDF(cotizacion.id)}
                        title="Descargar PDF"
                      >
                        <FaDownload />
                      </button>
                      <button
                        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded"
                        onClick={() => enviarCorreo(cotizacion.id)}
                        title="Enviar por correo"
                      >
                        <FaEnvelope />
                      </button>
                      <button
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded"
                        onClick={() => handleEnviarCorreoAlternativo(cotizacion.id)}
                        title="Enviar por correo (Alternativo)"
                      >
                        <FaEnvelopeOpen />
                        enviar
                      </button>
                      {cotizacion.estado === 'pendiente' && (
                        <button
                          className="p-2 text-green-600 hover:bg-green-100 rounded"
                          onClick={() => aprobarCotizacion(cotizacion.id)}
                          title="Aprobar cotización"
                        >
                          <FaCheck />Aprobar
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

      {/* Modal para enviar correo alternativo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Enviar Correo</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Destino
                </label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarCorreoSubmit}
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Correo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alternativo de Correo */}
      {showModalAlternativo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Enviar Correo</h2>
            <form onSubmit={handleEnviarCorreoAlternativoSubmit}>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Destinatario
                </label>
                <input
                  type="email"
                  value={emailDataAlternativo.to}
                  onChange={e => {
                    setEmailDataAlternativo(prev => ({ ...prev, to: e.target.value }));
                    buscarClientes(e.target.value);
                  }}
                  onFocus={e => {
                    if (emailDataAlternativo.to) buscarClientes(emailDataAlternativo.to);
                  }}
                  onBlur={() => setTimeout(() => setShowSugerencias(false), 150)}
                  onKeyDown={e => {
                    if (!showSugerencias || clientesSugeridos.length === 0) return;
                    if (e.key === 'ArrowDown') {
                      setSugerenciaIndex(prev => (prev < clientesSugeridos.length - 1 ? prev + 1 : 0));
                      e.preventDefault();
                    } else if (e.key === 'ArrowUp') {
                      setSugerenciaIndex(prev => (prev > 0 ? prev - 1 : clientesSugeridos.length - 1));
                      e.preventDefault();
                    } else if (e.key === 'Enter' && sugerenciaIndex >= 0) {
                      const cliente = clientesSugeridos[sugerenciaIndex];
                      setEmailDataAlternativo(prev => ({ ...prev, to: cliente.email_cliente || '' }));
                      setShowSugerencias(false);
                      setSugerenciaIndex(-1);
                      e.preventDefault();
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                  autoComplete="off"
                  placeholder="Escribe nombre o correo"
                />
                {showSugerencias && clientesSugeridos.length > 0 && emailDataAlternativo.to.length >= 2 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 50, borderTop: '3px solid #2563eb', background: '#f8fafc' }} className="w-full border border-gray-300 rounded-b-md shadow-lg animate-fade-in">
                    <div className="flex items-center gap-2 px-3 py-1 text-xs text-blue-700 bg-blue-50 border-b border-blue-100 rounded-t-md">
                      <i className="fas fa-magic"></i>
                      Sugerencias
                    </div>
                    <ul className="max-h-48 overflow-auto">
                      {clientesSugeridos.map((cliente, idx) => (
                        <li
                          key={cliente.id}
                          onClick={() => {
                            setEmailDataAlternativo(prev => ({ ...prev, to: cliente.email_cliente || '' }));
                            setShowSugerencias(false);
                            setSugerenciaIndex(-1);
                          }}
                          className={`px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors ${sugerenciaIndex === idx ? 'bg-blue-600 text-white' : ''}`}
                        >
                          <div className="font-medium">{cliente.nombre_cliente}</div>
                          <div className="text-xs text-gray-500">{cliente.email_cliente}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {showSugerencias && !loadingClientes && clientesSugeridos.length === 0 && emailDataAlternativo.to.length >= 2 && (
                  <div className="absolute left-0 right-0 bg-white border rounded shadow z-20 px-3 py-2 text-gray-500 mt-1">
                    No se encontraron clientes
                  </div>
                )}
                {loadingClientes && emailDataAlternativo.to.length >= 2 && (
                  <div className="absolute left-0 right-0 bg-white border rounded shadow z-20 px-3 py-2 text-gray-500 mt-1">
                    Buscando...
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  value={emailDataAlternativo.subject}
                  onChange={e => setEmailDataAlternativo(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  value={emailDataAlternativo.message}
                  onChange={e => setEmailDataAlternativo(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2 h-32"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalAlternativo(false);
                    setEmailDataAlternativo({ to: '', subject: '', message: '' });
                    setClientesSugeridos([]);
                    setShowSugerencias(false);
                    setSugerenciaIndex(-1);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLoadingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-blue-700 font-semibold text-lg">Enviando correo...</span>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <svg className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-700 font-semibold text-lg">¡Correo enviado exitosamente!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CotizacionesVer; 