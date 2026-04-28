import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaDownload, FaEnvelope, FaEye, FaTimes, FaUser, FaCalendar, FaFileAlt, FaDollarSign, FaHistory, FaClipboardList, FaTasks, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { usePermisos } from '../../hooks/usePermisos';

interface OrdenTrabajo {
  id: number;
  numero_orden: string;
  nombre_cliente: string;
  concepto: string;
  fecha_creacion?: string;
  fecha_entrega?: string;
  estado?: string;
  email_cliente?: string;
  tipo_orden?: string;
  id_cotizacion?: number;
  estado_orden_digital_id?: number;
  estado_digital_key?: string;
  estado_digital_titulo?: string;
  estado_offset_key?: string;
  estado_offset_titulo?: string;
  enviada_produccion?: boolean;
  artes_aprobados?: boolean;
}

const OrdenesVer: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const [workflowType, setWorkflowType] = useState<'todos' | 'offset' | 'digital'>('todos');

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
  const [produccionEnviada, setProduccionEnviada] = useState<{ [id: number]: boolean }>({});
  const [modalActualizarEstadoId, setModalActualizarEstadoId] = useState<number | null>(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>('');
  const [actualizandoEstado, setActualizandoEstado] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDetalleModal, setShowDetalleModal] = useState<boolean>(false);
  const [ordenDetalle, setOrdenDetalle] = useState<any>(null);
  const [showSeleccionProductoModal, setShowSeleccionProductoModal] = useState<boolean>(false);
  const [productosParaSeleccion, setProductosParaSeleccion] = useState<any[]>([]);
  const [ordenParaCertificado, setOrdenParaCertificado] = useState<any>(null);
  const [productoSeleccionadoIndex, setProductoSeleccionadoIndex] = useState<number | null>(null);
  const [showCotizacionModal, setShowCotizacionModal] = useState<boolean>(false);
  const [cotizacionDetalle, setCotizacionDetalle] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [ordenToDelete, setOrdenToDelete] = useState<OrdenTrabajo | null>(null);
  const [modalAprobarArtesId, setModalAprobarArtesId] = useState<number | null>(null);
  const [fechaEntregaAprobacion, setFechaEntregaAprobacion] = useState<string>('');
  const [aprobandoArtes, setAprobandoArtes] = useState<boolean>(false);
  const [showProduccionModal, setShowProduccionModal] = useState<boolean>(false);
  const [ordenToProduccion, setOrdenToProduccion] = useState<OrdenTrabajo | null>(null);
  const [accionProduccion, setAccionProduccion] = useState<'enviar' | 'cancelar'>('enviar');
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');
  const [observacionProduccion, setObservacionProduccion] = useState<string>('');
  const { puedeEditar, puedeEliminar, verificarYMostrarError } = usePermisos();

  // Scroll horizontal sincronizado (arriba y abajo), igual a Kanban
  const scrollTopRef = useRef<HTMLDivElement | null>(null);
  const scrollBottomRef = useRef<HTMLDivElement | null>(null);
  const scrollInnerRef = useRef<HTMLDivElement | null>(null);
  const mirrorInnerRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);

  const resumirConcepto = (texto: string | undefined, maxLength = 160): string => {
    if (!texto) return 'Sin concepto';
    const plano = String(texto)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!plano) return 'Sin concepto';
    if (plano.length <= maxLength) return plano;
    return `${plano.slice(0, maxLength).trimEnd()}...`;
  };

  const conceptoClampStyle: React.CSSProperties = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    overflow: 'hidden',
  };

  useEffect(() => {
    const syncWidth = () => {
      if (scrollInnerRef.current && mirrorInnerRef.current) {
        mirrorInnerRef.current.style.width = `${scrollInnerRef.current.scrollWidth}px`;
      }
    };

    syncWidth();
    const observer = new ResizeObserver(syncWidth);
    if (scrollBottomRef.current) observer.observe(scrollBottomRef.current);
    if (scrollInnerRef.current) observer.observe(scrollInnerRef.current);

    return () => observer.disconnect();
  }, [ordenes.length]);

  const handleScrollTop = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (scrollTopRef.current && scrollBottomRef.current) {
      scrollBottomRef.current.scrollLeft = scrollTopRef.current.scrollLeft;
    }
    syncingRef.current = false;
  }, []);

  const handleScrollBottom = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (scrollBottomRef.current && scrollTopRef.current) {
      scrollTopRef.current.scrollLeft = scrollBottomRef.current.scrollLeft;
    }
    syncingRef.current = false;
  }, []);

  // Función para verificar si el estado es de producción
  const normalizeKey = (s: string | undefined) => {
    if (!s) return '';
    // quitar acentos y normalizar espacios -> guiones bajos
    return s.toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '_');
  };

  const esEstadoProduccion = (estado: string | undefined): boolean => {
    if (!estado) return false;
    const key = normalizeKey(estado);
    const estadosProduccion = [
      'pendiente',
      'en_produccion',
      'en_proceso',
      'en_preprensa',
      'en_prensa',
      'en_impresion',
      'en_acabados',
      'en_control_de_calidad',
      'en_control_calidad',
      'en_empacado',
      'listo_para_entrega',
      'laminado',
      'troquelado',
      'terminados',
      'liberado'
    ];
    return estadosProduccion.includes(key);
  };

  const fueEnviadaAProduccion = (orden: OrdenTrabajo | any): boolean => {
    if (Boolean(orden?.enviada_produccion)) return true;
    if (orden?.id && produccionEnviada[orden.id]) return true;

    return false;
  };

  const estaBloqueadaPorProduccion = (orden: OrdenTrabajo | any): boolean => {
    if (fueEnviadaAProduccion(orden)) return true;

    if ((orden?.tipo_orden || '').toLowerCase() === 'digital' && orden?.estado_digital_key) {
      return esEstadoProduccion(orden.estado_digital_key);
    }

    return esEstadoProduccion(orden?.estado);
  };

  // Función para obtener el estilo del badge según el estado
  const getEstadoStyle = (estado: string | undefined): { classes: string; text: string } => {
    const key = normalizeKey(estado);

    const displayMap: { [k: string]: string } = {
      pendiente: 'Pendiente',
      en_produccion: 'En Producción',
      en_proceso: 'En Proceso',
      en_preprensa: 'Preprensa',
      en_prensa: 'Prensa / Impresión',
      en_impresion: 'Prensa / Impresión',
      laminado: 'Laminado/Barnizado',
      troquelado: 'Troquelado',
      terminados: 'Terminados',
      liberado: 'Producto Liberado',
      en_acabados: 'Acabados / Empacado',
      en_control_de_calidad: 'Listo p/Entrega',
      en_control_calidad: 'Listo p/Entrega',
      en_empacado: 'En Empacado',
      listo_para_entrega: 'Listo p/Entrega',
      entregado: 'Entregado',
      completado: 'Completado',
      facturado: 'Facturado',
      cancelado: 'Cancelado'
    };

    const colorMap: { [k: string]: string } = {
      pendiente: 'bg-gray-100 text-gray-800',
      en_produccion: 'bg-green-100 text-green-800',
      en_proceso: 'bg-green-100 text-green-800',
      en_preprensa: 'bg-blue-100 text-blue-800',
      en_prensa: 'bg-blue-100 text-blue-800',
      en_impresion: 'bg-blue-100 text-blue-800',
      laminado: 'bg-blue-100 text-blue-800',
      troquelado: 'bg-blue-100 text-blue-800',
      terminados: 'bg-blue-100 text-blue-800',
      en_acabados: 'bg-yellow-100 text-yellow-800',
      en_empacado: 'bg-yellow-100 text-yellow-800',
      en_control_de_calidad: 'bg-yellow-100 text-yellow-800',
      listo_para_entrega: 'bg-yellow-100 text-yellow-800',
      entregado: 'bg-emerald-100 text-emerald-800',
      facturado: 'bg-emerald-100 text-emerald-800',
      cancelado: 'bg-red-100 text-red-800'
    };

    const text = displayMap[key] || (estado ? estado.toString().replace(/_/g, ' ') : 'Pendiente');
    const classes = colorMap[key] || 'bg-gray-100 text-gray-800';

    return { classes, text };
  };

  // Generar certificado: obtiene detalle y decide si mostrar modal de selección de producto
  const handleGenerarCertificado = async (ordenId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/orden/${ordenId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(errText || 'Error al obtener detalle de la orden');
      }
      const data = await response.json();
      setOrdenParaCertificado(data);
      const productos = data?.detalle?.productos_digital || [];
      if (productos.length > 1) {
        setProductosParaSeleccion(productos);
        setShowSeleccionProductoModal(true);
      } else {
        const producto = productos[0] || null;
        navigate('/certificados/crear', { state: { orden: data, producto } });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al generar certificado');
    }
  };

  const handleConfirmarProductoParaCertificado = (index: number) => {
    const producto = productosParaSeleccion[index];
    navigate('/certificados/crear', { state: { orden: ordenParaCertificado, producto } });
    setShowSeleccionProductoModal(false);
    setProductosParaSeleccion([]);
    setOrdenParaCertificado(null);
  };

  useEffect(() => {
    setPagina(1);
    cargarOrdenes(true);
    // eslint-disable-next-line
  }, [location.search]);

  const cargarOrdenes = async (reset = false, tipoSeleccionado?: 'todos' | 'offset' | 'digital') => {
    setLoading(true);
    try {
      const tipo = tipoSeleccionado || workflowType;
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (filtros.busqueda) queryParams.append("busqueda", filtros.busqueda);
      if (filtros.fechaDesde) queryParams.append("fechaDesde", filtros.fechaDesde);
      if (filtros.fechaHasta) queryParams.append("fechaHasta", filtros.fechaHasta);
      if (tipo !== 'todos') {
        queryParams.append("tipo_orden", tipo);
      }

      const cotizacionFiltroId = new URLSearchParams(location.search).get('id_cotizacion');
      if (cotizacionFiltroId) {
        queryParams.append('id_cotizacion', cotizacionFiltroId);
      }

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

  const handleWorkflowTypeChange = (tipo: 'todos' | 'offset' | 'digital') => {
    setWorkflowType(tipo);
    setPagina(1);
    cargarOrdenes(true, tipo);
  };

  const editarOrden = (id: number) => {
    if (!verificarYMostrarError('ordenes_trabajo', 'editar', 'editar esta orden de trabajo')) {
      return;
    }
    navigate(`/ordendeTrabajo/editar/${id}`);
  };

  const eliminarOrden = async (id: number) => {
    if (!verificarYMostrarError('ordenes_trabajo', 'eliminar', 'eliminar esta orden de trabajo')) {
      return;
    }
    
    // Buscar la orden para mostrar información en el modal
    const orden = ordenes.find(o => o.id === id);
    if (orden && estaBloqueadaPorProduccion(orden)) {
      toast.info('Esta orden ya fue enviada a producción y no se puede eliminar.');
      return;
    }
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

  const enviarAProduccion = async (id: number, observacion = '') => {
    const orden = ordenes.find((o) => o.id === id);
    if (orden && !orden.artes_aprobados) {
      toast.info('No se puede enviar a producción: primero confirma que los artes están aprobados en la orden.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${id}/enviar-produccion`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ observacion })
      });
      if (!response.ok) throw new Error("Error al enviar a producción");
      
      const data = await response.json();
      
      // Actualizar el estado de la orden localmente para reflejar el cambio inmediato
      setOrdenes(prev => prev.map(o => {
        if (o.id !== id) return o;
        const esDigital = (o.tipo_orden || '').toLowerCase() === 'digital';
        return {
          ...o,
          estado: 'pendiente',
          enviada_produccion: true,
          ...(esDigital
            ? { estado_digital_key: 'pendiente', estado_orden_digital_id: -1 }
            : { estado_offset_key: 'pendiente', estado_orden_offset_id: -1 }
          )
        };
      }));
      setProduccionEnviada(prev => ({ ...prev, [id]: true }));
      
      // Mostrar mensaje de éxito con opción de ir a Vista Kanban
      toast.success(
        <div>
          <div className="font-semibold">✅ {data.message || 'Orden enviada a producción'}</div>
          <button
            onClick={() => navigate('/produccion/kanban')}
            className="mt-2 text-sm underline text-blue-600 hover:text-blue-800"
          >
            Ver en Vista Kanban →
          </button>
        </div>,
        { autoClose: 5000 }
      );
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error al enviar a producción");
    } finally {
      setLoading(false);
    }
  };

  const abrirModalAprobarArtes = (orden: OrdenTrabajo) => {
    setModalAprobarArtesId(orden.id);
    setFechaEntregaAprobacion(orden.fecha_entrega ? orden.fecha_entrega.slice(0, 10) : '');
  };

  const aprobarArtes = async () => {
    if (!modalAprobarArtesId) return;
    if (!fechaEntregaAprobacion) {
      toast.info('Debes seleccionar la fecha de entrega para aprobar artes.');
      return;
    }

    setAprobandoArtes(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${modalAprobarArtesId}/aprobar-artes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fecha_entrega: fechaEntregaAprobacion }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo aprobar artes');
      }

      setOrdenes((prev) => prev.map((o) => (
        o.id === modalAprobarArtesId
          ? { ...o, artes_aprobados: true, fecha_entrega: fechaEntregaAprobacion }
          : o
      )));
      setModalAprobarArtesId(null);
      setFechaEntregaAprobacion('');
      toast.success('Artes aprobados. Ahora ya puedes enviar la orden a producción.');
    } catch (error: any) {
      toast.error(error.message || 'Error al aprobar artes');
    } finally {
      setAprobandoArtes(false);
    }
  };

  const cancelarProduccion = async (id: number, motivo: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/${id}/cancelar-produccion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ motivo })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar producción');
      }

      toast.success('❌ Producción cancelada');
      setPagina(1);
      await cargarOrdenes(true);
    } catch (error: any) {
      console.error('Error al cancelar producción:', error);
      toast.error(error.message || 'Error al cancelar producción');
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

  // Función para limpiar HTML y mostrar solo texto formateado
  const limpiarHTML = (html: string | undefined): string => {
    if (!html) return '';
    return String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+\n/g, '\n')
      .replace(/\n\s+/g, '\n')
      .trim();
  };

  const renderOrdenActions = (orden: OrdenTrabajo, compact = false) => {
    const estadoKey = normalizeKey((orden as any).estado_digital_key || (orden as any).estado_offset_key || orden.estado);
    const estadoRaw = estadoKey;
    const enviadaProduccion = fueEnviadaAProduccion(orden);
    const enProduccionPorEstado = esEstadoProduccion((orden as any).estado_digital_key || (orden as any).estado_offset_key || orden.estado);
    const cancelada = estadoKey === 'cancelado';
    const puedeCancelarProduccion = enviadaProduccion && estadoKey === 'pendiente';
    const buttonClass = compact
      ? 'px-2 py-1 text-xs rounded border'
      : 'p-2 rounded flex flex-col items-center';

    return (
      <div className={compact ? 'flex flex-wrap gap-2' : 'flex space-x-2'} onClick={(e) => e.stopPropagation()}>
        <button
          className={`${buttonClass} text-green-600 hover:bg-green-100`}
          onClick={() => verPDF(orden.id)}
          title="Ver PDF/Imprimir"
        >
          <FaEye className={compact ? 'inline mr-1' : ''} />
          {compact ? 'Ver' : <span className="text-xs mt-1 text-gray-600">Ver PDF/Imprimir</span>}
        </button>

        {
          <button
            className={`${buttonClass} text-blue-600 hover:bg-blue-100`}
            onClick={() => editarOrden(orden.id)}
            title="Editar"
          >
            <FaEdit className={compact ? 'inline mr-1' : ''} />
            {compact ? 'Editar' : <span className="text-xs mt-1 text-gray-600">Editar</span>}
          </button>
        }

        {puedeEliminar('ordenes_trabajo') && !enviadaProduccion && (
          <button
            className={`${buttonClass} text-red-600 hover:bg-red-100`}
            onClick={() => eliminarOrden(orden.id)}
            title="Eliminar"
          >
            <FaTrash className={compact ? 'inline mr-1' : ''} />
            {compact ? 'Eliminar' : <span className="text-xs mt-1 text-gray-600">Eliminar</span>}
          </button>
        )}

        <button
          className={`${buttonClass} text-purple-600 hover:bg-purple-100`}
          onClick={() => descargarPDF(orden.id)}
          title="Descargar PDF"
        >
          <FaDownload className={compact ? 'inline mr-1' : ''} />
          {compact ? 'Descargar' : <span className="text-xs mt-1 text-gray-600">Descargar</span>}
        </button>

        {estadoRaw === 'entregado' ? (
          <div className={compact ? 'px-2 py-1 text-xs text-gray-500 border rounded' : 'p-2 text-gray-500 text-xs'}>Entregado</div>
        ) : cancelada ? (
          <div className={compact ? 'px-2 py-1 text-xs text-red-600 border border-red-200 rounded' : 'p-2 text-red-600 text-xs'}>Cancelado</div>
        ) : !enviadaProduccion && !orden.artes_aprobados ? (
          <button
            className={`${buttonClass} text-amber-700 hover:bg-amber-100`}
            onClick={() => abrirModalAprobarArtes(orden)}
            title="Aprobar artes"
          >
            {compact ? 'Aprobar artes' : <span className="font-bold text-xs">Aprobar artes</span>}
          </button>
        ) : !enviadaProduccion && orden.artes_aprobados ? (
          <button
            className={`${buttonClass} text-green-600 hover:bg-green-100`}
            onClick={() => {
              setOrdenToProduccion(orden);
              setAccionProduccion('enviar');
              setShowProduccionModal(true);
            }}
            title="Enviar a Producción"
          >
            {compact ? 'Enviar producción' : <span className="font-bold text-xs">Enviar a Producción</span>}
          </button>
        ) : enviadaProduccion || enProduccionPorEstado ? (
          <>
            <button
              className={`${buttonClass} text-teal-600 hover:bg-teal-100`}
              onClick={() => navigate('/produccion/kanban')}
              title="Vista Kanban"
            >
              <FaTasks className={compact ? 'inline mr-1' : ''} />
              {compact ? 'Kanban' : <span className="text-xs mt-1 text-gray-600">Vista Kanban</span>}
            </button>
            <button
              className={`${buttonClass} text-indigo-600 hover:bg-indigo-100`}
              onClick={() => handleGenerarCertificado(orden.id)}
              title="Generar Certificado"
            >
              <FaFileAlt className={compact ? 'inline mr-1' : ''} />
              {compact ? 'Certif.' : <span className="text-xs mt-1 text-gray-600">Generar Certificado</span>}
            </button>
            {puedeCancelarProduccion && (
              <button
                className={`${buttonClass} text-red-600 hover:bg-red-100`}
                onClick={() => {
                  setOrdenToProduccion(orden);
                  setAccionProduccion('cancelar');
                  setShowProduccionModal(true);
                }}
                title="Cancelar Producción"
              >
                <FaTimes className={compact ? 'inline mr-1' : ''} />
                {compact ? 'Cancelar' : <span className="text-xs mt-1 text-gray-600">Cancelar Prod.</span>}
              </button>
            )}
          </>
        ) : (
          <div className={compact ? 'px-2 py-1 text-xs text-gray-500 border rounded' : 'p-2 text-gray-500 text-xs'}>Sin acciones</div>
        )}

        {orden.id_cotizacion && (
          <button
            className={`${buttonClass} text-orange-600 hover:bg-orange-100`}
            onClick={() => handleVerCotizacion(orden.id_cotizacion!)}
            title="Ver Cotización"
          >
            <FaFileAlt className={compact ? 'inline mr-1' : ''} />
            {compact ? 'Cotización' : <span className="text-xs mt-1 text-gray-600">Ver Cotización</span>}
          </button>
        )}
      </div>
    );
  };

  const modalEstadoProduccionKey = ordenToProduccion
    ? normalizeKey((ordenToProduccion as any).estado_digital_key || (ordenToProduccion as any).estado_offset_key || ordenToProduccion.estado)
    : '';
  const modalFueEnviadaProduccion = ordenToProduccion ? fueEnviadaAProduccion(ordenToProduccion) : false;
  const modalPuedeCancelarProduccion = modalFueEnviadaProduccion && modalEstadoProduccionKey === 'pendiente';
  const modalPuedeEnviarProduccion = Boolean(ordenToProduccion && !modalFueEnviadaProduccion && ordenToProduccion.artes_aprobados && modalEstadoProduccionKey !== 'cancelado');

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
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleWorkflowTypeChange('todos')}
              className={`px-3 py-2 rounded-md text-sm ${workflowType === 'todos' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleWorkflowTypeChange('offset')}
              className={`px-3 py-2 rounded-md text-sm ${workflowType === 'offset' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Offset
            </button>
            <button
              type="button"
              onClick={() => handleWorkflowTypeChange('digital')}
              className={`px-3 py-2 rounded-md text-sm ${workflowType === 'digital' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            >
              Digital
            </button>
          </div>

          <div className="flex gap-2">
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
        </div>
      </form>
      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {ordenes.map((orden) => {
              const key = (orden as any).estado_digital_key || orden.estado;
              const estadoNorm = normalizeKey(key);
              const s = getEstadoStyle(key);
              return (
                <div
                  key={orden.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                  onClick={() => handleVerDetalle(orden.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-gray-900">#{orden.numero_orden}</div>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${estadoNorm === 'pendiente' && !orden.artes_aprobados ? 'bg-amber-100 text-amber-800' : s.classes}`}>
                      {estadoNorm === 'pendiente' && !orden.artes_aprobados ? 'Pendiente (sin artes)' : s.text}
                    </span>
                  </div>

                  <div className="mt-2 font-medium text-sm text-gray-900">{orden.nombre_cliente}</div>
                  <div className="mt-1 text-xs text-gray-600 leading-5" style={conceptoClampStyle}>
                    {resumirConcepto(orden.concepto)}
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><span className="font-semibold">Tipo:</span> {orden.tipo_orden === 'digital' ? 'Digital' : 'Offset'}</div>
                    <div><span className="font-semibold">Fecha:</span> {orden.fecha_creacion?.slice(0, 10) || 'N/A'}</div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {renderOrdenActions(orden, true)}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            ref={scrollTopRef}
            onScroll={handleScrollTop}
            className="hidden md:block overflow-x-auto mb-1"
          >
            <div ref={mirrorInnerRef} className="h-1" />
          </div>
          <div ref={scrollBottomRef} onScroll={handleScrollBottom} className="hidden md:block overflow-x-auto">
          <div ref={scrollInnerRef} className="min-w-[1300px]">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 border-b text-left">N° Orden</th>
                <th className="px-6 py-3 border-b text-left">Cliente/Concepto</th>
                <th className="px-6 py-3 border-b text-left">Tipo</th>
                <th className="px-6 py-3 border-b text-left">Fecha</th>
                <th className="px-6 py-3 border-b text-left">Estado</th>
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
                  <td className="px-6 py-4 border-b">
                    <div className="min-w-0">
                      <div className="font-medium truncate" title={orden.nombre_cliente}>{orden.nombre_cliente}</div>
                      <div
                        className="mt-1 text-xs text-gray-600 leading-5"
                        style={conceptoClampStyle}
                        title={resumirConcepto(orden.concepto, 500)}
                      >
                        {resumirConcepto(orden.concepto)}
                      </div>
                    </div>
                  </td>
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
                    {(() => {
                      const key = (orden as any).estado_digital_key || orden.estado;
                      const estadoNorm = normalizeKey(key);
                      if (estadoNorm === 'pendiente' && !orden.artes_aprobados) {
                        return (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Pendiente (sin artes aprobadas)
                          </span>
                        );
                      }
                      const s = getEstadoStyle(key);
                      return (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.classes}`}>
                          {s.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 border-b">
                    {renderOrdenActions(orden)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>
        </>
      )}
      {!loading && hayMas && (
        <button
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => { setPagina(p => p + 1); cargarOrdenes(false); }}
        >
          Cargar más
        </button>
      )}
      {showSeleccionProductoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowSeleccionProductoModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Seleccionar Producto para Certificado</h3>
            <p className="text-sm text-gray-600 mb-4">Esta orden contiene varios productos. Seleccione el producto para el cual desea generar el certificado.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {productosParaSeleccion.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{p.producto || p.descripcion || `Producto ${idx+1}`}</div>
                    <div className="text-sm text-gray-600">Cantidad: {p.cantidad || 'N/A'}</div>
                  </div>
                  <div>
                    <button
                      className="bg-indigo-600 text-white px-3 py-1 rounded"
                      onClick={() => handleConfirmarProductoParaCertificado(idx)}
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button className="px-4 py-2 mr-2 rounded border" onClick={() => setShowSeleccionProductoModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalActualizarEstadoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <h3 className="text-lg font-semibold mb-2 text-yellow-700">Actualizar Estado de la orden</h3>
            <p className="text-sm text-gray-600">Seleccione el nuevo estado para la orden</p>
            <div className="mt-4">
              <select
                className="w-full border p-2 rounded"
                value={estadoSeleccionado}
                onChange={(e) => setEstadoSeleccionado(e.target.value)}
              >
                <option value="">-- Seleccionar estado --</option>
                {(() => {
                  const ordenModal = ordenes.find(o => o.id === modalActualizarEstadoId);
                  const tipo = (ordenModal?.tipo_orden || '').toString().toLowerCase();
                  if (tipo === 'digital') {
                    return (
                      <>
                        <option value="en_preprensa">Preprensa</option>
                        <option value="en_prensa">Impresión</option>
                        <option value="laminado">Laminado/Barnizado</option>
                        <option value="troquelado">Troquelado</option>
                        <option value="terminados">Terminados</option>
                        <option value="liberado">Producto Liberado</option>
                        <option value="entregado">Producto Entregado</option>
                      </>
                    );
                  }

                  return (
                    <>
                      <option value="en_preprensa">Preprensa</option>
                      <option value="en_prensa">Prensa / Impresión</option>
                      <option value="en_acabados">Acabados / Empacado</option>
                      <option value="listo_para_entrega">Listo p/Entrega</option>
                      <option value="entregado">Entregado</option>
                    </>
                  );
                })()}
              </select>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button
                className="bg-yellow-600 text-white px-4 py-2 rounded"
                onClick={async () => {
                  if (!estadoSeleccionado) return;
                  setActualizandoEstado(true);
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${modalActualizarEstadoId}/estado`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      body: JSON.stringify({ estado: estadoSeleccionado })
                    });
                    if (!response.ok) throw new Error('Error al actualizar estado');
                    const data = await response.json();
                    // Actualizar lista localmente
                    setOrdenes(prev => prev.map(o => {
                      if (o.id !== (modalActualizarEstadoId as number)) return o;
                      const tipo = (o.tipo_orden || '').toString().toLowerCase();
                      const newEstado = data.orden?.estado || estadoSeleccionado;
                      const newKey = data.orden?.estado_digital_key || (tipo === 'digital' ? estadoSeleccionado : o.estado_digital_key);
                      const newId = data.orden?.estado_orden_digital_id || o.estado_orden_digital_id;
                      return { ...o, estado: newEstado, estado_digital_key: newKey, estado_orden_digital_id: newId };
                    }));
                    setModalActualizarEstadoId(null);
                    setEstadoSeleccionado('');
                    // Notificar y ofrecer ir a Kanban
                    toast.success(
                      <div>
                        <div className="font-semibold">✅ Estado actualizado</div>
                        <button
                          onClick={() => navigate('/produccion/kanban')}
                          className="mt-2 text-sm underline text-blue-600 hover:text-blue-800"
                        >
                          Ver en Vista Kanban →
                        </button>
                      </div>,
                      { autoClose: 4000 }
                    );
                  } catch (error: any) {
                    toast.error(error.message || 'Ocurrió un error al actualizar el estado');
                  } finally {
                    setActualizandoEstado(false);
                  }
                }}
              >
                {actualizandoEstado ? 'Actualizando...' : 'Confirmar'}
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => { setModalActualizarEstadoId(null); setEstadoSeleccionado(''); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {modalAprobarArtesId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <h3 className="text-lg font-semibold mb-2 text-amber-700">Confirmar aprobación de artes</h3>
            <p className="text-sm text-gray-700">
              Al confirmar, los artes quedarán aprobados y se habilitará el envío a producción.
            </p>
            <div className="mt-4 text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded p-2"
                value={fechaEntregaAprobacion}
                onChange={(e) => setFechaEntregaAprobacion(e.target.value)}
              />
            </div>
            <div className="flex justify-center gap-4 mt-5">
              <button
                className="bg-amber-600 text-white px-4 py-2 rounded"
                onClick={aprobarArtes}
                disabled={aprobandoArtes}
              >
                {aprobandoArtes ? 'Guardando...' : 'Sí, aprobar artes'}
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => { setModalAprobarArtesId(null); setFechaEntregaAprobacion(''); }}
                disabled={aprobandoArtes}
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

              {/* ── SECCIÓN 1: INFORMACIÓN DEL CLIENTE (común a ambos tipos) ── */}
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
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                    <FaCalendar className="text-green-600 shrink-0" />
                    <div>
                      <label className="text-sm text-gray-500 block">Fecha de Creación</label>
                      <p className="text-gray-900 font-medium">
                        {ordenDetalle.fecha_creacion
                          ? new Date(ordenDetalle.fecha_creacion).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                    <FaCalendar className="text-green-600 shrink-0" />
                    <div>
                      <label className="text-sm text-gray-500 block">Fecha de Entrega</label>
                      <p className="text-gray-900 font-medium">
                        {ordenDetalle.fecha_entrega
                          ? new Date(ordenDetalle.fecha_entrega).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {(ordenDetalle.observacion_produccion || ordenDetalle.motivo_cancelacion) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaClipboardList className="mr-2 text-green-600" />
                    Gestión de Producción
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ordenDetalle.observacion_produccion && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="text-sm text-blue-700 block mb-2 font-medium">
                          Observación al enviar a producción
                        </label>
                        <p className="text-gray-900 whitespace-pre-wrap break-words">
                          {ordenDetalle.observacion_produccion}
                        </p>
                      </div>
                    )}
                    {ordenDetalle.motivo_cancelacion && (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <label className="text-sm text-red-700 block mb-2 font-medium">
                          Motivo de cancelación de producción
                        </label>
                        <p className="text-gray-900 whitespace-pre-wrap break-words">
                          {ordenDetalle.motivo_cancelacion}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SECCIÓN 2: INFORMACIÓN DEL TRABAJO (diferenciada por tipo) ── */}
              {ordenDetalle.tipo_orden === 'digital' ? (
                <>
                  {/* DIGITAL – Tabla de productos */}
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
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Gap H (mm)</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Ancho (mm)</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Gap V (mm)</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Alto (mm)</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b">Cavidad</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Metros Imp.</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Papel Ancho</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b whitespace-nowrap">Papel Largo</th>
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
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.gap_horizontal || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.medida_ancho || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.gap_vertical || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.medida_alto || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.cavidad || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.metros_impresos || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.tamano_papel_ancho || 'N/A'}</td>
                                  <td className="px-3 py-2 border-b text-gray-900 text-sm">{producto.tamano_papel_largo || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DIGITAL – Información Técnica */}
                  {(ordenDetalle.detalle?.adherencia || ordenDetalle.detalle?.material ||
                    ordenDetalle.detalle?.impresion || ordenDetalle.detalle?.tipo_impresion ||
                    ordenDetalle.detalle?.terminado_etiqueta || ordenDetalle.detalle?.espesor) && (
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
                        {ordenDetalle.detalle?.proveedor_material && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Proveedor de Material</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.proveedor_material}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.lote_material && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Lote Material / Código Material</label>
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
                        {ordenDetalle.detalle?.terminado_etiqueta && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Terminado de Etiqueta</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.terminado_etiqueta}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.terminados_especiales && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Terminados Especiales</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.terminados_especiales}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.cantidad_por_rollo && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Cantidad por Rollo</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.cantidad_por_rollo}</p>
                          </div>
                        )}
                        {ordenDetalle.detalle?.espesor && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <label className="text-sm text-gray-500 block mb-1">Espesor Total (mm)</label>
                            <p className="text-gray-900 font-medium">{ordenDetalle.detalle.espesor}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DIGITAL – Observaciones */}
                  {(ordenDetalle.detalle?.observaciones || ordenDetalle.notas_observaciones) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaFileAlt className="mr-2 text-green-600" />
                        Observaciones
                      </h3>
                      <div className="space-y-3">
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
                </>
              ) : (
                <>
                  {/* OFFSET – Información del Trabajo */}
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

                  {/* OFFSET – Información Técnica (material, pliegos, impresión, prensa) */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                      <FaClipboardList className="mr-2 text-green-600" />
                      Información Técnica
                    </h3>
                    <div className="space-y-4">
                      {/* Material y Corte */}
                      {(ordenDetalle.detalle?.material || ordenDetalle.detalle?.espesor_material || ordenDetalle.detalle?.corte_material) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {ordenDetalle.detalle?.material && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Material</label>
                              <p className="text-gray-900 font-medium">{ordenDetalle.detalle.material}</p>
                            </div>
                          )}
                          {ordenDetalle.detalle?.espesor_material && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Espesor del Material (mm)</label>
                              <p className="text-gray-900 font-medium">{ordenDetalle.detalle.espesor_material}</p>
                            </div>
                          )}
                          {ordenDetalle.detalle?.corte_material && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Corte de Material</label>
                              <p className="text-gray-900 font-medium">{ordenDetalle.detalle.corte_material}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Pliegos */}
                      {(ordenDetalle.detalle?.cantidad_pliegos_compra || ordenDetalle.detalle?.exceso || ordenDetalle.detalle?.total_pliegos) && (
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
                              <label className="text-sm text-gray-500 block mb-1">Total Pliegos</label>
                              <p className="text-gray-900 font-medium">{ordenDetalle.detalle.total_pliegos}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Impresión y Acabados */}
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
                      {/* Prensa */}
                      {ordenDetalle.detalle?.prensa_seleccionada && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <label className="text-sm text-gray-500 block mb-1">Prensa Seleccionada</label>
                          <p className="text-gray-900 font-medium">{ordenDetalle.detalle.prensa_seleccionada}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OFFSET – Observaciones */}
                  {(ordenDetalle.detalle?.observaciones || ordenDetalle.notas_observaciones) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                        <FaFileAlt className="mr-2 text-green-600" />
                        Observaciones
                      </h3>
                      <div className="space-y-3">
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
                </>
              )}

              {/* ── SECCIÓN 5: RESPONSABLES DEL PROCESO (común, una sola vez) ── */}
              {(ordenDetalle.vendedor || ordenDetalle.preprensa || ordenDetalle.prensa ||
                ordenDetalle.terminados || ordenDetalle.laminado_barnizado || ordenDetalle.troquelado ||
                ordenDetalle.liberacion_producto || ordenDetalle.facturado) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaClipboardList className="mr-2 text-green-600" />
                    Responsables del Proceso
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <label className="text-xs text-gray-600 block mb-1">{ordenDetalle.tipo_orden === 'digital' ? 'Impresión' : 'Offset'}</label>
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

              {/* ── SECCIÓN 6: AUDITORÍA (común) ── */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaHistory className="mr-2 text-green-600" />
                  Auditoría
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <label className="text-sm text-gray-600 block mb-2 font-semibold">Creado por</label>
                    <p className="text-gray-900 font-medium mb-1">{ordenDetalle.created_by_nombre || 'Sistema'}</p>
                    <p className="text-xs text-gray-500">
                      {ordenDetalle.created_at
                        ? new Date(ordenDetalle.created_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
                        : 'N/A'}
                    </p>
                  </div>
                  {ordenDetalle.updated_by_nombre && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="text-sm text-gray-600 block mb-2 font-semibold">Última modificación por</label>
                      <p className="text-gray-900 font-medium mb-1">{ordenDetalle.updated_by_nombre}</p>
                      <p className="text-xs text-gray-500">
                        {ordenDetalle.updated_at
                          ? new Date(ordenDetalle.updated_at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                {Array.isArray(ordenDetalle.trazabilidad_general) && ordenDetalle.trazabilidad_general.length > 0 && (
                  <div className="mt-5">
                    <label className="text-sm text-gray-600 block mb-3 font-semibold">Trazabilidad del flujo</label>
                    <div className="space-y-3">
                      {ordenDetalle.trazabilidad_general.map((item: any, idx: number) => (
                        <div key={`${item.evento}-${idx}`} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">{item.evento || 'Evento'}</p>
                            <p className="text-xs text-gray-500">
                              {item.fecha_hora
                                ? new Date(item.fecha_hora).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
                                : 'Fecha no disponible'}
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Responsable: {item.usuario || 'Sistema'}</p>
                          {(item.fecha_inicio || item.hora_inicio) && (
                            <p className="text-xs text-gray-600 mt-1">
                              Inicio operativo: {item.fecha_inicio || 'N/A'} {item.hora_inicio || ''}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── BOTONES DE ACCIÓN ── */}
              <div className="flex gap-3 pt-4 border-t">
                {
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
                }
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

      {/* Modal de gestión de producción (Enviar/Cancelar) */}
      {showProduccionModal && ordenToProduccion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-fadeIn">
            <div className="p-6">
              <div className={`flex items-center justify-center w-16 h-16 mx-auto rounded-full mb-4 ${accionProduccion === 'enviar' ? 'bg-blue-100' : 'bg-red-100'}`}>
                {accionProduccion === 'enviar' ? (
                  <FaSync className="text-3xl text-blue-600" />
                ) : (
                  <FaTimes className="text-3xl text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">
                Gestionar producción
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Orden <span className="font-semibold">N° {ordenToProduccion.numero_orden}</span> de <span className="font-semibold">{ordenToProduccion.nombre_cliente}</span>.
              </p>
              {(modalPuedeEnviarProduccion || modalPuedeCancelarProduccion) && (
                <div className={`grid gap-2 mb-4 ${modalPuedeEnviarProduccion && modalPuedeCancelarProduccion ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {modalPuedeEnviarProduccion && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccionProduccion('enviar');
                        setMotivoCancelacion('');
                      }}
                      className={`px-3 py-2 rounded-lg border font-medium transition-colors ${accionProduccion === 'enviar' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      Enviar a Prod.
                    </button>
                  )}
                  {modalPuedeCancelarProduccion && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccionProduccion('cancelar');
                        setObservacionProduccion('');
                      }}
                      className={`px-3 py-2 rounded-lg border font-medium transition-colors ${accionProduccion === 'cancelar' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      Cancelar Prod.
                    </button>
                  )}
                </div>
              )}

              {accionProduccion === 'enviar' ? (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 text-center mb-3">
                    Se iniciará el proceso de producción de la orden.
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observacionProduccion}
                    onChange={(e) => setObservacionProduccion(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Escriba una observación para la producción (opcional)"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de cancelación
                  </label>
                  <textarea
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ingrese el motivo de cancelación"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProduccionModal(false);
                    setOrdenToProduccion(null);
                    setAccionProduccion('enviar');
                    setMotivoCancelacion('');
                    setObservacionProduccion('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    const id = ordenToProduccion.id;
                    const motivoLimpio = motivoCancelacion.trim();
                    const observacionLimpia = observacionProduccion.trim();

                    if (accionProduccion === 'cancelar' && !motivoLimpio) {
                      toast.error('Debe ingresar un motivo de cancelación');
                      return;
                    }

                    setShowProduccionModal(false);
                    setOrdenToProduccion(null);
                    setAccionProduccion('enviar');
                    setMotivoCancelacion('');
                    setObservacionProduccion('');

                    if (accionProduccion === 'enviar') {
                      await enviarAProduccion(id, observacionLimpia);
                    } else {
                      await cancelarProduccion(id, motivoLimpio);
                    }
                  }}
                  className={`flex-1 px-4 py-3 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${accionProduccion === 'enviar' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {accionProduccion === 'enviar' ? <FaSync /> : <FaTimes />}
                  {accionProduccion === 'enviar' ? 'Enviar a Producción' : 'Cancelar Producción'}
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