import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash, FaDownload, FaEnvelope, FaEnvelopeOpen, FaCheck, FaUserFriends, FaTools } from 'react-icons/fa';
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
    message: '',
    nombrePDF: ''
  });
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [sugerenciaIndex, setSugerenciaIndex] = useState(-1);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sugerenciasBusqueda, setSugerenciasBusqueda] = useState([]);
  const [showSugerenciasBusqueda, setShowSugerenciasBusqueda] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(true);
  const LIMITE_POR_PAGINA = 15;
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productosCotizacion, setProductosCotizacion] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cotizacionToDelete, setCotizacionToDelete] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Función auxiliar para formatear el total de manera segura
  const formatearTotal = (total) => {
    if (total === null || total === undefined) return "0.00";
    const numero = typeof total === 'string' ? parseFloat(total) : total;
    return isNaN(numero) ? "0.00" : numero.toFixed(2);
  };

  // Cargar las últimas 5 cotizaciones al montar el componente
  useEffect(() => {
    console.log('🔄 useEffect ejecutado - Componente montado, cargando cotizaciones...');
    console.log('API URL:', apiUrl);
    setPagina(1);
    cargarCotizaciones(true);
  }, []);

  const cargarCotizaciones = async (reset = false, busquedaDirecta = null) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      const busquedaValor = busquedaDirecta !== null ? busquedaDirecta : filtros.busqueda;
      if (busquedaValor) queryParams.append("busqueda", busquedaValor);
      if (filtros.fechaDesde) queryParams.append("fechaDesde", filtros.fechaDesde);
      if (filtros.fechaHasta) queryParams.append("fechaHasta", filtros.fechaHasta);
      queryParams.append("limite", LIMITE_POR_PAGINA);
      queryParams.append("ordenar", "fecha_desc");

      const url = `${apiUrl}/api/cotizaciones/todas?${queryParams}`;
      console.log('Realizando petición a:', url);
      console.log('Filtros actuales:', filtros);
      
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      console.log('Datos recibidos:', data);
      console.log('Número de cotizaciones recibidas:', data.length);
      console.log('IDs de cotizaciones:', data.map(c => c.id));
      
      if (!Array.isArray(data)) {
        console.error('Los datos recibidos no son un array:', data);
        setCotizaciones([]);
        setHayMas(false);
        return;
      }
      
      console.log('Estado anterior de cotizaciones:', cotizaciones.length);
      
      // Eliminar duplicados por ID
      const eliminarDuplicados = (array) => {
        return array.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );
      };
      
      if (reset) {
        console.log('Reseteando cotizaciones con', data.length, 'elementos');
        const cotizacionesUnicas = eliminarDuplicados(data);
        console.log('Cotizaciones únicas después de eliminar duplicados:', cotizacionesUnicas.length);
        setCotizaciones(cotizacionesUnicas);
      } else {
        console.log('Agregando', data.length, 'elementos a las', cotizaciones.length, 'existentes');
        const nuevasCotizaciones = [...cotizaciones, ...data];
        const cotizacionesUnicas = eliminarDuplicados(nuevasCotizaciones);
        console.log('Cotizaciones únicas después de eliminar duplicados:', cotizacionesUnicas.length);
        setCotizaciones(cotizacionesUnicas);
      }
      setHayMas(data.length === LIMITE_POR_PAGINA);
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
      setConfirmMessage("Error al cargar las cotizaciones: " + error.message);
      setShowConfirmModal(true);
      setCotizaciones([]);
      setHayMas(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleBusquedaChange = (e) => {
    const value = e.target.value;
    setFiltros(prev => ({ ...prev, busqueda: value }));
    setPagina(1);
    cargarCotizaciones(true);
  };

  const handleSugerenciaClick = (sugerencia) => {
    setFiltros(prev => ({ ...prev, busqueda: sugerencia.numero_cotizacion }));
    setShowSugerenciasBusqueda(false);
    setPagina(1);
    cargarCotizaciones(true, sugerencia.numero_cotizacion);
  };

  const aplicarFiltros = (e) => {
    e.preventDefault();
    setPagina(1);
    cargarCotizaciones(true);
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      fechaDesde: "",
      fechaHasta: "",
    });
    setPagina(1);
    cargarCotizaciones(true);
  };

  const editarCotizacion = (id) => {
    navigate(`/cotizaciones/crear/${id}`);
  };

  const eliminarCotizacion = (id) => {
    // Validación inicial
    if (!id) {
      setConfirmMessage("ID de cotización no válido");
      setShowConfirmModal(true);
      return;
    }

    // Buscar la cotización para mostrar información en el modal
    const cotizacion = cotizaciones.find(c => c.id === id);
    setCotizacionToDelete(cotizacion);
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!cotizacionToDelete) return;

    try {
      setLoading(true);
      setShowDeleteModal(false);
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/api/cotizaciones/${cotizacionToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Error al eliminar la cotización");
      }

      // Mostrar mensaje de éxito
      setConfirmMessage("Cotización eliminada exitosamente");
      setShowConfirmModal(true);
      
      // Reiniciar la página y recargar la lista de cotizaciones desde cero
      setPagina(1);
      await cargarCotizaciones(true);
    } catch (error) {
      console.error("Error al eliminar la cotización:", error);
      setConfirmMessage(error.message || "Ocurrió un error al eliminar la cotización");
      setShowConfirmModal(true);
    } finally {
      setLoading(false);
      setCotizacionToDelete(null);
    }
  };

  const descargarPDF = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Obtener información de la cotización para el nombre del archivo
      const cotizacion = cotizaciones.find(c => c.id === id);
      const numeroCotizacion = cotizacion ? cotizacion.numero_cotizacion : id;
      
      // Comentario: Esta función ahora permite al usuario elegir la ubicación y nombre del archivo
      // usando el explorador de Windows (en navegadores modernos) o descarga tradicional como fallback
      
      // Obtener el PDF directamente
      const response = await fetch(`${apiUrl}/api/cotizaciones/${id}/pdf`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      // Crear un archivo con nombre sugerido
      const fileName = `Cotizacion-${numeroCotizacion}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Verificar si el navegador soporta la API de archivos
      if ('showSaveFilePicker' in window) {
        try {
          // Abrir el explorador de archivos para elegir ubicación y nombre
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'Documento PDF',
              accept: {
                'application/pdf': ['.pdf']
              }
            }]
          });
          
          // Crear un stream de escritura
          const writable = await fileHandle.createWritable();
          await writable.write(pdfFile);
          await writable.close();
          
          // Mostrar mensaje de éxito
          setConfirmMessage('PDF guardado exitosamente en la ubicación seleccionada');
          setShowConfirmModal(true);
          return true;
        } catch (fileError) {
          // Si el usuario cancela la selección, no mostrar error
          if (fileError.name === 'AbortError') {
            return false;
          }
          // Si hay otro error con la API de archivos, usar descarga tradicional
          console.warn('Error con API de archivos, usando descarga tradicional:', fileError);
        }
      }

      // Fallback: descarga tradicional si no se soporta la API de archivos
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      
      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Mostrar mensaje de éxito
      setConfirmMessage('PDF descargado exitosamente');
      setShowConfirmModal(true);
      return true;
    } catch (error) {
      // Solo mostrar error si realmente hubo un problema
      if (error.message !== 'Failed to fetch') {
        console.error('Error:', error);
        setConfirmMessage('Error al descargar el PDF: ' + error.message);
        setShowConfirmModal(true);
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

  const handleEnviarCorreoAlternativo = (id) => {
    const cotizacion = cotizaciones.find(c => c.id === id);
    setSelectedCotizacion(cotizacion);
    setEmailDataAlternativo(prev => ({
      ...prev,
      to: cotizacion?.email_cliente || "",
      subject: prev.subject || `Cotización MUNDOGRAFIC #${cotizacion.numero_cotizacion}`,
      message: prev.message || 'Estimado cliente,\n\nAdjunto encontrará la cotización solicitada.\n\nSaludos cordiales,\nEquipo MUNDOGRAFIC',
      nombrePDF: prev.nombrePDF || `Cotizacion-${cotizacion.numero_cotizacion}`
    }));
    setShowModalAlternativo(true);
  };

  const handleEnviarCorreoAlternativoSubmit = async (e) => {
    e.preventDefault();
    setShowLoadingModal(true);
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!emailDataAlternativo.to) {
        toast.error('Se requiere un correo electrónico válido');
        return;
      }

      // ✅ Validar formato de email (soporta múltiples correos separados por coma)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = emailDataAlternativo.to.split(',').map(e => e.trim()).filter(e => e.length > 0);
      
      // Verificar que todos los emails tengan formato válido
      const invalidEmails = emails.filter(e => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        toast.error(`Los siguientes correos electrónicos no tienen formato válido: ${invalidEmails.join(', ')}`);
        return;
      }

      const response = await fetch(`${apiUrl}/api/cotizaciones/${selectedCotizacion.id}/enviar-correo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: emailDataAlternativo.to,
          asunto: emailDataAlternativo.subject,
          mensaje: emailDataAlternativo.message,
          nombrePDF: emailDataAlternativo.nombrePDF
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el correo');
      }

      setShowSuccessModal(true);
      setShowModalAlternativo(false);
      setEmailDataAlternativo({ to: '', subject: '', message: '', nombrePDF: '' });

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
      const token = localStorage.getItem("token");
      // Enviar el correo a través del backend
      const response = await fetch(`${apiUrl}/api/cotizaciones/${selectedCotizacion.id}/enviar-correo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/cotizaciones/${id}/aprobar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al aprobar la cotización');
      }

      toast.success('✅ Cotización aprobada exitosamente');
      setPagina(1);
      await cargarCotizaciones(true);
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
    
    // ✅ Extraer solo la última parte después de la última coma para buscar
    const searchTerm = q.split(',').pop().trim();
    
    if (searchTerm.length < 2) {
      setClientesSugeridos([]);
      setShowSugerencias(false);
      return;
    }
    
    setLoadingClientes(true);
    try {
      const res = await fetch(`${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setClientesSugeridos(data);
      setShowSugerencias(true);
      setSugerenciaIndex(-1);
    } catch (e) {
      setClientesSugeridos([]);
      setShowSugerencias(false);
    } finally {
      setLoadingClientes(false);
    }
  };

  // ✅ Función para cargar todos los clientes para el modal
  const cargarTodosLosClientes = async () => {
    setLoadingClientes(true);
    try {
      const token = localStorage.getItem("token");
      console.log('🔍 Cargando todos los clientes...');
      
      const res = await fetch(`${apiUrl}/api/clientes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Clientes cargados:', data.length);
      setClientesSugeridos(data);
    } catch (e) {
      console.error('❌ Error al cargar clientes:', e);
      setClientesSugeridos([]);
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  // Función para cargar más cotizaciones
  const cargarMasCotizaciones = async () => {
    setPagina(prev => prev + 1);
    await cargarCotizaciones(false);
  };

  const generarOrdenTrabajo = async (cotizacionId) => {
    try {
      setLoading(true);
      // Obtener los detalles/productos de la cotización
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/cotizacionesDetalles/${cotizacionId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("No se pudieron obtener los productos de la cotización");
      const detalles = await response.json();
      if (Array.isArray(detalles) && detalles.length > 1) {
        setProductosCotizacion(detalles);
        setCotizacionSeleccionada(cotizacionId);
        setShowProductoModal(true);
      } else if (Array.isArray(detalles) && detalles.length === 1) {
        // Solo un producto, navegar directo
        navigate(`/ordendeTrabajo/crear/${cotizacionId}`, { state: { producto: detalles[0] } });
      } else {
        toast.error('La cotización no tiene productos para generar orden de trabajo.');
      }
    } catch (error) {
      toast.error(error.message || 'Error al obtener los productos de la cotización.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la selección de producto en el modal
  const handleSeleccionarProducto = (producto) => {
    setShowProductoModal(false);
    if (cotizacionSeleccionada && producto) {
      navigate(`/ordendeTrabajo/crear/${cotizacionSeleccionada}`, { state: { producto, id_detalle_cotizacion: producto.id } });
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
              onChange={handleBusquedaChange}
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
                <th className="px-6 py-3 border-b text-left">Ejecutivo</th>
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
                  <td className="px-6 py-4 border-b">{cotizacion.nombre_ejecutivo || 'No asignado'}</td>
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
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded flex flex-col items-center"
                        onClick={() => editarCotizacion(cotizacion.id)}
                        title="Editar"
                      >
                        <FaEdit />
                        <span className="text-xs mt-1 text-gray-600">Editar</span>
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-100 rounded flex flex-col items-center"
                        onClick={() => eliminarCotizacion(cotizacion.id)}
                        title="Eliminar"
                      >
                        <FaTrash />
                        <span className="text-xs mt-1 text-gray-600">Eliminar</span>
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded flex flex-col items-center"
                        onClick={() => descargarPDF(cotizacion.id)}
                        title="Descargar PDF"
                      >
                        <FaDownload />
                        <span className="text-xs mt-1 text-gray-600">PDF</span>
                      </button>
                                             <button
                         className="p-2 text-indigo-600 hover:bg-indigo-100 rounded flex flex-col items-center"
                         onClick={() => handleEnviarCorreoAlternativo(cotizacion.id)}
                         title="Enviar por correo"
                       >
                         <FaEnvelopeOpen />
                         <span className="text-xs mt-1 text-gray-600">Enviar Correo</span>
                       </button>
                      {cotizacion.estado === 'pendiente' && (
                        <button
                          className="p-2 text-green-600 hover:bg-green-100 rounded flex flex-col items-center"
                          onClick={() => aprobarCotizacion(cotizacion.id)}
                          title="Aprobar cotización"
                        >
                          <FaCheck />
                          <span className="text-xs mt-1 text-gray-600">Aprobar</span>
                        </button>
                      )}
                      {cotizacion.estado === 'aprobada' && (
                        <button
                          className="p-2 text-pink-600 hover:bg-pink-100 rounded flex flex-col items-center"
                          onClick={() => generarOrdenTrabajo(cotizacion.id)}
                          title="Generar Orden de Trabajo"
                        >
                          <FaTools />
                          <span className="text-xs mt-1 text-gray-600">Orden</span>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Enviar Correo</h2>
            <form onSubmit={handleEnviarCorreoAlternativoSubmit}>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Destinatario
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
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
                        const currentEmails = emailDataAlternativo.to;
                        const newEmail = cliente.email_cliente;
                        
                        // ✅ Lógica mejorada para agregar correos sin borrar los existentes
                        if (currentEmails && currentEmails.trim() !== '') {
                          // Si ya hay correos, extraer la parte antes de la última coma
                          const emailsArray = currentEmails.split(',');
                          const lastPart = emailsArray[emailsArray.length - 1].trim();
                          
                          // Si la última parte está vacía, es solo espacios, o no es un email completo, reemplazarla
                          if (lastPart === '' || lastPart.length < 2 || !lastPart.includes('@')) {
                            emailsArray[emailsArray.length - 1] = ` ${newEmail}`;
                            setEmailDataAlternativo(prev => ({
                              ...prev,
                              to: emailsArray.join(',')
                            }));
                          } else {
                            // Si la última parte es un email completo, agregar el nuevo correo
                            setEmailDataAlternativo(prev => ({
                              ...prev,
                              to: `${currentEmails}, ${newEmail}`
                            }));
                          }
                        } else {
                          // Si no hay correos, usar solo este
                          setEmailDataAlternativo(prev => ({
                            ...prev,
                            to: newEmail
                          }));
                        }
                        
                        setShowSugerencias(false);
                        setSugerenciaIndex(-1);
                        e.preventDefault();
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-md p-2"
                    required
                    autoComplete="off"
                    placeholder="Escribe correos separados por coma (ej: correo1@email.com, correo2@email.com)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowClientesModal(true);
                      cargarTodosLosClientes();
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    title="Ver Clientes"
                  >
                    👥 Ver Clientes
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Puedes escribir múltiples correos separados por coma
                </p>
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
                            const currentEmails = emailDataAlternativo.to;
                            const newEmail = cliente.email_cliente;
                            
                            // ✅ Lógica mejorada para agregar correos sin borrar los existentes
                            if (currentEmails && currentEmails.trim() !== '') {
                              // Si ya hay correos, extraer la parte antes de la última coma
                              const emailsArray = currentEmails.split(',');
                              const lastPart = emailsArray[emailsArray.length - 1].trim();
                              
                              // Si la última parte está vacía, es solo espacios, o no es un email completo, reemplazarla
                              if (lastPart === '' || lastPart.length < 2 || !lastPart.includes('@')) {
                                emailsArray[emailsArray.length - 1] = ` ${newEmail}`;
                                setEmailDataAlternativo(prev => ({
                                  ...prev,
                                  to: emailsArray.join(',')
                                }));
                              } else {
                                // Si la última parte es un email completo, agregar el nuevo correo
                                setEmailDataAlternativo(prev => ({
                                  ...prev,
                                  to: `${currentEmails}, ${newEmail}`
                                }));
                              }
                            } else {
                              // Si no hay correos, usar solo este
                              setEmailDataAlternativo(prev => ({
                                ...prev,
                                to: newEmail
                              }));
                            }
                            
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del PDF
                </label>
                <input
                  type="text"
                  value={emailDataAlternativo.nombrePDF}
                  onChange={e => setEmailDataAlternativo(prev => ({ ...prev, nombrePDF: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="Ej: Cotizacion-Cliente-Enero2024"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El archivo se enviará con extensión .pdf automáticamente
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalAlternativo(false);
                    setEmailDataAlternativo({ to: '', subject: '', message: '', nombrePDF: '' });
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

      {/* Modal de selección de producto */}
      {showProductoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Selecciona el producto para la Orden de Trabajo</h2>
            <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {productosCotizacion.map((producto, idx) => (
                <li key={idx} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{producto.detalle}</div>
                    <div className="text-sm text-gray-500">Cantidad: {producto.cantidad} | Valor unitario: ${parseFloat(producto.valor_unitario).toFixed(2)}</div>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => handleSeleccionarProducto(producto)}
                  >
                    Seleccionar
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => setShowProductoModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal de Clientes */}
      {showClientesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Seleccionar Cliente</h2>
              <button
                onClick={() => setShowClientesModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Buscador */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            
            {/* Lista de Clientes */}
            <div className="overflow-y-auto max-h-96">
              {loadingClientes ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Cargando clientes...</div>
                </div>
              ) : clientesSugeridos.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">No se encontraron clientes</div>
                </div>
              ) : (
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left border-b">Nombre</th>
                      <th className="px-4 py-2 text-left border-b">Correo</th>
                      <th className="px-4 py-2 text-left border-b">Teléfono</th>
                      <th className="px-4 py-2 text-center border-b">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesSugeridos
                      .filter(cliente => 
                        cliente.nombre_cliente?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                        cliente.email_cliente?.toLowerCase().includes(busquedaCliente.toLowerCase())
                      )
                      .map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border-b">{cliente.nombre_cliente}</td>
                          <td className="px-4 py-2 border-b">{cliente.email_cliente}</td>
                          <td className="px-4 py-2 border-b">{cliente.telefono || '-'}</td>
                          <td className="px-4 py-2 border-b text-center">
                            <button
                              onClick={() => {
                                // Agregar el correo al campo existente o reemplazar
                                const currentEmails = emailDataAlternativo.to;
                                const newEmail = cliente.email_cliente;
                                
                                if (currentEmails && currentEmails.trim() !== '') {
                                  // Si ya hay correos, agregar con coma
                                  setEmailDataAlternativo(prev => ({
                                    ...prev,
                                    to: `${currentEmails}, ${newEmail}`
                                  }));
                                } else {
                                  // Si no hay correos, usar solo este
                                  setEmailDataAlternativo(prev => ({
                                    ...prev,
                                    to: newEmail
                                  }));
                                }
                                
                                setShowClientesModal(false);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowClientesModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && cotizacionToDelete && (
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
                ¿Estás seguro de que deseas eliminar la cotización <strong>#{cotizacionToDelete.numero_cotizacion}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta acción no se puede deshacer y eliminará permanentemente la cotización y todos sus detalles.
              </p>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCotizacionToDelete(null);
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

      {/* Modal de confirmación general */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Información</h3>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {confirmMessage}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && hayMas && (
        <div className="flex justify-center mt-4">
          <button
            onClick={cargarMasCotizaciones}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Cargar más
          </button>
        </div>
      )}
    </div>
  );
}

export default CotizacionesVer; 