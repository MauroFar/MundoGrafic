import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Logo from "../../components/Logo";
import axios from 'axios';
import "react-resizable/css/styles.css";
import { Resizable } from "react-resizable";
import Encabezado from "../../components/Encabezado";
import { FaSave, FaEye, FaTimes, FaCalculator } from "react-icons/fa";
import { generarVistaPreviaPDF } from '../../services/cotizacionPreviewService';
import ItemEditorModal from './ItemEditorModal';

function CotizacionesCrear() {
  const { id } = useParams();
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  
  // Initialize all state variables with default values
  const [rucs, setRucs] = useState([]);
  const [selectedRuc, setSelectedRuc] = useState({ 
    id: "", 
    ruc: "",
    descripcion: "" 
  });
  const [nombreCliente, setNombreCliente] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [fecha, setFecha] = useState(today);
  const [subtotal, setSubtotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);
  const [filas, setFilas] = useState([]);
  const [TxttiempoEntrega, setTxtTiempoEntrega] = useState("5 días hábiles");
  const [formaPago, setFormaPago] = useState("50% anticipo, 50% contra entrega");
  const [validezProforma, setValidezProforma] = useState("15 días");
  const [observaciones, setObservaciones] = useState("");
  const [numeroCotizacion, setNumeroCotizacion] = useState("Nueva cotización");
  const textareaRefs = useRef([]);
  const selectionRangesRef = useRef({});
  const filaRefs = useRef([]); // Refs para hacer scroll automático a nuevas filas
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 300, height: 200 });
  const [showConfirmacionClienteModal, setShowConfirmacionClienteModal] = useState(false);
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [nuevoClienteDatos, setNuevoClienteDatos] = useState({
    nombre: '',
    empresa: '',
    direccion: '',
    telefono: '',
    email: '',
    ruc_cedula: ''
  });
  const [onNuevoClienteConfirm, setOnNuevoClienteConfirm] = useState(null); // callback para continuar flujo
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [numeroCotizacionGuardada, setNumeroCotizacionGuardada] = useState('');
  const [nombreEjecutivo, setNombreEjecutivo] = useState('');
  const [clienteIndex, setClienteIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [focusedDropIndex, setFocusedDropIndex] = useState(null);
  const [uploadingImages, setUploadingImages] = useState({}); // Controla el loading de cada imagen
  const [usarContacto, setUsarContacto] = useState(false);
  const [contacto, setContacto] = useState("");
  const [usarCeluar, setUsarCeluar] = useState(false);
  const [boldStates, setBoldStates] = useState([]); // Estado para rastrear si el cursor está en texto en negrita
  const [underlineStates, setUnderlineStates] = useState([]); // Estado para rastrear si el cursor está en texto subrayado
  const [colorStates, setColorStates] = useState([]); // Color activo por fila
  const [celuar, setCeluar] = useState("");
  const [aplicarIva, setAplicarIva] = useState(true); // Checkbox para IVA, marcado por defecto
  const [mostrarTotales, setMostrarTotales] = useState(true); // Mostrar subtotal/iva/descuento/total por defecto
  const [vendedores, setVendedores] = useState([]);
  const [esVendedor, setEsVendedor] = useState(false);
  const [mostrarVendedores, setMostrarVendedores] = useState(false);
  
  // Estados para el modal de clientes
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Estados para el modal de procesos
  const [showProcesosModal, setShowProcesosModal] = useState(false);
  const [filaEditandoProcesos, setFilaEditandoProcesos] = useState(null);

  const normalizarDecimalInput = (valor) => {
    if (valor === null || valor === undefined || valor === "") return "";
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "";

    // Mantener al menos 2 decimales y hasta 6 sin agregar separadores de miles.
    const fijo = numero.toFixed(6);
    const [parteEntera, parteDecimal = ""] = fijo.split(".");
    const decimalesSinCeros = parteDecimal.replace(/0+$/, "");
    const parteDecimalFinal = decimalesSinCeros.length >= 2
      ? decimalesSinCeros
      : parteDecimal.slice(0, 2);

    return `${parteEntera}.${parteDecimalFinal}`;
  };

  // Ref para el modal de éxito
  const successModalRef = useRef(null);
  const vendedoresDropdownRef = useRef(null);

  const saveSelectionForRow = (rowIndex) => {
    const editorElement = textareaRefs.current[rowIndex];
    const selection = window.getSelection();
    if (!editorElement || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editorElement.contains(range.startContainer) && editorElement.contains(range.endContainer)) {
      selectionRangesRef.current[rowIndex] = range.cloneRange();
    }
  };

  const restoreSelectionForRow = (rowIndex) => {
    const editorElement = textareaRefs.current[rowIndex];
    const savedRange = selectionRangesRef.current[rowIndex];
    if (!editorElement || !savedRange) return false;

    editorElement.focus();
    const selection = window.getSelection();
    if (!selection) return false;

    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  };

  const applyActiveColorAtCaret = (rowIndex) => {
    const activeColor = colorStates[rowIndex];
    const editorElement = textareaRefs.current[rowIndex];
    const selection = window.getSelection();
    if (!activeColor || !editorElement || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const isInsideEditor = editorElement.contains(range.startContainer) && editorElement.contains(range.endContainer);

    // Solo forzamos color cuando es caret (sin selección) para no recolorear texto seleccionado accidentalmente.
    if (isInsideEditor && range.collapsed) {
      document.execCommand('foreColor', false, activeColor);
    }
  };

  const autoResizeDetalleEditor = (editorElement) => {
    if (!editorElement) return;
    const minHeight = 140;
    editorElement.style.height = 'auto';
    editorElement.style.height = `${Math.max(minHeight, editorElement.scrollHeight)}px`;
  };

  useEffect(() => {
    if (showSuccessModal && successModalRef.current) {
      successModalRef.current.focus();
    }
  }, [showSuccessModal]);

  // Cerrar dropdown de vendedores al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vendedoresDropdownRef.current && !vendedoresDropdownRef.current.contains(event.target)) {
        setMostrarVendedores(false);
      }
    };

    if (mostrarVendedores) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarVendedores]);

  // Cargar vendedores y verificar si el usuario actual es vendedor
  useEffect(() => {
    const rolUsuario = localStorage.getItem('rol');
    const nombreUsuario = localStorage.getItem('nombre');
    console.log('🔍 Rol del usuario:', rolUsuario);
    const esVendedorActual = rolUsuario === 'vendedor' || rolUsuario === 'Vendedor';
    setEsVendedor(esVendedorActual);
    
    // Si es vendedor, pre-llenar su nombre. Si no, dejar en blanco
    if (esVendedorActual && nombreUsuario && !id) {
      setNombreEjecutivo(nombreUsuario);
      console.log('✅ Usuario es vendedor, pre-llenando nombre:', nombreUsuario);
    } else if (!id) {
      setNombreEjecutivo('');
      console.log('ℹ️ Usuario NO es vendedor, campo en blanco');
    }
    
    // Cargar lista de vendedores
    const token = localStorage.getItem('token');
    fetch(`${apiUrl}/api/usuarios/vendedores`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log('👥 Vendedores cargados:', data);
        setVendedores(data);
      })
      .catch(err => console.error('❌ Error cargando vendedores:', err));
  }, []);

  // Cargar datos de la cotización si estamos en modo edición
  useEffect(() => {
    if (id) {
      cargarCotizacion();
    }
  }, [id]);

  useEffect(() => {
    fetch(`${apiUrl}/api/rucs`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Datos recibidos del backend:", data);
        setRucs(data);
      })
      .catch((error) => console.error("Error al obtener los RUCs:", error));
  }, []);

  // Obtener el número de cotización actual desde la BBDD cuando se crea una nueva
  useEffect(() => {
    const fetchNumeroCotizacion = async () => {
      if (id) return; // En edición ya viene el número desde la carga
      try {
        const token = localStorage.getItem("token");
        console.log("🔍 Obteniendo último número de cotización...");
        const resp = await fetch(`${apiUrl}/api/cotizaciones/ultima`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("📡 Respuesta del servidor:", resp.status, resp.statusText);
        if (!resp.ok) {
          console.warn("❌ Error al obtener último número de cotización:", resp.status);
          return;
        }
        const data = await resp.json();
        console.log("📊 Datos recibidos:", data);
        if (data?.codigo_cotizacion) {
          console.log("✅ Estableciendo código de cotización:", data.codigo_cotizacion);
          setNumeroCotizacion(data.codigo_cotizacion);
        } else {
          console.log("ℹ️ No hay número de cotización previo, usando 00001");
          setNumeroCotizacion("00001");
        }
      } catch (e) {
        console.error("❌ Error al obtener el número de cotización actual:", e);
        setNumeroCotizacion("00001"); // Fallback
      }
    };
    fetchNumeroCotizacion();
  }, [id, apiUrl]);

  const cargarCotizacion = async () => {
    try {
      // Cargar datos de la cotización usando la API correcta
      const token = localStorage.getItem("token");
      const cotizacionResponse = await fetch(`${apiUrl}/api/cotizacionesEditar/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const cotizacionData = await cotizacionResponse.json();
      console.log("Datos recibidos de la cotización:", cotizacionData);

      // Cargar detalles de la cotización
      const detallesResponse = await fetch(`${apiUrl}/api/cotizacionesDetalles/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const detallesData = await detallesResponse.json();
      console.log("Detalles de la cotización:", detallesData);

      // Actualizar el estado con los datos completos
      setFecha(cotizacionData.fecha ? cotizacionData.fecha.split('T')[0] : today);
      setNumeroCotizacion(cotizacionData.codigo_cotizacion || "");
      setTxtTiempoEntrega(cotizacionData.tiempo_entrega ?? "5 días hábiles");
      setFormaPago(cotizacionData.forma_pago ?? "50% anticipo, 50% contra entrega");
      setValidezProforma(cotizacionData.validez_proforma ?? "15 días");
      setObservaciones(cotizacionData.observaciones ?? "");
      
      // Configurar el ejecutivo
      setNombreEjecutivo(cotizacionData.nombre_ejecutivo || localStorage.getItem('nombre') || "");
      
      // Asegurarse de que el RUC se establezca correctamente
      if (cotizacionData.ruc_id && cotizacionData.ruc) {
        const rucData = {
          id: cotizacionData.ruc_id,
          ruc: cotizacionData.ruc,
          descripcion: cotizacionData.ruc_descripcion || ""
        };
        console.log("Estableciendo RUC:", rucData);
        setSelectedRuc(rucData);
      }

      // Establecer el nombre de la empresa y el contacto
      if (cotizacionData.cliente_id) {
        // Poner la empresa en el campo Cliente
        setNombreCliente(cotizacionData.empresa_cliente || cotizacionData.nombre_cliente || "");
        setSelectedClienteId(cotizacionData.cliente_id);
        
        // Configurar el contacto
        if (cotizacionData.contacto) {
          // Si la cotización tiene un contacto guardado, usar ese
          setContacto(cotizacionData.contacto);
          setUsarContacto(true);
        } else if (cotizacionData.nombre_cliente) {
          // Si no tiene contacto guardado, usar el nombre_cliente del cliente como sugerencia
          setContacto(cotizacionData.nombre_cliente);
          setUsarContacto(true);
        } else {
          setContacto("");
          setUsarContacto(false);
        }
      }
      
      // Configurar celular
      if (cotizacionData.celuar) {
        setCeluar(cotizacionData.celuar);
        setUsarCeluar(true);
      } else {
        setCeluar("");
        setUsarCeluar(false);
      }

      // Establecer los detalles de la cotización y calcular totales
      const cotizacionSinTotales = (
        cotizacionData.subtotal == null &&
        cotizacionData.iva == null &&
        cotizacionData.descuento == null &&
        cotizacionData.total == null
      );
      setMostrarTotales(!cotizacionSinTotales);

      if (detallesData && detallesData.length > 0) {
        const filasActualizadas = detallesData.map(detalle => {
          // Asegurarnos de que los valores sean números válidos
          const cantidad = parseFloat(detalle.cantidad) || 0;
          const valorUnitario = parseFloat(detalle.valor_unitario) || 0;
          const valorTotal = parseFloat(detalle.valor_total) || (cantidad * valorUnitario);

          // Procesar las imágenes (ahora es un array)
          const imagenes = (detalle.imagenes && Array.isArray(detalle.imagenes)) 
            ? detalle.imagenes.map(img => ({
                imagen: `${apiUrl}${img.imagen_ruta}`,
                imagen_ruta: img.imagen_ruta,
                imagen_ruta_jpeg: img.imagen_ruta.replace('.webp', '.jpeg'),
                imagen_width: img.imagen_width || 200,
                imagen_height: img.imagen_height || 150,
                id: img.id
              }))
            : [];

          console.log('Imágenes cargadas para detalle:', detalle.detalle, imagenes);

          return {
            cantidad,
            detalle: detalle.detalle || "",
            valor_unitario: normalizarDecimalInput(valorUnitario),
            valor_total: valorTotal,
            imagenes: imagenes,
            alineacion_imagenes: detalle.alineacion_imagenes || 'horizontal',
            posicion_imagen: detalle.posicion_imagen || 'abajo',
            texto_negrita: detalle.texto_negrita || false
          };
        });

        console.log("Filas actualizadas:", filasActualizadas);
        setFilas(filasActualizadas);

        // Calcular totales basados en los detalles
        const subtotalCalculado = filasActualizadas.reduce((sum, fila) => sum + fila.valor_total, 0);
        let ivaCalculado;
        if (cotizacionData && cotizacionData.iva != null) {
          ivaCalculado = parseFloat(cotizacionData.iva) || 0;
        } else {
          ivaCalculado = subtotalCalculado * 0.15;
        }
        const totalCalculado = subtotalCalculado + ivaCalculado;

        setSubtotal(subtotalCalculado);
        setIva(ivaCalculado);
        setDescuento(parseFloat(cotizacionData.descuento) || 0);
        setTotal(totalCalculado);
      } else {
        // Si no hay detalles, usar los valores de la cotización
        setSubtotal(parseFloat(cotizacionData.subtotal) || 0);
        setIva(parseFloat(cotizacionData.iva) || 0);
        setDescuento(parseFloat(cotizacionData.descuento) || 0);
        setTotal(parseFloat(cotizacionData.total) || 0);
        setFilas([]);
      }
    } catch (error) {
      console.error("Error al cargar la cotización:", error);
      alert("Error al cargar la cotización: " + error.message);
    }
  };

  const handleInputChange = async (event) => {
    const valor = event.target.value;
    setNombreCliente(valor);
    setSelectedClienteId(null); // Limpiar el id si el usuario edita el input
    if (valor.trim().length >= 2 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(valor)) {
      await buscarClientes(valor);
    } else {
      setSugerencias([]);
    }
  };

  const handleClienteKeyDown = (e) => {
    if (sugerencias.length === 0) return;
    if (e.key === 'ArrowDown') {
      setClienteIndex((prev) => (prev < sugerencias.length - 1 ? prev + 1 : 0));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setClienteIndex((prev) => (prev > 0 ? prev - 1 : sugerencias.length - 1));
      e.preventDefault();
    } else if (e.key === 'Enter' && clienteIndex >= 0) {
      handleSeleccionarCliente(sugerencias[clienteIndex]);
      e.preventDefault();
    }
  };

  const buscarClientes = async (nombre) => {
    try {
      console.log('🔍 Buscando clientes con:', nombre);
      let url = `${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(nombre)}`;
      if (selectedRuc.id) {
        url += `&ruc_id=${selectedRuc.id}`;
      }
      console.log('📡 URL de búsqueda:', url);
      
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.log('❌ Error en respuesta:', response.status);
        setSugerencias([]);
        return;
      }
      const data = await response.json();
      console.log('✅ Datos recibidos:', data);
      console.log('📊 Cantidad de sugerencias:', data.length);
      setSugerencias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error al buscar clientes:', error);
      setSugerencias([]);
    }
  };

  const handleSeleccionarCliente = (cliente) => {
    // Poner la empresa en el campo Cliente
    setNombreCliente(cliente.empresa || cliente.empresa_cliente || cliente.nombre_cliente);
    // Poner el nombre del contacto en el campo Contacto
    if (cliente.nombre_cliente || cliente.nombre) {
      setContacto(cliente.nombre_cliente || cliente.nombre);
      setUsarContacto(true);
    }
    setSelectedClienteId(cliente.id); // Guardar el id del cliente seleccionado
    setSugerencias([]);
    setClienteIndex(-1);
  };

  // Función para cargar todos los clientes para el modal
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
      alert('Error al cargar la lista de clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    console.log("RUCs cargados:", rucs);
  }, [rucs]);

  const handleRucChange = (event) => {
    const rucSeleccionado = event.target.value;
    console.log("RUC seleccionado:", rucSeleccionado);
    
    const rucObj = rucs.find((r) => r.ruc === rucSeleccionado);
    if (rucObj) {
      const newRuc = { 
        id: rucObj.id, 
        ruc: rucObj.ruc,
        descripcion: rucObj.descripcion 
      };
      console.log("Estableciendo nuevo RUC:", newRuc);
      setSelectedRuc(newRuc);
    } else {
      console.warn("No se encontró el RUC seleccionado en la lista de RUCs");
    }
  };

  //////////////////////////guardar cotizaciones en la bbdd ////////////////////

  const handleGuardarTodo = async () => {
    if (isSaving) {
      console.log("Ya se está guardando, ignorando clic adicional");
      return; // Prevenir doble guardado
    }
    setIsSaving(true);
    console.log("Iniciando guardado de cotización...");
    try {
      // Validaciones iniciales
      if (!selectedRuc || !selectedRuc.id) {
        alert("Por favor seleccione un RUC para proceder");
        return;
      }
      if (!nombreCliente) {
        alert("Por favor ingrese el nombre del cliente");
        return;
      }
      // Validar que haya al menos un producto con detalle y valores
      const productosValidos = filas.filter(fila =>
        fila.detalle && fila.detalle.trim() !== '' &&
        parseFloat(fila.cantidad) > 0 &&
        parseFloat(fila.valor_unitario) > 0
      );
      if (productosValidos.length === 0) {
        alert('Debe agregar al menos un producto con detalle, cantidad y valor unitario para guardar la cotización.');
        return;
      }
      // 2. Si hay un cliente seleccionado, usar su id directamente
      if (selectedClienteId) {
        await continuarGuardadoCotizacion(selectedClienteId);
        return;
      }
      // Si no hay cliente seleccionado, buscar coincidencia exacta en sugerencias
      const clienteCoincidencia = sugerencias.find(
        c => c.nombre_cliente === nombreCliente
      );
      if (clienteCoincidencia) {
        setSelectedClienteId(clienteCoincidencia.id);
        await continuarGuardadoCotizacion(clienteCoincidencia.id);
        return;
      }
      // Si no hay coincidencia en sugerencias, buscar por nombre en la base de datos
      try {
        const buscarClienteResponse = await fetch(
          `${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(nombreCliente)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        let clientesEncontrados = [];
        if (buscarClienteResponse.ok) {
          clientesEncontrados = await buscarClienteResponse.json();
        }
        
        if (clientesEncontrados.length > 0) {
          // Cliente existente
          const clienteId = clientesEncontrados[0].id;
          setSelectedClienteId(clienteId);
          await continuarGuardadoCotizacion(clienteId);
          return;
        }
      } catch (error) {
        console.log('No se pudo buscar cliente en BD, continuando con creación:', error);
      }
      
      // Cliente no encontrado - Mostrar modal de confirmación primero
      setNuevoClienteDatos({ 
        nombre: '', 
        empresa: nombreCliente,
        direccion: '', 
        telefono: '', 
        email: '',
        ruc_cedula: ''
      });
      setShowConfirmacionClienteModal(true);
      setOnNuevoClienteConfirm(() => async (nuevoClienteId) => {
        setSelectedClienteId(nuevoClienteId);
        await continuarGuardadoCotizacion(nuevoClienteId);
      });
      return; // Detener flujo hasta que se confirme
    } catch (error) {
      console.error("Error al procesar la cotización:", error);
      alert("Error al procesar la cotización: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Nueva función auxiliar para continuar el guardado de la cotización
  const continuarGuardadoCotizacion = async (clienteId) => {
    try {
      const token = localStorage.getItem("token");
      // Preparar los datos de las filas incluyendo el array de imágenes
      const filasData = filas.map(fila => ({
        cantidad: parseFloat(fila.cantidad) || 0,
        detalle: fila.detalle || "",
        valor_unitario: parseFloat(fila.valor_unitario) || 0,
        valor_total: parseFloat(fila.valor_total) || 0,
        alineacion_imagenes: fila.alineacion_imagenes || 'horizontal',
        posicion_imagen: fila.posicion_imagen || 'abajo',
        imagenes: (fila.imagenes && Array.isArray(fila.imagenes)) 
          ? fila.imagenes.map(img => ({
              imagen_ruta: img.imagen_ruta,
              imagen_width: img.imagen_width || 200,
              imagen_height: img.imagen_height || 150
            }))
          : []
      }));

      // 3. Preparar los datos de la cotización
      const cotizacionData = {
        fecha: fecha || new Date().toISOString().split('T')[0],
        subtotal: mostrarTotales ? (parseFloat(subtotal) || 0) : null,
        iva: mostrarTotales ? (parseFloat(iva) || 0) : null,
        descuento: mostrarTotales ? (parseFloat(descuento) || 0) : null,
        total: mostrarTotales ? (parseFloat(total) || 0) : null,
        mostrar_totales: mostrarTotales,
        ruc_id: selectedRuc?.id || null,
        cliente_id: clienteId || null,
        tiempo_entrega: TxttiempoEntrega,
        forma_pago: formaPago,
        validez_proforma: validezProforma,
        observaciones: observaciones,
        nombre_ejecutivo: nombreEjecutivo || "",
        contacto: usarContacto && contacto ? contacto : null,
        celuar: usarCeluar && celuar ? celuar : null
      };

      let cotizacionId;
      let numeroCotizacionGuardada = numeroCotizacion;
      if (id) {
        // Actualizar cotización existente
        const updateResponse = await fetch(`${apiUrl}/api/cotizaciones/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cotizacionData)
        });
        if (!updateResponse.ok) {
          throw new Error("Error al actualizar la cotización");
        }
        const updatedCotizacion = await updateResponse.json();
        cotizacionId = updatedCotizacion.id;
        numeroCotizacionGuardada = updatedCotizacion.codigo_cotizacion || numeroCotizacion;
        // Actualizar detalles existentes
        const detallesActualizados = filasData.map(fila => ({
          cantidad: fila.cantidad,
          detalle: fila.detalle,
          valor_unitario: fila.valor_unitario,
          valor_total: fila.valor_total,
          imagenes: fila.imagenes,
          posicion_imagen: fila.posicion_imagen,
          texto_negrita: fila.texto_negrita,
          alineacion_imagenes: fila.alineacion_imagenes
        }));

        const detallesResponse = await fetch(`${apiUrl}/api/cotizacionesDetalles/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ detalles: detallesActualizados })
        });

        if (!detallesResponse.ok) {
          const errorData = await detallesResponse.json();
          throw new Error(errorData.error || "Error al actualizar los detalles de la cotización");
        }

        console.log("🎉 Cotización actualizada exitosamente. Número:", numeroCotizacionGuardada);
        setShowSuccessModal(true);
        setSuccessMessage('¡Cotización actualizada exitosamente!');
        setNumeroCotizacionGuardada(numeroCotizacionGuardada);
        // Notificación local para el usuario logeado (actualización)
        window.dispatchEvent(new CustomEvent("nueva-notificacion", {
          detail: {
            titulo: "Cotización actualizada",
            mensaje: `Has actualizado la cotización N° ${numeroCotizacionGuardada}`,
            fecha: new Date().toLocaleString()
          }
        }));
      } else {
        // Crear nueva cotización
        console.log("Creando nueva cotización con datos:", cotizacionData);
        const createResponse = await fetch(`${apiUrl}/api/cotizaciones`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cotizacionData)
        });
        if (!createResponse.ok) {
          throw new Error("Error al crear la cotización");
        }
        const nuevaCotizacion = await createResponse.json();
        cotizacionId = nuevaCotizacion.id;
        numeroCotizacionGuardada = nuevaCotizacion.codigo_cotizacion;
        
        // Actualizar el número de cotización mostrado con el número real asignado
        setNumeroCotizacion(numeroCotizacionGuardada);
        // Guardar detalles de la nueva cotización
        if (filasData.length > 0) {
          const detallesResponse = await fetch(`${apiUrl}/api/cotizacionesDetalles/${cotizacionId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ detalles: filasData })
          });

          if (!detallesResponse.ok) {
            const errorData = await detallesResponse.json();
            throw new Error(errorData.error || "Error al guardar los detalles de la cotización");
          }
        }

        console.log("🎉 Cotización creada exitosamente. Número asignado:", numeroCotizacionGuardada);
        setShowSuccessModal(true);
        setSuccessMessage('¡Cotización creada exitosamente!');
        setNumeroCotizacionGuardada(numeroCotizacionGuardada);
        // Notificación local para el usuario logeado
        window.dispatchEvent(new CustomEvent("nueva-notificacion", {
          detail: {
            titulo: "Cotización creada",
            mensaje: `Has creado la cotización N° ${numeroCotizacionGuardada}`,
            fecha: new Date().toLocaleString()
          }
        }));
      }
    } catch (error) {
      console.error("Error al procesar la cotización:", error);
      alert("Error al procesar la cotización: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Nueva función para guardar como nueva cotización
  const handleGuardarComoNueva = async () => {
    if (isSaving) {
      console.log("Ya se está guardando, ignorando clic adicional");
      return; // Prevenir doble guardado
    }
    setIsSaving(true);
    console.log("Iniciando guardado como nueva cotización...");
    try {
      // Validaciones iniciales
      if (!selectedRuc.id) {
        alert("Selecciona un RUC para la cotización");
        return;
      }
      if (!nombreCliente.trim()) {
        alert("El nombre del cliente es requerido");
        return;
      }
      // 2. Si hay un cliente seleccionado, usar su id directamente
      if (selectedClienteId) {
        await guardarCotizacionComoNueva(selectedClienteId);
        return;
      }

      // Si no hay cliente seleccionado, buscar coincidencia exacta en sugerencias
      const clienteCoincidencia = sugerencias.find(
        c => c.nombre_cliente === nombreCliente
      );
      if (clienteCoincidencia) {
        setSelectedClienteId(clienteCoincidencia.id);
        await guardarCotizacionComoNueva(clienteCoincidencia.id);
        return;
      }

      // Si no hay coincidencia en sugerencias, buscar por nombre en la base de datos
      try {
        const buscarClienteResponse = await fetch(
          `${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(nombreCliente)}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        let clientesEncontrados = [];
        if (buscarClienteResponse.ok) {
          clientesEncontrados = await buscarClienteResponse.json();
        }
        
        if (clientesEncontrados.length > 0) {
          // Cliente existente
          const clienteId = clientesEncontrados[0].id;
          setSelectedClienteId(clienteId);
          await guardarCotizacionComoNueva(clienteId);
          return;
        }
      } catch (error) {
        console.log('No se pudo buscar cliente en BD, continuando con creación:', error);
      }
      
      // Cliente no encontrado - Mostrar modal de confirmación primero
      setNuevoClienteDatos({ 
        nombre: '', 
        empresa: nombreCliente,
        direccion: '', 
        telefono: '', 
        email: '',
        ruc_cedula: ''
      });
      setShowConfirmacionClienteModal(true);
      setOnNuevoClienteConfirm(() => async (nuevoClienteId) => {
        setSelectedClienteId(nuevoClienteId);
        await guardarCotizacionComoNueva(nuevoClienteId);
      });
      return; // Detener flujo hasta que se confirme
    } catch (error) {
      console.error("Error al guardar la nueva cotización:", error);
      alert("Error al guardar la nueva cotización: " + error.message);
    }
  };

  // Nota: El número de cotización se asignará automáticamente por la base de datos al guardar

  // Función para agregar una nueva fila
  const agregarFila = () => {
    // Texto HTML inicial para el detalle, con títulos en negrita — cada línea en su propio div para evitar reflow
    const detalleInicial = [
      '<div><br></div>',
      '<div><span contenteditable="false" style="font-weight:700;white-space:nowrap;">IMPRESIÓN :</span>&nbsp;</div>',
      '<div><span contenteditable="false" style="font-weight:700;white-space:nowrap;">MATERIAL :</span>&nbsp;</div>',
      '<div><span contenteditable="false" style="font-weight:700;white-space:nowrap;">TERMINADO :</span>&nbsp;</div>',
      '<div><span contenteditable="false" style="font-weight:700;white-space:nowrap;">TAMAÑO :</span>&nbsp;</div>',
    ].join('');
    const nuevasFilas = [
      ...filas,
      {
        cantidad: 1,
        detalle: detalleInicial,
        valor_unitario: '',
        valor_total: 0,
        imagenes: [],  // Array vacío para múltiples imágenes
        alineacion_imagenes: 'horizontal',  // Alineación por defecto (horizontal/vertical)
        posicion_imagen: 'abajo',  // Posición por defecto (abajo/derecha)
        texto_negrita: false  // Si el texto debe mostrarse en negrita
      }
    ];
    setFilas(nuevasFilas);
    
    // Hacer scroll al nuevo producto después de que se renderice
    setTimeout(() => {
      const nuevoIndex = nuevasFilas.length - 1;
      if (filaRefs.current[nuevoIndex]) {
        filaRefs.current[nuevoIndex].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  // Función para eliminar una fila
  const eliminarFila = (index) => {
    const nuevasFilas = filas.filter((_, i) => i !== index);
    setFilas(nuevasFilas);
  };

  // Función para abrir el modal de procesos
  const abrirModalProcesos = (index) => {
    setFilaEditandoProcesos(index);
    setShowProcesosModal(true);
  };

  // Función para guardar los datos del modal de procesos
  const guardarDatosItemProcesos = (itemData) => {
    if (filaEditandoProcesos !== null) {
      const nuevasFilas = [...filas];
      nuevasFilas[filaEditandoProcesos] = {
        ...nuevasFilas[filaEditandoProcesos],
        cantidad: itemData.cantidad,
        detalle: `${itemData.tipo_trabajo} - ${itemData.descripcion}\nTamaño: C:${itemData.tamano_cerrado} / A:${itemData.tamano_abierto}`,
        valor_unitario: normalizarDecimalInput(itemData.precio_unitario),
        valor_total: itemData.total,
        // Guardar datos adicionales para referencia
        tipo_trabajo: itemData.tipo_trabajo,
        descripcion_trabajo: itemData.descripcion,
        tamano_cerrado: itemData.tamano_cerrado,
        tamano_abierto: itemData.tamano_abierto,
        procesos: itemData.procesos
      };
      setFilas(nuevasFilas);
      calcularTotales(nuevasFilas); // Recalcular totales después de actualizar el ítem
    }
    setShowProcesosModal(false);
    setFilaEditandoProcesos(null);
  };

  // Función para manejar el cambio de imagen - ahora agrega al array
  const handleImagenChange = async (index, file) => {
    if (file) {
      try {
        // Mostrar loading
        setUploadingImages(prev => ({ ...prev, [index]: true }));
        
        // Crear un FormData para enviar el archivo
        const formData = new FormData();
        formData.append('imagen', file);

        // Subir la imagen al servidor
        const response = await fetch(`${apiUrl}/api/upload/imagen`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Error al subir la imagen');
        }

        const data = await response.json();
        
        // Agregar la nueva imagen al array de imágenes
        const nuevasFilas = [...filas];
        const imagenesActuales = nuevasFilas[index].imagenes || [];
        
        // Si ya hay imágenes, tomar el tamaño de la primera; si no, usar valores por defecto
        const width = imagenesActuales.length > 0 ? imagenesActuales[0].imagen_width : 200;
        const height = imagenesActuales.length > 0 ? imagenesActuales[0].imagen_height : 150;
        
        nuevasFilas[index] = {
          ...nuevasFilas[index],
          imagenes: [
            ...imagenesActuales,
            {
              imagen: `${apiUrl}${data.imagenRuta}`,
              imagen_ruta: data.imagenRuta,
              imagen_ruta_jpeg: data.imagenRutaJpeg,
              imagen_width: width,
              imagen_height: height,
              thumbnail: data.thumbnail,
              metadata: data.metadata
            }
          ]
        };
        setFilas(nuevasFilas);

        // Abrir ajuste tras subir para que el usuario redimensione arrastrando.
        const nuevaImagenIndex = imagenesActuales.length;
        setSelectedImageIndices({ row: index, img: nuevaImagenIndex });
        setImageDimensions({ width, height });

        // Resetear el input de archivo
        const fileInput = document.getElementById(`file-upload-${index}`);
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        alert('Error al subir la imagen: ' + error.message);
      } finally {
        // Ocultar loading
        setUploadingImages(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  // Quitar botón de agregar imagen: ahora usamos un área de soltar/pegar

  // Soporte de arrastrar/soltar y pegar imágenes
  const uploadFileToRow = async (index, file) => {
    if (!file) {
      alert('No se seleccionó ningún archivo');
      return;
    }
    
    // Validar que sea una imagen
    if (!file.type || !file.type.startsWith('image/')) {
      alert('Por favor seleccione solo archivos de imagen (JPG, PNG, GIF, etc.)');
      return;
    }
    
    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. El tamaño máximo permitido es 10MB');
      return;
    }
    
    try {
      await handleImagenChange(index, file);
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
      alert('Error al procesar la imagen: ' + error.message);
    }
  };

  const handleDragOverRow = (index, e) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnterRow = (index, e) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeaveRow = (index, e) => {
    // Limpiar resaltado cuando salimos del contenedor
    setDragOverIndex(prev => (prev === index ? null : prev));
  };

  const handleDropImage = async (index, e) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dt = e.dataTransfer;
    if (!dt) return;

    if (dt.files && dt.files.length > 0) {
      // Preferimos el primer archivo de imagen
      const imageFile = Array.from(dt.files).find(f => f.type && f.type.startsWith('image/')) || dt.files[0];
      await uploadFileToRow(index, imageFile);
      return;
    }

    // Intentar con una URL arrastrada (por ejemplo, desde el navegador)
    try {
      const uri = dt.getData('text/uri-list') || dt.getData('text/plain');
      if (uri && /^https?:\/\//i.test(uri)) {
        const resp = await fetch(uri);
        const blob = await resp.blob();
        const extension = (blob.type && blob.type.split('/')[1]) || 'png';
        const file = new File([blob], `dropped-image.${extension}`, { type: blob.type || 'image/png' });
        await uploadFileToRow(index, file);
      }
    } catch (_) {
      // Silencioso: si falla, simplemente no hacemos nada
    }
  };

  const handlePasteImage = async (index, e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items || items.length === 0) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          const extension = (blob.type && blob.type.split('/')[1]) || 'png';
          const file = new File([blob], `pasted-image.${extension}`, { type: blob.type || 'image/png' });
          await uploadFileToRow(index, file);
          // Prevenir que pegue datos binarios en el textarea
          e.preventDefault();
        }
        break;
      }
    }
  };

  // Función para eliminar una imagen del array
  const handleEliminarImagen = async (rowIndex, imageIndex) => {
    try {
      const imagen = filas[rowIndex].imagenes[imageIndex];
      const imagenRuta = imagen?.imagen_ruta;
      
      // Solo intentar eliminar la imagen del servidor si estamos en modo edición y existe una ruta
      if (id && imagenRuta) {
        try {
          const response = await fetch(`${apiUrl}/api/upload/imagen`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              imagenRuta,
              cotizacionId: id
            })
          });

          // No lanzamos error si la respuesta no es ok, solo lo registramos
          if (!response.ok) {
            console.warn('No se pudo eliminar la imagen del servidor, pero se procederá con la eliminación local');
          }
        } catch (serverError) {
          // Solo registramos el error pero continuamos con la eliminación local
          console.warn('Error al intentar eliminar la imagen del servidor:', serverError);
        }
      }

      // Actualizar el estado local eliminando la imagen del array
      const nuevasFilas = [...filas];
      const imagenesActuales = nuevasFilas[rowIndex].imagenes || [];
      nuevasFilas[rowIndex] = {
        ...nuevasFilas[rowIndex],
        imagenes: imagenesActuales.filter((_, idx) => idx !== imageIndex)
      };
      setFilas(nuevasFilas);

      // Mostrar mensaje de éxito
      console.log('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      alert('Error al eliminar la imagen: ' + error.message);
    }
  };

  // Función auxiliar para formatear números de manera segura
  const formatearNumero = (numero) => {
    if (numero === null || numero === undefined || numero === '') return "0.00";
    const n = Number(numero);
    if (isNaN(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  // Función auxiliar para formatear número de cotización de manera segura
  const formatearNumeroCotizacion = (numero) => {
    if (numero === null || numero === undefined) return "Nueva cotización";
    return numero.toString().padStart(5, '0');
  };

  const calcularTotalFila = (cantidad, valorUnitario) => {
    const total = parseFloat(cantidad) * parseFloat(valorUnitario);
    return isNaN(total) ? 0 : total;
  };

  const handleCantidadChange = (index, value) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index].cantidad = value;
    nuevasFilas[index].valor_total = calcularTotalFila(value, nuevasFilas[index].valor_unitario);
    setFilas(nuevasFilas);
    calcularTotales(nuevasFilas);
  };

  const handleValorUnitarioChange = (index, value) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index].valor_unitario = value;
    nuevasFilas[index].valor_total = calcularTotalFila(nuevasFilas[index].cantidad, value);
    setFilas(nuevasFilas);
    calcularTotales(nuevasFilas);
  };

  const normalizarValorUnitarioFila = (index) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index].valor_unitario = normalizarDecimalInput(nuevasFilas[index].valor_unitario);
    nuevasFilas[index].valor_total = calcularTotalFila(nuevasFilas[index].cantidad, nuevasFilas[index].valor_unitario);
    setFilas(nuevasFilas);
    calcularTotales(nuevasFilas);
  };

  const calcularTotales = (filasActuales) => {
    const subtotal = filasActuales.reduce((sum, fila) => {
      const totalFila = parseFloat(fila.valor_total) || 0;
      return sum + totalFila;
    }, 0);
    const ivaCalculado = aplicarIva ? subtotal * 0.15 : 0;
    const descuentoNum = parseFloat(descuento) || 0;
    const total = subtotal + ivaCalculado - descuentoNum;

    setSubtotal(subtotal);
    setIva(ivaCalculado);
    setTotal(total);
  };

  // Actualiza el subtotal cuando cambian los productos
  useEffect(() => {
    const nuevoSubtotal = filas.reduce((acc, fila) => {
      return acc + (parseFloat(fila.valor_total) || 0);
    }, 0);
    setSubtotal(nuevoSubtotal);
  }, [filas]); // Se ejecuta cada vez que `filas` cambia

  // Recalcular totales cuando cambie el IVA o el descuento
  useEffect(() => {
    calcularTotales(filas);
  }, [aplicarIva, descuento]);

  // El editor de detalle mantiene altura fija para evitar que se expanda al escribir.

  // Función para generar la vista previa
  const generarVistaPrevia = async (filasOverride = filas) => {
    try {
      setPreviewLoading(true);
      
      // Siempre usar los datos actuales del formulario (en tiempo real)
      const cotizacionTemp = {
        codigo_cotizacion: numeroCotizacion,
        fecha: fecha,
        nombre_cliente: nombreCliente,
        contacto: usarContacto && contacto ? contacto : null,
        celuar: celuar || null,
        ruc: selectedRuc.ruc,
        subtotal: mostrarTotales ? subtotal : null,
        iva: mostrarTotales ? iva : null,
        descuento: mostrarTotales ? descuento : null,
        total: mostrarTotales ? total : null,
        mostrar_totales: mostrarTotales,
        tiempo_entrega: TxttiempoEntrega,
        forma_pago: formaPago,
        validez_proforma: validezProforma,
        observaciones: observaciones,
        nombre_ejecutivo: nombreEjecutivo
      };

      const detallesTemp = filasOverride.map(fila => ({
        cantidad: fila.cantidad,
        detalle: fila.detalle,
        valor_unitario: fila.valor_unitario,
        valor_total: fila.valor_total,
        alineacion_imagenes: fila.alineacion_imagenes || 'horizontal',
        posicion_imagen: fila.posicion_imagen || 'abajo',
        texto_negrita: fila.texto_negrita || false,
        imagenes: (fila.imagenes && Array.isArray(fila.imagenes)) 
          ? fila.imagenes.map(img => ({
              imagen_ruta: img.imagen_ruta,
              orden: 0,
              imagen_width: img.imagen_width || 200,
              imagen_height: img.imagen_height || 150
            }))
          : []
      }));

      // Siempre pasar los datos del formulario (null como ID para forzar uso de datos proporcionados)
      const pdfUrl = await generarVistaPreviaPDF(null, cotizacionTemp, detallesTemp);
      setPreviewUrl(pdfUrl);
      setShowPreview(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar la vista previa: ' + error.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Función para cerrar la vista previa
  const cerrarVistaPrevia = () => {
    setShowPreview(false);
    setPreviewUrl(null);
  };

  // Función para mostrar el modal de ajuste de imagen - ahora recibe rowIndex e imageIndex
  const [selectedImageIndices, setSelectedImageIndices] = React.useState({ row: null, img: null });

  const clampImageDimensions = (width, height) => {
    const minWidth = 100;
    const minHeight = 75;
    const maxWidth = 600;
    const maxHeight = 400;

    return {
      width: Math.max(minWidth, Math.min(maxWidth, width)),
      height: Math.max(minHeight, Math.min(maxHeight, height))
    };
  };

  const showImageAdjustModal = (rowIndex, imgIndex) => {
    setSelectedImageIndices({ row: rowIndex, img: imgIndex });
    const imagen = filas[rowIndex].imagenes[imgIndex];
    setImageDimensions(
      clampImageDimensions(
        imagen.imagen_width || 200,
        imagen.imagen_height || 150
      )
    );
  };

  const handleResizeImagePreview = (_, { size }) => {
    setImageDimensions(clampImageDimensions(size.width, size.height));
  };

  // Función para aplicar los cambios de dimensiones
  const applyImageDimensions = ({ openPreview = false, closeModal = true } = {}) => {
    if (selectedImageIndices.row !== null && selectedImageIndices.img !== null) {
      const constrained = clampImageDimensions(imageDimensions.width, imageDimensions.height);
      
      const newFilas = [...filas];
      const imagenesActuales = [...newFilas[selectedImageIndices.row].imagenes];
      imagenesActuales[selectedImageIndices.img] = {
        ...imagenesActuales[selectedImageIndices.img],
        imagen_width: constrained.width,
        imagen_height: constrained.height
      };
      newFilas[selectedImageIndices.row] = {
        ...newFilas[selectedImageIndices.row],
        imagenes: imagenesActuales
      };
      setFilas(newFilas);

      if (closeModal) {
        setSelectedImageIndices({ row: null, img: null });
      }

      if (openPreview) {
        generarVistaPrevia(newFilas);
      }
    }
  };

  const guardarCotizacionComoNueva = async (clienteId) => {
    try {
      const token = localStorage.getItem("token");
      // Preparar los datos de las filas incluyendo el array de imágenes
      const filasData = filas.map(fila => ({
        cantidad: parseFloat(fila.cantidad) || 0,
        detalle: fila.detalle || "",
        valor_unitario: parseFloat(fila.valor_unitario) || 0,
        valor_total: parseFloat(fila.valor_total) || 0,
        alineacion_imagenes: fila.alineacion_imagenes || 'horizontal',
        posicion_imagen: fila.posicion_imagen || 'abajo',
        texto_negrita: fila.texto_negrita || false,
        imagenes: (fila.imagenes && Array.isArray(fila.imagenes)) 
          ? fila.imagenes.map(img => ({
              imagen_ruta: img.imagen_ruta,
              imagen_width: img.imagen_width || 200,
              imagen_height: img.imagen_height || 150
            }))
          : []
      }));

      // 3. Crear la nueva cotización con todas las relaciones
      const cotizacionData = {
        fecha: fecha || new Date().toISOString().split('T')[0],
        subtotal: mostrarTotales ? (parseFloat(subtotal) || 0) : null,
        iva: mostrarTotales ? (parseFloat(iva) || 0) : null,
        descuento: mostrarTotales ? (parseFloat(descuento) || 0) : null,
        total: mostrarTotales ? (parseFloat(total) || 0) : null,
        mostrar_totales: mostrarTotales,
        ruc_id: selectedRuc?.id || null,
        cliente_id: clienteId || null,
        // numero_cotizacion se asignará automáticamente por la base de datos
        tiempo_entrega: TxttiempoEntrega,
        forma_pago: formaPago,
        validez_proforma: validezProforma,
        observaciones: observaciones,
        nombre_ejecutivo: nombreEjecutivo || "",
        contacto: usarContacto && contacto ? contacto : null,
        celuar: celuar || null
      };

      console.log("Guardando cotización como nueva con datos:", cotizacionData);
      const responseCotizacion = await fetch(`${apiUrl}/api/cotizaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cotizacionData),
      });

      if (!responseCotizacion.ok) {
        throw new Error("Error al guardar la nueva cotización");
      }

      const nuevaCotizacion = await responseCotizacion.json();

      // 4. Guardar los detalles de la nueva cotización
      for (let i = 0; i < filasData.length; i++) {
        const fila = filasData[i];
        console.log(`Guardando detalle ${i + 1}/${filasData.length}:`, fila);
        
        const detalleData = {
          cotizacion_id: nuevaCotizacion.id,
          cantidad: fila.cantidad,
          detalle: fila.detalle,
          valor_unitario: fila.valor_unitario,
          valor_total: fila.valor_total,
          alineacion_imagenes: fila.alineacion_imagenes,
          posicion_imagen: fila.posicion_imagen || 'abajo',
          texto_negrita: fila.texto_negrita || false,
          imagenes: fila.imagenes
        };

        const responseDetalle = await fetch(`${apiUrl}/api/cotizacionesDetalles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(detalleData),
        });

        if (!responseDetalle.ok) {
          const errorData = await responseDetalle.json().catch(() => ({}));
          console.error(`Error en detalle ${i + 1}:`, errorData);
          throw new Error(`Error al guardar detalle ${i + 1}: ${errorData.error || 'Error desconocido'}`);
        }
      }

      console.log("🎉 Nueva cotización guardada exitosamente. Código asignado:", nuevaCotizacion.codigo_cotizacion);
      setShowSuccessModal(true);
      setSuccessMessage('¡Nueva cotización guardada exitosamente!');
      setNumeroCotizacionGuardada(nuevaCotizacion.codigo_cotizacion || '');
      
      // Actualizar el número de cotización mostrado con el código real asignado
      setNumeroCotizacion(nuevaCotizacion.codigo_cotizacion || '');
      // Notificación local para el usuario logeado (guardar como nueva)
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Cotización guardada como nueva",
          mensaje: `Has guardado la cotización N° ${nuevaCotizacion.codigo_cotizacion} como nueva.`,
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error("Error al guardar la nueva cotización:", error);
      alert("Error al guardar la nueva cotización: " + error.message);
    }
  };

  // Función para guardar cliente con Enter en el modal
  const handleNuevoClienteKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Validar campos obligatorios
      if (!nuevoClienteDatos.nombre || !nuevoClienteDatos.empresa || 
          !nuevoClienteDatos.ruc_cedula || !nuevoClienteDatos.direccion || 
          !nuevoClienteDatos.telefono || !nuevoClienteDatos.email) {
        alert('Por favor complete todos los campos obligatorios (*).');
        return;
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(nuevoClienteDatos.email)) {
        alert('Por favor ingrese un email válido.');
        return;
      }
      
      // Guardar cliente en la BBDD
      try {
        const token = localStorage.getItem("token");
        const crearClienteResponse = await fetch(`${apiUrl}/api/clientes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre: nuevoClienteDatos.nombre,
            empresa: nuevoClienteDatos.empresa,
            ruc_cedula: nuevoClienteDatos.ruc_cedula,
            direccion: nuevoClienteDatos.direccion,
            telefono: nuevoClienteDatos.telefono,
            email: nuevoClienteDatos.email,
            estado: 'activo',
            notas: `Cliente creado desde cotización el ${new Date().toLocaleDateString()}`
          })
        });
        
        if (!crearClienteResponse.ok) {
          const errorData = await crearClienteResponse.json();
          throw new Error(errorData.details || errorData.error || "Error al crear cliente");
        }
        
        const clienteCreado = await crearClienteResponse.json();
        console.log('✅ Cliente creado:', clienteCreado);
        
        // Actualizar el campo Cliente con la empresa y Contacto con el nombre
        setNombreCliente(nuevoClienteDatos.empresa);
        setContacto(nuevoClienteDatos.nombre);
        setUsarContacto(true);
        setShowNuevoClienteModal(false);
        
        // Continuar con el guardado de la cotización
        if (onNuevoClienteConfirm) {
          await onNuevoClienteConfirm(clienteCreado.cliente.id);
        }
      } catch (error) {
        console.error('Error al crear cliente:', error);
        alert('Error al guardar el cliente: ' + error.message);
      }
    }
  };



  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {id ? "Editar Cotización" : "Nueva Cotización"}
        </h1>
        <div className="flex gap-2">
          {id ? (
            <>
              <button
                onClick={handleGuardarComoNueva}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <FaSave className="mr-2" /> Guardar como Nueva
              </button>
              <button
                onClick={handleGuardarTodo}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={isSaving}
              >
                <FaSave className="mr-2" /> Actualizar Cotizacion
              </button>
            </>
          ) : (
            <button
              onClick={handleGuardarTodo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={isSaving}
            >
              <FaSave className="mr-2" /> Guardar Cotización
            </button>
          )}
        </div>
      </div>

      {/* Barra lateral de botones */}
      {/* Eliminado el menú lateral innecesario */}

      {/* Contenedor principal con formato A4 */}
      <div className="mx-auto bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl min-h-screen" id="cotizaciones-container">
        {/* Encabezado */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            {/* Izquierda: MUNDOGRAFIC */}
            <div className="flex-shrink-0">
              <Logo/>
              <p className="text-sm text-gray-600 mt-2">
         
              </p>
            </div>

            {/* Derecha: COTIZACIÓN y R.U.C */}
            {/* Derecha: COTIZACIÓN y R.U.C en una sola línea (se apila en móvil) */}
<div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-end sm:space-x-6 gap-4 w-full sm:w-auto">
  {/* COTIZACIÓN */}
  <div className="bg-gray-100 p-4 rounded-lg text-center">
    <span className="text-sm font-semibold text-gray-600">COTIZACIÓN</span>
    <div className="text-xl font-bold text-gray-800">{numeroCotizacion}</div>
  </div>

  {/* R.U.C */}
  <div className="flex flex-col">
    <span className="text-sm font-semibold text-gray-600 mb-2">R.U.C</span>
    <select
      value={selectedRuc.ruc}
      onChange={handleRucChange}
      className="w-full sm:w-48 border border-gray-300 rounded-md p-2"
    >
      <option value="">Seleccione un RUC</option>
      {rucs.map((ruc) => (
        <option key={ruc.id} value={ruc.ruc}>
          {ruc.ruc} - {ruc.descripcion}
        </option>
      ))}
    </select>
  </div>
</div>

          </div>  
        
        </div>

        {/* Datos del cliente */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Cliente:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={handleInputChange}
                  onKeyDown={handleClienteKeyDown}
                  placeholder="Ingrese el nombre de la empresa..."
                  className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
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
              {/* Sugerencias de autocompletado */}
              {sugerencias.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full max-h-48 overflow-y-auto shadow-lg" style={{ top: '100%' }}>
                  {sugerencias.map((s, idx) => (
                    <li
                      key={s.id}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${clienteIndex === idx ? 'bg-blue-100' : ''}`}
                      onMouseDown={() => handleSeleccionarCliente(s)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{s.empresa || s.empresa_cliente || s.nombre_cliente}</span>
                        <span className="text-xs text-gray-500">Contacto: {s.nombre_cliente || s.nombre}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="usarContacto"
                  type="checkbox"
                  checked={usarContacto}
                  onChange={(e) => setUsarContacto(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="usarContacto" className="text-sm text-gray-700">Contacto</label>
                <input
                  type="text"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  disabled={!usarContacto}
                  placeholder="Nombre del contacto"
                  className={`flex-1 border rounded-md p-2 ${!usarContacto ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              />
            </div>
            <div className="relative flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ejecutivo de Cuenta:</label>
              <div className="flex gap-1 relative" ref={vendedoresDropdownRef}>
                <input
                  type="text"
                  value={nombreEjecutivo}
                  onChange={(e) => setNombreEjecutivo(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ejecutivo de cuenta"
                />
                <button
                  type="button"
                  onClick={() => setMostrarVendedores(!mostrarVendedores)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                  title={vendedores.length > 0 ? "Ver vendedores" : "No hay vendedores registrados"}
                >
                  ▼
                </button>
                {mostrarVendedores && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {vendedores.length > 0 ? (
                      vendedores.map((vendedor) => (
                        <div
                          key={vendedor.id}
                          onClick={() => {
                            setNombreEjecutivo(vendedor.nombre);
                            setCeluar(vendedor.celular || '');
                            setUsarCeluar(!!vendedor.celular);
                            setMostrarVendedores(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                        >
                          {vendedor.nombre}
                          {vendedor.email && <span className="text-xs text-gray-500 ml-2">({vendedor.email})</span>}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 italic">
                        No hay vendedores registrados. Crea usuarios con rol "vendedor" desde Administración.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="usarCeluar"
                  type="checkbox"
                  checked={usarCeluar}
                  onChange={(e) => setUsarCeluar(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="usarCeluar" className="text-sm text-gray-700">Celular</label>
                <input
                  type="text"
                  value={celuar}
                  onChange={(e) => setCeluar(e.target.value)}
                  className={`flex-1 border rounded-md p-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acciones encima de la tabla */}
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => generarVistaPrevia()}
            disabled={previewLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaEye />
            {previewLoading ? 'Generando...' : 'Vista Previa PDF'}
          </button>
          
          <button 
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-sm transition-all duration-300 ease-in-out flex items-center gap-2"
            onClick={agregarFila}
          >
            <i className="fas fa-plus"></i>
            Agregar Producto
          </button>
        </div>

        {/* Tabla de productos */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-sm table-fixed">
            <colgroup>
              <col style={{ width: '90px' }} />
              <col style={{ width: '95px' }} />
              <col style={{ width: '12.35cm' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '80px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Procesos</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Unitario</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, index) => (
                <React.Fragment key={index}>
                  <tr ref={(el) => (filaRefs.current[index] = el)}>
                    <td className="border border-gray-300 px-2 py-2 text-center align-top">
                      <button
                        onClick={() => abrirModalProcesos(index)}
                        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex flex-col items-center gap-1"
                        title="Calcular con procesos de producción"
                      >
                        <FaCalculator className="text-lg" />
                        <span className="text-xs whitespace-nowrap">Calcular</span>
                      </button>
                    </td>
                    <td className="border border-gray-300 py-2 align-top">
                      <input
                        type="number"
                        value={fila.cantidad}
                        onChange={(e) => handleCantidadChange(index, e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full border border-gray-300 rounded-md p-2 text-center"
                        min="1"
                      />
                    </td>
                    <td className="border border-gray-300 p-0 align-top">
                      {/* Botón de negrita */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevenir que pierda el foco
                            const editorElement = textareaRefs.current[index];
                            if (editorElement) {
                              editorElement.focus();
                              document.execCommand('bold', false, null);
                              
                              // Actualizar el contenido inmediatamente
                              const nuevasFilas = [...filas];
                              nuevasFilas[index].detalle = editorElement.innerHTML;
                              setFilas(nuevasFilas);
                              
                              // Actualizar el estado de negrita
                              setTimeout(() => {
                                const isBold = document.queryCommandState('bold');
                                const newBoldStates = [...boldStates];
                                newBoldStates[index] = isBold;
                                setBoldStates(newBoldStates);
                              }, 10);
                            }
                          }}
                          className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                            boldStates[index] 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Selecciona texto y haz click para aplicar negrita"
                        >
                          <i className="fas fa-bold"></i>
                          <strong>B</strong>
                        </button>
                        <span className="text-xs text-gray-600 font-bold">Negrita</span>
                        </div>

                        {/* Botón de subrayado */}
                        <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const editorElement = textareaRefs.current[index];
                            if (editorElement) {
                              editorElement.focus();
                              document.execCommand('underline', false, null);
                              const nuevasFilas = [...filas];
                              nuevasFilas[index].detalle = editorElement.innerHTML;
                              setFilas(nuevasFilas);
                              setTimeout(() => {
                                const isUnderline = document.queryCommandState('underline');
                                const newUnderlineStates = [...underlineStates];
                                newUnderlineStates[index] = isUnderline;
                                setUnderlineStates(newUnderlineStates);
                              }, 10);
                            }
                          }}
                          className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                            underlineStates[index]
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Selecciona texto y haz click para subrayar"
                        >
                          <i className="fas fa-underline"></i>
                          <u>U</u>
                        </button>
                        <span className="text-xs text-gray-600 underline">Subrayado</span>
                        </div>

                        {/* Panel de colores */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {[
                            { color: '#000000', label: 'Negro' },
                            { color: '#1e40af', label: 'Azul' },
                            { color: '#dc2626', label: 'Rojo' },
                            { color: '#16a34a', label: 'Verde' },
                            { color: '#9333ea', label: 'Morado' },
                            { color: '#ea580c', label: 'Naranja' },
                            { color: '#0891b2', label: 'Celeste' },
                            { color: '#be185d', label: 'Rosa' },
                          ].map(({ color, label }) => (
                            <button
                              key={color}
                              type="button"
                              title={label}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const editorElement = textareaRefs.current[index];
                                if (editorElement) {
                                  editorElement.focus();
                                  document.execCommand('foreColor', false, color);
                                  const nuevasFilas = [...filas];
                                  nuevasFilas[index].detalle = editorElement.innerHTML;
                                  setFilas(nuevasFilas);
                                  const newColorStates = [...colorStates];
                                  newColorStates[index] = color;
                                  setColorStates(newColorStates);
                                }
                              }}
                              className="w-5 h-5 rounded-full transition-all flex-shrink-0"
                              style={{
                                backgroundColor: color,
                                border: colorStates[index] === color
                                  ? '3px solid #1d4ed8'
                                  : '2px solid transparent',
                                boxShadow: colorStates[index] === color
                                  ? '0 0 0 2px white, 0 0 0 4px #1d4ed8'
                                  : 'none',
                                transform: colorStates[index] === color ? 'scale(1.25)' : 'scale(1)',
                              }}
                            />
                          ))}
                          {/* Color personalizado */}
                          <label
                            title="Color personalizado"
                            className="w-5 h-5 rounded-full border-2 border-dashed border-gray-400 cursor-pointer flex items-center justify-center overflow-hidden hover:scale-110 transition-transform"
                            style={{ flexShrink: 0 }}
                            onMouseDown={() => saveSelectionForRow(index)}
                          >
                            <input
                              type="color"
                              className="opacity-0 absolute w-0 h-0"
                              onChange={(e) => {
                                const color = e.target.value;
                                const editorElement = textareaRefs.current[index];
                                if (editorElement) {
                                  const restored = restoreSelectionForRow(index);
                                  if (!restored) {
                                    editorElement.focus();
                                  }
                                  document.execCommand('foreColor', false, color);
                                  const nuevasFilas = [...filas];
                                  nuevasFilas[index].detalle = editorElement.innerHTML;
                                  setFilas(nuevasFilas);
                                  const newColorStates = [...colorStates];
                                  newColorStates[index] = color;
                                  setColorStates(newColorStates);
                                  saveSelectionForRow(index);
                                }
                              }}
                            />
                            <i className="fas fa-palette text-gray-500" style={{ fontSize: '10px' }}></i>
                          </label>
                        </div>
                      </div>
                      
                      <div
                        ref={(el) => {
                          textareaRefs.current[index] = el;
                          // Solo setear el contenido inicial si está vacío
                          if (el && !el.innerHTML && fila.detalle) {
                            el.innerHTML = fila.detalle;
                          }
                          if (el) {
                            autoResizeDetalleEditor(el);
                          }
                        }}
                        contentEditable
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        data-gramm="false"
                        data-gramm_editor="false"
                        data-enable-grammarly="false"
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const nuevasFilas = [...filas];
                          nuevasFilas[index].detalle = e.currentTarget.innerHTML;
                          setFilas(nuevasFilas);
                          autoResizeDetalleEditor(e.currentTarget);
                        }}
                        onKeyUp={() => {
                          saveSelectionForRow(index);
                          applyActiveColorAtCaret(index);
                          // Detectar si el cursor está en texto en negrita
                          const isBold = document.queryCommandState('bold');
                          const newBoldStates = [...boldStates];
                          newBoldStates[index] = isBold;
                          setBoldStates(newBoldStates);
                          const isUnderline = document.queryCommandState('underline');
                          const newUnderlineStatesK = [...underlineStates];
                          newUnderlineStatesK[index] = isUnderline;
                          setUnderlineStates(newUnderlineStatesK);
                        }}
                        onMouseUp={() => {
                          saveSelectionForRow(index);
                          applyActiveColorAtCaret(index);
                          // Detectar si la selección está en texto en negrita
                          const isBold = document.queryCommandState('bold');
                          const newBoldStates = [...boldStates];
                          newBoldStates[index] = isBold;
                          setBoldStates(newBoldStates);
                          const isUnderline = document.queryCommandState('underline');
                          const newUnderlineStatesM = [...underlineStates];
                          newUnderlineStatesM[index] = isUnderline;
                          setUnderlineStates(newUnderlineStatesM);
                        }}
                        onClick={() => {
                          saveSelectionForRow(index);
                          applyActiveColorAtCaret(index);
                          // Detectar si el click está en texto en negrita
                          const isBold = document.queryCommandState('bold');
                          const newBoldStates = [...boldStates];
                          newBoldStates[index] = isBold;
                          setBoldStates(newBoldStates);
                          const isUnderline = document.queryCommandState('underline');
                          const newUnderlineStatesC = [...underlineStates];
                          newUnderlineStatesC[index] = isUnderline;
                          setUnderlineStates(newUnderlineStatesC);
                        }}
                        onFocus={() => {
                          saveSelectionForRow(index);
                          applyActiveColorAtCaret(index);
                        }}
                        className="w-full rounded-md min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        style={{
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          overflow: 'hidden',
                          textAlign: 'left',
                          fontSize: '13px',
                          lineHeight: 1.35,
                          padding: '6px 8px 6px 15px',
                          boxSizing: 'border-box',
                          display: 'block',
                          boxShadow: 'inset 0 0 0 1px #d1d5db'
                        }}
                      />
                      
                      {/* Mostrar imágenes existentes */}
                      {fila.imagenes && fila.imagenes.length > 0 && (
                        <>
                          {/* Botones de posición de imagen */}
                          <div className="flex flex-col gap-2 mt-2 mb-2">
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const nuevasFilas = [...filas];
                                  nuevasFilas[index].posicion_imagen = 'abajo';
                                  setFilas(nuevasFilas);
                                }}
                                className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                  fila.posicion_imagen === 'abajo' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                title="Imagen debajo del texto"
                              >
                                <i className="fas fa-arrow-down"></i>
                                Debajo
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nuevasFilas = [...filas];
                                  nuevasFilas[index].posicion_imagen = 'derecha';
                                  setFilas(nuevasFilas);
                                }}
                                className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                  fila.posicion_imagen === 'derecha' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                title="Imagen a la derecha del texto"
                              >
                                <i className="fas fa-arrow-right"></i>
                                Derecha
                              </button>
                            </div>
                            
                            {/* Botones de alineación (solo visible cuando posicion es 'abajo') */}
                            {fila.posicion_imagen === 'abajo' && (
                              <div className="flex gap-2 justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nuevasFilas = [...filas];
                                    nuevasFilas[index].alineacion_imagenes = 'horizontal';
                                    setFilas(nuevasFilas);
                                  }}
                                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                    fila.alineacion_imagenes === 'horizontal' 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  title="Alinear horizontalmente"
                                >
                                  <i className="fas fa-arrows-alt-h"></i>
                                  Horizontal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nuevasFilas = [...filas];
                                    nuevasFilas[index].alineacion_imagenes = 'vertical';
                                    setFilas(nuevasFilas);
                                  }}
                                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                                    fila.alineacion_imagenes === 'vertical' 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  title="Alinear verticalmente"
                                >
                                  <i className="fas fa-arrows-alt-v"></i>
                                  Vertical
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Contenedor de imágenes con alineación dinámica */}
                          <div className={`flex ${fila.alineacion_imagenes === 'horizontal' ? 'flex-row flex-wrap' : 'flex-col'} gap-2 mt-2`}>
                            {fila.imagenes.map((img, imgIndex) => (
                              <div key={imgIndex} className="flex flex-col items-center bg-gray-50 p-2 rounded border border-gray-200">
                                <img 
                                  src={img.imagen} 
                                  alt={`Imagen ${imgIndex + 1}`} 
                                  className="w-20 h-20 object-cover rounded mb-2"
                                />
                                <span className="text-xs text-gray-600 mb-2">Img {imgIndex + 1}</span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => showImageAdjustModal(index, imgIndex)}
                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs"
                                    title="Ajustar tamaño"
                                  >
                                    <i className="fas fa-crop"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarImagen(index, imgIndex)}
                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                                    title="Eliminar imagen"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Área para agregar más imágenes */}
                      <div className="space-y-2 mt-2">
                        {/* Botón para subir desde archivo */}
                        <div className="flex justify-center">
                          <label className={`cursor-pointer px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                            uploadingImages[index] 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}>
                            {uploadingImages[index] ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-upload"></i>
                                {fila.imagenes && fila.imagenes.length > 0 ? 'Agregar más imágenes' : 'Subir desde archivo'}
                              </>
                            )}
                            <input
                              type="file"
                              id={`file-upload-${index}`}
                              accept="image/*"
                              disabled={uploadingImages[index]}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  uploadFileToRow(index, file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                        
                        {/* Área de drag & drop y pegar */}
                        <div
                          className={`border-2 border-dashed rounded-md p-3 text-center text-sm cursor-pointer select-none focus:outline-none ${
                            uploadingImages[index] 
                              ? 'border-gray-400 bg-gray-100 text-gray-500 cursor-not-allowed' 
                              : dragOverIndex === index 
                                ? 'border-blue-400 bg-blue-50 text-blue-700' 
                                : 'border-gray-300 text-gray-600'
                          } ${focusedDropIndex === index ? 'ring-2 ring-blue-400 border-blue-400' : ''}`}
                          onDragOver={(e) => !uploadingImages[index] && handleDragOverRow(index, e)}
                          onDragEnter={(e) => !uploadingImages[index] && handleDragEnterRow(index, e)}
                          onDragLeave={(e) => !uploadingImages[index] && handleDragLeaveRow(index, e)}
                          onDrop={(e) => !uploadingImages[index] && handleDropImage(index, e)}
                          onPaste={(e) => !uploadingImages[index] && handlePasteImage(index, e)}
                          tabIndex={uploadingImages[index] ? -1 : 0}
                          onFocus={() => !uploadingImages[index] && setFocusedDropIndex(index)}
                          onBlur={() => !uploadingImages[index] && setFocusedDropIndex(prev => (prev === index ? null : prev))}
                          title={uploadingImages[index] ? "Subiendo imagen..." : "Pegue (Ctrl+V) o arrastre su imagen aquí"}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {uploadingImages[index] ? (
                              <>
                                <i className="fas fa-spinner fa-spin text-lg"></i>
                                <span>Subiendo imagen...</span>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-image text-lg"></i>
                                <span>Pegue (Ctrl+V) o arrastre su imagen aquí</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Mensaje de ayuda */}
                        <div className="text-xs text-gray-500 text-center mt-1">
                          Formatos soportados: JPG, PNG, GIF, WEBP • Máximo 10MB
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 align-top">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fila.valor_unitario}
                        onChange={(e) => handleValorUnitarioChange(index, e.target.value)}
                        onBlur={() => normalizarValorUnitarioFila(index)}
                        className="w-full border border-gray-300 rounded-md p-2 text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right align-top whitespace-nowrap">
                      ${formatearNumero(fila.valor_total)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center align-top">
                      <button
                        onClick={() => eliminarFila(index)}
                        className="text-red-600 hover:text-red-900 text-lg"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pie de página */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Tiempo de Entrega:</label>
              <input
                type="text"
                value={TxttiempoEntrega}
                onChange={(e) => setTxtTiempoEntrega(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md p-2"
                placeholder="Ej: 5 días hábiles"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Forma de Pago:</label>
              <input
                type="text"
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md p-2"
                placeholder="Ej: 50% anticipo, 50% contra entrega"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Validez de Proforma:</label>
              <input
                type="text"
                value={validezProforma}
                onChange={(e) => setValidezProforma(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md p-2"
                placeholder="Ej: 15 días"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Observaciones:</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md p-2 h-32"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="desactivar-totales"
                  checked={!mostrarTotales}
                  onChange={(e) => setMostrarTotales(!e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="desactivar-totales" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Desactivar Totales
                </label>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Subtotal:</span>
              <span className="text-lg font-semibold">{mostrarTotales ? `$${formatearNumero(subtotal)}` : ''}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aplicar-iva"
                  checked={aplicarIva}
                  onChange={(e) => setAplicarIva(e.target.checked)}
                  disabled={!mostrarTotales}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="aplicar-iva" className="text-sm font-medium text-gray-700 cursor-pointer">
                  IVA 15%:
                </label>
              </div>
              <span className="text-lg font-semibold">{mostrarTotales ? `$${formatearNumero(iva)}` : ''}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Descuento:</span>
              <input
                type="number"
                value={mostrarTotales ? descuento : ''}
                onChange={(e) => setDescuento(e.target.value)}
                disabled={!mostrarTotales}
                className="w-32 border border-gray-300 rounded-md p-2 text-right"
              />
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-gray-900">{mostrarTotales ? `$${formatearNumero(total)}` : ''}</span>
            </div>
          </div>
        </div>


        {/* Modal de vista previa */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Vista Previa del PDF</h2>
                <button
                  onClick={cerrarVistaPrevia}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <p>No se puede mostrar el PDF. Por favor, intente nuevamente.</p>
                </object>
              </div>
            </div>
          </div>
        )}

        {/* Modal para ajustar dimensiones de imagen */}
        {selectedImageIndices.row !== null && selectedImageIndices.img !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Ajustar tamaño de imagen</h3>
              
              {/* Preview de la imagen */}
              <div className="mb-4 bg-gray-100 rounded-lg p-4 flex justify-center items-center" style={{ minHeight: '200px' }}>
                <Resizable
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  minConstraints={[100, 75]}
                  maxConstraints={[600, 400]}
                  resizeHandles={['se']}
                  onResize={handleResizeImagePreview}
                >
                  <div
                    style={{
                      width: `${imageDimensions.width}px`,
                      height: `${imageDimensions.height}px`,
                      border: '2px dashed #3B82F6',
                      backgroundColor: '#ffffff'
                    }}
                    className="overflow-hidden"
                  >
                    <img
                      src={filas[selectedImageIndices.row]?.imagenes[selectedImageIndices.img]?.imagen}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                </Resizable>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    <i className="fas fa-info-circle mr-2"></i>
                    Arrastre la esquina inferior derecha para ajustar el tamaño. Se aplicará en el PDF. Rango: 100x75px a 600x400px
                  </p>
                </div>
                
                {/* Controles de tamaño en dos columnas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ancho (px)</label>
                    <input
                      type="number"
                      min="100"
                      max="600"
                      value={imageDimensions.width}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10) || 100;
                        setImageDimensions(prev => clampImageDimensions(value, prev.height));
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rango: 100 - 600 px</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alto (px)</label>
                    <input
                      type="number"
                      min="75"
                      max="400"
                      value={imageDimensions.height}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10) || 75;
                        setImageDimensions(prev => clampImageDimensions(prev.width, value));
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Rango: 75 - 400 px</p>
                  </div>
                </div>

                {/* Botones de tamaños predefinidos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tamaños predefinidos</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setImageDimensions(clampImageDimensions(200, 150))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      Pequeño<br/>(200x150)
                    </button>
                    <button
                      onClick={() => setImageDimensions(clampImageDimensions(300, 200))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      Mediano<br/>(300x200)
                    </button>
                    <button
                      onClick={() => setImageDimensions(clampImageDimensions(400, 300))}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      Grande<br/>(400x300)
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <button
                    onClick={() => setSelectedImageIndices({ row: null, img: null })}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => applyImageDimensions({ openPreview: true, closeModal: false })}
                    disabled={previewLoading}
                    className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
                      previewLoading
                        ? 'bg-blue-300 text-white cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <FaEye />
                    {previewLoading ? 'Generando...' : 'Aplicar y vista previa PDF'}
                  </button>
                  <button
                    onClick={applyImageDimensions}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-check"></i>
                    Aplicar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación - Cliente no encontrado */}
        {showConfirmacionClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 rounded-full p-3 mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">Cliente no encontrado</h3>
              </div>
              <p className="mb-4 text-gray-700">
                La empresa <span className="font-semibold">"{nuevoClienteDatos.empresa}"</span> no existe en la base de datos.
              </p>
              <p className="mb-6 text-gray-700">
                ¿Desea crear este cliente?      </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowConfirmacionClienteModal(false);
                    setIsSaving(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmacionClienteModal(false);
                    setShowNuevoClienteModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sí, crear cliente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para crear nuevo cliente */}
        {showNuevoClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onKeyDown={handleNuevoClienteKeyDown}
              tabIndex={0}
            >
              <h3 className="text-xl font-bold mb-2">Crear Nuevo Cliente</h3>
              <p className="text-sm text-gray-600 mb-4">Complete los datos del cliente para poder continuar con la cotización</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.empresa}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, empresa: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Empresa XYZ S.A."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Contacto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.nombre}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC/Cédula
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.ruc_cedula}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, ruc_cedula: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 1234567890001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.direccion}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Av. Principal 123 y Calle Secundaria"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.telefono}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 0987654321"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={nuevoClienteDatos.email}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: cliente@email.com"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowNuevoClienteModal(false);
                    setIsSaving(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Validar solo empresa y nombre como obligatorios
                    if (!nuevoClienteDatos.nombre || !nuevoClienteDatos.empresa) {
                      alert('Por favor complete los campos obligatorios: Empresa y Nombre del Contacto.');
                      return;
                    }
                    // Guardar cliente en la BBDD
                    try {
                      const token = localStorage.getItem("token");
                      const crearClienteResponse = await fetch(`${apiUrl}/api/clientes`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          nombre: nuevoClienteDatos.nombre,
                          empresa: nuevoClienteDatos.empresa,
                          ruc_cedula: nuevoClienteDatos.ruc_cedula,
                          direccion: nuevoClienteDatos.direccion,
                          telefono: nuevoClienteDatos.telefono,
                          email: nuevoClienteDatos.email,
                          estado: 'activo',
                          notas: `Cliente creado desde cotización el ${new Date().toLocaleDateString()}`
                        })
                      });
                      
                      if (!crearClienteResponse.ok) {
                        const errorData = await crearClienteResponse.json();
                        throw new Error(errorData.details || errorData.error || "Error al crear cliente");
                      }
                      
                      const clienteCreado = await crearClienteResponse.json();
                      console.log('✅ Cliente creado:', clienteCreado);
                      
                      // Actualizar el campo Cliente con la empresa y Contacto con el nombre
                      setNombreCliente(nuevoClienteDatos.empresa);
                      setContacto(nuevoClienteDatos.nombre);
                      setUsarContacto(true);
                      setShowNuevoClienteModal(false);
                      
                      // Continuar con el guardado de la cotización
                      if (onNuevoClienteConfirm) {
                        await onNuevoClienteConfirm(clienteCreado.cliente.id);
                      }
                    } catch (error) {
                      console.error('Error al crear cliente:', error);
                      alert('Error al guardar el cliente: ' + error.message);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <FaSave />
                  Guardar y Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-6 right-6 z-40 flex flex-row flex-wrap justify-end gap-3 max-w-[calc(100vw-3rem)]">
          <button
            type="button"
            onClick={() => generarVistaPrevia()}
            disabled={previewLoading}
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-full shadow-xl transition-all duration-200 flex items-center gap-2"
            title="Abrir vista previa del PDF"
          >
            <FaEye />
            <span className="hidden sm:inline">{previewLoading ? 'Generando...' : 'Vista Previa PDF'}</span>
          </button>

          {id && (
            <button
              type="button"
              onClick={handleGuardarComoNueva}
              disabled={isSaving}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-full shadow-xl transition-all duration-200 flex items-center gap-2"
              title="Guardar esta cotización como nueva"
            >
              <FaSave />
              <span className="hidden sm:inline">Guardar como Nueva</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGuardarTodo}
            disabled={isSaving}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-full shadow-xl transition-all duration-200 flex items-center gap-2"
            title={id ? 'Actualizar cotización' : 'Guardar cotización'}
          >
            <FaSave />
            <span className="hidden sm:inline">{id ? 'Actualizar Cotización' : 'Guardar Cotización'}</span>
          </button>

          <button
            type="button"
            onClick={agregarFila}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full shadow-xl transition-all duration-200 flex items-center gap-2"
            title="Agregar producto en cualquier momento"
          >
            <i className="fas fa-plus"></i>
            <span className="hidden sm:inline">Agregar Producto</span>
          </button>
        </div>

        {/* Modal de Clientes */}
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
                          cliente.empresa?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
                          cliente.email_cliente?.toLowerCase().includes(busquedaCliente.toLowerCase())
                        )
                        .map((cliente) => (
                          <tr key={cliente.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border-b">{cliente.nombre_cliente || cliente.nombre}</td>
                            <td className="px-4 py-2 border-b">{cliente.empresa || cliente.empresa_cliente}</td>
                            <td className="px-4 py-2 border-b">{cliente.email_cliente || cliente.email}</td>
                            <td className="px-4 py-2 border-b">{cliente.telefono || '-'}</td>
                            <td className="px-4 py-2 border-b text-center">
                              <button
                                onClick={() => {
                                  // Seleccionar la empresa en el campo Cliente
                                  setNombreCliente(cliente.empresa || cliente.empresa_cliente || cliente.nombre_cliente);
                                  // Poner el nombre del contacto en el campo Contacto
                                  if (cliente.nombre_cliente || cliente.nombre) {
                                    setContacto(cliente.nombre_cliente || cliente.nombre);
                                    setUsarContacto(true);
                                  }
                                  setSelectedClienteId(cliente.id);
                                  setShowClientesModal(false);
                                  setBusquedaCliente("");
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

        {/* Modal de Procesos de Producción */}
        {showProcesosModal && filaEditandoProcesos !== null && (
          <ItemEditorModal
            item={filas[filaEditandoProcesos] ? {
              tipo_trabajo: filas[filaEditandoProcesos].tipo_trabajo || '',
              descripcion: filas[filaEditandoProcesos].descripcion_trabajo || '',
              cantidad: filas[filaEditandoProcesos].cantidad || 1,
              tamano_cerrado: filas[filaEditandoProcesos].tamano_cerrado || '',
              tamano_abierto: filas[filaEditandoProcesos].tamano_abierto || '',
              precio_unitario: filas[filaEditandoProcesos].valor_unitario || 0,
              total: filas[filaEditandoProcesos].valor_total || 0,
              procesos: filas[filaEditandoProcesos].procesos || []
            } : null}
            onClose={() => {
              setShowProcesosModal(false);
              setFilaEditandoProcesos(null);
            }}
            onSave={guardarDatosItemProcesos}
          />
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-lg p-8 flex flex-col items-center"
              ref={successModalRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                  setNumeroCotizacionGuardada('');
                  // Siempre ir a cotizaciones después de guardar
                  navigate("/cotizaciones");
                }
              }}
              tabIndex={0}
            >
              <svg className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-semibold text-lg">{successMessage}</span>
              {numeroCotizacionGuardada && (
                <span className="text-gray-700 mt-2">N° Cotización: <b>{numeroCotizacionGuardada}</b></span>
              )}
              <button
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                  setNumeroCotizacionGuardada('');
                  // Siempre ir a cotizaciones después de guardar
                  navigate("/cotizaciones");
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CotizacionesCrear;