import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEdit, FaTrash, FaDownload, FaEnvelope, FaEnvelopeOpen, FaCheck, FaUserFriends, FaTools, FaHistory, FaTimes, FaUser, FaCalendar, FaFileAlt, FaDollarSign } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { generarVistaPreviaPDF } from '../../services/cotizacionPreviewService';

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
  
  // Nuevos estados para la interfaz mejorada
  const [destinatariosTo, setDestinatariosTo] = useState([]);
  const [destinatariosCC, setDestinatariosCC] = useState([]);
  const [destinatariosBCC, setDestinatariosBCC] = useState([]);
  const [tipoDestinatarioActual, setTipoDestinatarioActual] = useState('to');
  const [showCCSection, setShowCCSection] = useState(false);
  const [showBCCSection, setShowBCCSection] = useState(false);
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
  const [showTipoOrdenModal, setShowTipoOrdenModal] = useState(false);
  const [tipoOrdenSeleccionado, setTipoOrdenSeleccionado] = useState(null); // 'prensa' | 'digital'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cotizacionToDelete, setCotizacionToDelete] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [buscarGlobal, setBuscarGlobal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [cotizacionDetalle, setCotizacionDetalle] = useState(null);

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
      if (buscarGlobal) queryParams.append("global", "true");

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
    setBuscarGlobal(false);
    setPagina(1);
    cargarCotizaciones(true);
  };

  const editarCotizacion = (id) => {
    navigate(`/cotizaciones/crear/${id}`);
  };

  const handleVerDetalle = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/cotizaciones/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de la cotización');
      }

      const data = await response.json();
      setCotizacionDetalle(data);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      toast.error('Error al cargar los detalles de la cotización');
    }
  };

  const handleCerrarDetalleModal = () => {
    setShowDetalleModal(false);
    setCotizacionDetalle(null);
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

  // Vista previa en modal usando servicio centralizado
  const previewEnModal = async (id) => {
    try {
      console.log("🔍 Iniciando vista previa para cotización ID:", id);
      setPreviewUrl(null);
      setShowPreview(true);
      setPreviewLoading(true);

      // Usar el servicio centralizado
      const pdfUrl = await generarVistaPreviaPDF(id, null, null);
      setPreviewUrl(pdfUrl);

    } catch (error) {
      console.error('Error en vista previa:', error);
      setConfirmMessage('Error al generar la vista previa: ' + error.message);
      setShowConfirmModal(true);
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
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
    
    // Inicializar destinatarios con el email del cliente si existe
    const destinatariosToIniciales = [];
    if (cotizacion?.email_cliente) {
      destinatariosToIniciales.push({
        id: Date.now(),
        email: cotizacion.email_cliente,
        nombre: cotizacion.nombre_cliente || '',
        valido: true
      });
    }
    
    setDestinatariosTo(destinatariosToIniciales);
    setDestinatariosCC([]);
    setDestinatariosBCC([]);
    
    setEmailDataAlternativo(prev => ({
      ...prev,
      to: cotizacion?.email_cliente || "",
      subject: prev.subject || `Cotización MUNDOGRAFIC ${cotizacion.codigo_cotizacion}`,
      message: prev.message || 'Estimado cliente,\n\nAdjunto encontrará la cotización solicitada.\n\nSaludos cordiales,\nEquipo MUNDOGRAFIC',
      nombrePDF: prev.nombrePDF || `Cotizacion-${cotizacion.codigo_cotizacion}`
    }));
    setShowModalAlternativo(true);
  };

  // Funciones para manejar destinatarios por tipo
  const agregarDestinatarioPorTipo = (tipo, email, nombre = '') => {
    if (!email.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const esValido = emailRegex.test(email.trim());
    
    if (!esValido) {
      toast.error('Por favor ingrese un email válido');
      return;
    }
    
    const nuevo = {
      id: Date.now(),
      email: email.trim(),
      nombre: nombre.trim(),
      valido: true
    };
    
    // Verificar duplicados en el tipo específico
    let existe = false;
    if (tipo === 'to') {
      existe = destinatariosTo.some(d => d.email.toLowerCase() === email.toLowerCase());
      if (!existe) {
        setDestinatariosTo(prev => [...prev, nuevo]);
      }
    } else if (tipo === 'cc') {
      existe = destinatariosCC.some(d => d.email.toLowerCase() === email.toLowerCase());
      if (!existe) {
        setDestinatariosCC(prev => [...prev, nuevo]);
      }
    } else if (tipo === 'bcc') {
      existe = destinatariosBCC.some(d => d.email.toLowerCase() === email.toLowerCase());
      if (!existe) {
        setDestinatariosBCC(prev => [...prev, nuevo]);
      }
    }
    
    if (existe) {
      toast.error('Este email ya está en la lista de destinatarios');
      return;
    }
    
    // Actualizar el campo de texto para compatibilidad
    actualizarCampoTexto();
  };

  const eliminarDestinatarioPorTipo = (tipo, id) => {
    if (tipo === 'to') {
      setDestinatariosTo(prev => prev.filter(d => d.id !== id));
    } else if (tipo === 'cc') {
      setDestinatariosCC(prev => prev.filter(d => d.id !== id));
    } else if (tipo === 'bcc') {
      setDestinatariosBCC(prev => prev.filter(d => d.id !== id));
    }
    
    // Actualizar el campo de texto para compatibilidad
    actualizarCampoTexto();
  };

  const actualizarCampoTexto = () => {
    const todosEmails = [
      ...destinatariosTo.map(d => d.email),
      ...destinatariosCC.map(d => d.email),
      ...destinatariosBCC.map(d => d.email)
    ].join(', ');
    
    setEmailDataAlternativo(prev => ({ ...prev, to: todosEmails }));
  };

  const abrirModalClientes = (tipo) => {
    setTipoDestinatarioActual(tipo);
    setShowClientesModal(true);
    cargarTodosLosClientes();
  };


  const validarEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEnviarCorreoAlternativoSubmit = async (e) => {
    e.preventDefault();
    setShowLoadingModal(true);
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Validar que haya al menos un destinatario principal
      if (destinatariosTo.length === 0) {
        toast.error('Debe agregar al menos un destinatario principal');
        return;
      }

      // Validar que todos los emails sean válidos
      const todosDestinatarios = [...destinatariosTo, ...destinatariosCC, ...destinatariosBCC];
      const emailsInvalidos = todosDestinatarios.filter(d => !validarEmail(d.email));
      if (emailsInvalidos.length > 0) {
        toast.error(`Los siguientes correos electrónicos no son válidos: ${emailsInvalidos.map(d => d.email).join(', ')}`);
        return;
      }

      // Preparar los emails para el backend (compatibilidad)
      const todosEmails = todosDestinatarios.map(d => d.email).join(', ');
      
      // Preparar destinatarios estructurados para el backend
      const destinatariosEstructurados = [
        ...destinatariosTo.map(d => ({ ...d, tipo: 'to' })),
        ...destinatariosCC.map(d => ({ ...d, tipo: 'cc' })),
        ...destinatariosBCC.map(d => ({ ...d, tipo: 'bcc' }))
      ];

      const response = await fetch(`${apiUrl}/api/cotizaciones/${selectedCotizacion.id}/enviar-correo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: todosEmails,
          asunto: emailDataAlternativo.subject,
          mensaje: emailDataAlternativo.message,
          nombrePDF: emailDataAlternativo.nombrePDF,
          destinatarios: destinatariosEstructurados // Enviar información adicional de destinatarios
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar el correo');
      }

      setShowSuccessModal(true);
      setShowModalAlternativo(false);
      setEmailDataAlternativo({ to: '', subject: '', message: '', nombrePDF: '' });
      setDestinatariosTo([]); // Limpiar destinatarios
      setDestinatariosCC([]);
      setDestinatariosBCC([]);

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
      console.log('📋 Muestra de datos:', data[0]);
      
      // Normalizar los datos para que tengan los campos esperados
      const clientesNormalizados = data.map(cliente => ({
        id: cliente.id,
        nombre_cliente: cliente.nombre || cliente.nombre_cliente,
        email_cliente: cliente.email || cliente.email_cliente,
        empresa: cliente.empresa || cliente.empresa_cliente || '-',
        telefono: cliente.telefono || cliente.telefono_cliente
      }));
      
      setClientesSugeridos(clientesNormalizados);
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
    // Paso 1: seleccionar tipo de orden primero
    setCotizacionSeleccionada(cotizacionId);
    setShowTipoOrdenModal(true);
  };

  // Continuar flujo después de elegir tipo de orden
  const continuarGeneracionOrden = async (tipoSeleccionado) => {
    try {
      setTipoOrdenSeleccionado(tipoSeleccionado);
      setShowTipoOrdenModal(false);
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/cotizacionesDetalles/${cotizacionSeleccionada}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("No se pudieron obtener los productos de la cotización");
      const detalles = await response.json();
      if (Array.isArray(detalles) && detalles.length > 1) {
        setProductosCotizacion(detalles);
        setShowProductoModal(true);
      } else if (Array.isArray(detalles) && detalles.length === 1) {
        navigate(`/ordendeTrabajo/crear/${cotizacionSeleccionada}`, { state: { producto: detalles[0], tipoOrden: tipoSeleccionado } });
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
      navigate(`/ordendeTrabajo/crear/${cotizacionSeleccionada}`, { state: { producto, id_detalle_cotizacion: producto.id, tipoOrden: tipoOrdenSeleccionado } });
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
            <div className="mt-2 flex items-center gap-2">
              <input
                id="buscarGlobal"
                type="checkbox"
                checked={buscarGlobal}
                onChange={(e) => {
                  setBuscarGlobal(e.target.checked);
                  setPagina(1);
                  cargarCotizaciones(true);
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="buscarGlobal" className="text-sm text-gray-700">
                Buscar en toda la base de datos
              </label>
            </div>
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
                <th className="px-6 py-3 border-b text-left">Descripción</th>
                <th className="px-6 py-3 border-b text-left">Fecha</th>
                <th className="px-6 py-3 border-b text-left">Total</th>
                <th className="px-6 py-3 border-b text-left">Estado</th>
                <th className="px-6 py-3 border-b text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((cotizacion) => (
                <tr 
                  key={cotizacion.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleVerDetalle(cotizacion.id)}
                >
                  <td className="px-6 py-4 border-b">
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600">
                        {cotizacion.codigo_cotizacion 
                          ? cotizacion.codigo_cotizacion.slice(-4)
                          : String(cotizacion.id).padStart(4, '0')
                        }
                      </span>
                      <span className="text-xs text-gray-500">{cotizacion.codigo_cotizacion}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b">{cotizacion.nombre_cliente}</td>
                  <td className="px-6 py-4 border-b">{cotizacion.primer_detalle || 'Sin descripción'}</td>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          previewEnModal(cotizacion.id);
                        }}
                        title="Vista previa"
                      >
                        <FaEye />
                        <span className="text-xs mt-1 text-gray-600">VistaPreviaPDF</span>
                      </button>
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded flex flex-col items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          editarCotizacion(cotizacion.id);
                        }}
                        title="Editar"
                      >
                        <FaEdit />
                        <span className="text-xs mt-1 text-gray-600">Editar</span>
                      </button>
                      <button
                        className="p-2 text-red-600 hover:bg-red-100 rounded flex flex-col items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarCotizacion(cotizacion.id);
                        }}
                        title="Eliminar"
                      >
                        <FaTrash />
                        <span className="text-xs mt-1 text-gray-600">Eliminar</span>
                      </button>
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded flex flex-col items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          descargarPDF(cotizacion.id);
                        }}
                        title="Descargar PDF"
                      >
                        <FaDownload />
                        <span className="text-xs mt-1 text-gray-600">Descargar PDF</span>
                      </button>
                      <button
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded flex flex-col items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnviarCorreoAlternativo(cotizacion.id);
                        }}
                        title="Enviar por correo"
                      >
                        <FaEnvelopeOpen />
                        <span className="text-xs mt-1 text-gray-600">Enviar Correo</span>
                      </button>
                      {cotizacion.estado === 'pendiente' && (
                        <button
                          className="p-2 text-green-600 hover:bg-green-100 rounded flex flex-col items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            aprobarCotizacion(cotizacion.id);
                          }}
                          title="Aprobar cotización"
                        >
                          <FaCheck />
                          <span className="text-xs mt-1 text-gray-600">Aprobar</span>
                        </button>
                      )}
                      {cotizacion.estado === 'aprobada' && (
                        <button
                          className="p-2 text-pink-600 hover:bg-pink-100 rounded flex flex-col items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            generarOrdenTrabajo(cotizacion.id);
                          }}
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

      {/* Modal de vista previa */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vista Previa del PDF</h2>
              <button
                onClick={() => { setShowPreview(false); setPreviewUrl(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewLoading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600">Generando...</div>
              ) : (
                <object
                  data={previewUrl}
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

      {/* Modal Mejorado de Correo */}
      {showModalAlternativo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📧 Enviar Cotización por Correo</h2>
              <button
                onClick={() => {
                  setShowModalAlternativo(false);
                  setDestinatarios([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEnviarCorreoAlternativoSubmit} className="space-y-6">
              {/* Sección de Destinatarios por Tipo */}
              <div className="space-y-6">
                {/* Destinatario Principal */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-blue-800">📧 Destinatario Principal</h3>
                    <span className="text-sm text-blue-600">
                      {destinatariosTo.length} destinatario{destinatariosTo.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Lista de destinatarios TO */}
                  <div className="mb-3">
                    {destinatariosTo.length === 0 ? (
                      <div className="text-center py-4 text-blue-600">
                        <p className="text-sm">No hay destinatarios principales</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {destinatariosTo.map((destinatario) => (
                          <div
                            key={destinatario.id}
                            className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {destinatario.nombre || destinatario.email}
                              </div>
                              {destinatario.nombre && (
                                <div className="text-sm text-gray-500">{destinatario.email}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => eliminarDestinatarioPorTipo('to', destinatario.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                              title="Eliminar destinatario"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Campo de entrada y botones */}
                <div className="flex gap-2">
                  <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                        e.preventDefault();
                          agregarDestinatarioPorTipo('to', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => abrirModalClientes('to')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      title="Seleccionar de clientes"
                    >
                      + Clientes
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info('Miembros MundoGrafic próximamente')}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      title="Seleccionar miembros"
                    >
                      + Equipo MundoGrafic
                    </button>
                  </div>
                </div>

                {/* Con Copia (CC) - Desplegable */}
                <div className="bg-yellow-50 rounded-lg border border-yellow-200">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-yellow-100 transition-colors"
                    onClick={() => setShowCCSection(!showCCSection)}
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-yellow-800">📋 Con Copia (CC)</h3>
                      <span className="text-sm text-yellow-600">
                        {destinatariosCC.length} destinatario{destinatariosCC.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600 text-sm">
                        {showCCSection ? 'Ocultar' : 'Mostrar'}
                      </span>
                      <svg 
                        className={`w-5 h-5 text-yellow-600 transition-transform ${showCCSection ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {showCCSection && (
                    <div className="px-4 pb-4">
                  
                      {/* Lista de destinatarios CC */}
                      <div className="mb-3">
                        {destinatariosCC.length === 0 ? (
                          <div className="text-center py-4 text-yellow-600">
                            <p className="text-sm">No hay destinatarios en copia</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {destinatariosCC.map((destinatario) => (
                              <div
                                key={destinatario.id}
                                className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200"
                              >
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {destinatario.nombre || destinatario.email}
                                  </div>
                                  {destinatario.nombre && (
                                    <div className="text-sm text-gray-500">{destinatario.email}</div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => eliminarDestinatarioPorTipo('cc', destinatario.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                  title="Eliminar destinatario"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Campo de entrada y botones */}
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          className="flex-1 px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                        e.preventDefault();
                              agregarDestinatarioPorTipo('cc', e.target.value);
                              e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                          onClick={() => abrirModalClientes('cc')}
                          className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                          title="Seleccionar de clientes"
                        >
                          + Clientes
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.info('Miembros MundoGrafic próximamente')}
                          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          title="Seleccionar miembros"
                        >
                          + Equipo MundoGrafic
                  </button>
                </div>
                    </div>
                  )}
                </div>

                {/* Copia Oculta (BCC) - Desplegable */}
                <div className="bg-gray-50 rounded-lg border border-gray-200">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setShowBCCSection(!showBCCSection)}
                  >
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-800">🔒 Copia Oculta (BCC)</h3>
                      <span className="text-sm text-gray-600">
                        {destinatariosBCC.length} destinatario{destinatariosBCC.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600 text-sm">
                        {showBCCSection ? 'Ocultar' : 'Mostrar'}
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-600 transition-transform ${showBCCSection ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {showBCCSection && (
                    <div className="px-4 pb-4">
                  
                      {/* Lista de destinatarios BCC */}
                      <div className="mb-3">
                        {destinatariosBCC.length === 0 ? (
                          <div className="text-center py-4 text-gray-600">
                            <p className="text-sm">No hay destinatarios en copia oculta</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {destinatariosBCC.map((destinatario) => (
                              <div
                                key={destinatario.id}
                                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                              >
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {destinatario.nombre || destinatario.email}
                  </div>
                                  {destinatario.nombre && (
                                    <div className="text-sm text-gray-500">{destinatario.email}</div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => eliminarDestinatarioPorTipo('bcc', destinatario.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                  title="Eliminar destinatario"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                  </div>
                )}
                      </div>
                      
                      {/* Campo de entrada y botones */}
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              agregarDestinatarioPorTipo('bcc', e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => abrirModalClientes('bcc')}
                          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                          title="Seleccionar de clientes"
                        >
                          + Clientes
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.info('Miembros MundoGrafic próximamente')}
                          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          title="Seleccionar miembros"
                        >
                          + Equipo MundoGrafic
                        </button>
                      </div>
                  </div>
                )}
              </div>
              </div>


              {/* Sección de Asunto y Mensaje */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 Asunto del Correo
                </label>
                <input
                  type="text"
                  value={emailDataAlternativo.subject}
                  onChange={e => setEmailDataAlternativo(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Cotización MUNDOGRAFIC #123"
                />
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📄 Nombre del PDF
                </label>
                <input
                  type="text"
                  value={emailDataAlternativo.nombrePDF}
                  onChange={e => setEmailDataAlternativo(prev => ({ ...prev, nombrePDF: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Cotizacion-Cliente-Enero2024"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El archivo se enviará con extensión .pdf automáticamente
                </p>
              </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💬 Mensaje del Correo
                </label>
                <textarea
                  value={emailDataAlternativo.message}
                  onChange={e => setEmailDataAlternativo(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Escriba su mensaje aquí..."
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  {destinatariosTo.length > 0 && (
                    <span>📊 {destinatariosTo.length + destinatariosCC.length + destinatariosBCC.length} destinatario{(destinatariosTo.length + destinatariosCC.length + destinatariosBCC.length) !== 1 ? 's' : ''} configurado{(destinatariosTo.length + destinatariosCC.length + destinatariosBCC.length) !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalAlternativo(false);
                    setEmailDataAlternativo({ to: '', subject: '', message: '', nombrePDF: '' });
                      setDestinatariosTo([]);
                      setDestinatariosCC([]);
                      setDestinatariosBCC([]);
                    setClientesSugeridos([]);
                    setShowSugerencias(false);
                    setSugerenciaIndex(-1);
                  }}
                    className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                    disabled={loading || destinatariosTo.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>📧</span>
                        <span>Enviar Correo</span>
                      </div>
                    )}
                </button>
                </div>
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

      {/* Modal de selección de tipo de orden */}
      {showTipoOrdenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Selecciona el tipo de orden</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => continuarGeneracionOrden('prensa')}
              >
                Prensa
              </button>
              <button
                className="px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={() => continuarGeneracionOrden('digital')}
              >
                Digital
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                onClick={() => { setShowTipoOrdenModal(false); setCotizacionSeleccionada(null); }}
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
                      <th className="px-4 py-2 text-left border-b">Empresa</th>
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
                          <td className="px-4 py-2 border-b">{cliente.empresa}</td>
                          <td className="px-4 py-2 border-b">{cliente.email_cliente}</td>
                          <td className="px-4 py-2 border-b">{cliente.telefono || '-'}</td>
                          <td className="px-4 py-2 border-b text-center">
                            <button
                              onClick={() => {
                                // Agregar al tipo de destinatario actual
                                agregarDestinatarioPorTipo(tipoDestinatarioActual, cliente.email_cliente, cliente.nombre_cliente);
                                setShowClientesModal(false);
                                toast.success(`Cliente "${cliente.nombre_cliente}" agregado como destinatario ${tipoDestinatarioActual.toUpperCase()}`);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Agregar
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
                ¿Estás seguro de que deseas eliminar la cotización <strong>{cotizacionToDelete.codigo_cotizacion}</strong>?
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

      {/* Modal de Detalles de Cotización */}
      {showDetalleModal && cotizacionDetalle && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCerrarDetalleModal}
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
                  <div className="text-blue-200 text-sm">
                    Cotización {cotizacionDetalle.codigo_cotizacion}
                  </div>
                </div>
                <button
                  onClick={handleCerrarDetalleModal}
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
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.nombre_cliente || 'N/A'}</p>
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
                    {cotizacionDetalle.ruc_descripcion && (
                      <p className="text-xs text-gray-500">{cotizacionDetalle.ruc_descripcion}</p>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Tiempo de Entrega</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.tiempo_entrega || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Forma de Pago</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.forma_pago || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Validez de Proforma</label>
                    <p className="text-gray-900 font-medium">{cotizacionDetalle.validez_proforma || 'N/A'}</p>
                  </div>
                  {cotizacionDetalle.contacto && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-sm text-gray-500 block mb-1">Contacto</label>
                      <p className="text-gray-900 font-medium">{cotizacionDetalle.contacto}</p>
                      {cotizacionDetalle.celuar && (
                        <p className="text-xs text-gray-500">{cotizacionDetalle.celuar}</p>
                      )}
                    </div>
                  )}
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
                    {/* Tabla de productos */}
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
                          {cotizacionDetalle.detalles.map((detalle, index) => (
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
                      {cotizacionDetalle.created_by_nombre || 'Sistema'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cotizacionDetalle.created_at 
                        ? new Date(cotizacionDetalle.created_at).toLocaleString('es-EC', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  {cotizacionDetalle.updated_by_nombre && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="text-sm text-gray-600 block mb-2 font-semibold">
                        Última modificación por
                      </label>
                      <p className="text-gray-900 font-medium mb-1">
                        {cotizacionDetalle.updated_by_nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {cotizacionDetalle.updated_at 
                          ? new Date(cotizacionDetalle.updated_at).toLocaleString('es-EC', {
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
                    editarCotizacion(cotizacionDetalle.id);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaEdit />
                  Editar Cotización
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