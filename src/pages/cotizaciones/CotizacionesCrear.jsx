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
import { usePermisos } from '../../hooks/usePermisos';

function CotizacionesCrear() {
  const { id } = useParams();
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { puedeCrear, puedeEditar, verificarYMostrarError } = usePermisos();
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 300, height: 200 });
  const [imageFitMode, setImageFitMode] = useState('contain'); // 'contain', 'cover', 'fill'
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
  const [nombreEjecutivo, setNombreEjecutivo] = useState(localStorage.getItem('nombre') || '');
  const [clienteIndex, setClienteIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [focusedDropIndex, setFocusedDropIndex] = useState(null);
  const [uploadingImages, setUploadingImages] = useState({}); // Controla el loading de cada imagen
  const [usarContacto, setUsarContacto] = useState(false);
  const [contacto, setContacto] = useState("");
  const [usarCeluar, setUsarCeluar] = useState(false);
  const [celuar, setCeluar] = useState("");
  const [aplicarIva, setAplicarIva] = useState(true); // Checkbox para IVA, marcado por defecto
  const [formatoNegritaActivo, setFormatoNegritaActivo] = useState({}); // Estado para el formato de negrita por fila
  
  // Estados para modales de confirmación
  const [showConfirmGuardar, setShowConfirmGuardar] = useState(false);
  const [showConfirmActualizar, setShowConfirmActualizar] = useState(false);
  const [showConfirmGuardarComoNueva, setShowConfirmGuardarComoNueva] = useState(false);
  
  // Estados para el modal de clientes
  const [showClientesModal, setShowClientesModal] = useState(false);
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Estados para el modal de procesos
  const [showProcesosModal, setShowProcesosModal] = useState(false);
  const [filaEditandoProcesos, setFilaEditandoProcesos] = useState(null);

  // Ref para el modal de éxito
  const successModalRef = useRef(null);

  useEffect(() => {
    if (showSuccessModal && successModalRef.current) {
      successModalRef.current.focus();
    }
  }, [showSuccessModal]);

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
      setTxtTiempoEntrega(cotizacionData.tiempo_entrega || "5 días hábiles");
      setFormaPago(cotizacionData.forma_pago || "50% anticipo, 50% contra entrega");
      setValidezProforma(cotizacionData.validez_proforma || "15 días");
      setObservaciones(cotizacionData.observaciones || "");
      setContacto(cotizacionData.contacto || "");
      setUsarContacto(!!cotizacionData.contacto);
      setCeluar(cotizacionData.celuar || "");
      setUsarCeluar(!!cotizacionData.celuar);
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

      // Establecer el nombre y el id del cliente
      if (cotizacionData.nombre_cliente && cotizacionData.cliente_id) {
        setNombreCliente(cotizacionData.nombre_cliente);
        setSelectedClienteId(cotizacionData.cliente_id);
      }

      // Establecer los detalles de la cotización y calcular totales
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
                width: img.imagen_width || 200,
                height: img.imagen_height || 150,
                id: img.id
              }))
            : [];

          console.log('Imágenes cargadas para detalle:', detalle.detalle, imagenes);

          return {
            cantidad,
            detalle: detalle.detalle || "",
            valor_unitario: valorUnitario,
            valor_total: valorTotal,
            imagenes: imagenes,
            alineacion_imagenes: detalle.alineacion_imagenes || 'horizontal'
          };
        });

        console.log("Filas actualizadas:", filasActualizadas);
        setFilas(filasActualizadas);

        // Calcular totales basados en los detalles
        const subtotalCalculado = filasActualizadas.reduce((sum, fila) => sum + fila.valor_total, 0);
        const ivaCalculado = subtotalCalculado * 0.12;
        const totalCalculado = subtotalCalculado + ivaCalculado;

        setSubtotal(subtotalCalculado);
        setIva(ivaCalculado);
        setTotal(totalCalculado);
      } else {
        // Si no hay detalles, usar los valores de la cotización
        setSubtotal(parseFloat(cotizacionData.subtotal) || 0);
        setIva(parseFloat(cotizacionData.iva) || 0);
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
    setNombreCliente(cliente.nombre_cliente);
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
      // Validar permisos según si es nueva o actualización
      if (!id) {
        // Es nueva cotización, verificar permiso de crear
        if (!verificarYMostrarError('cotizaciones', 'crear', 'crear esta cotización')) {
          setIsSaving(false);
          return;
        }
      } else {
        // Es actualización, verificar permiso de editar
        if (!verificarYMostrarError('cotizaciones', 'editar', 'actualizar esta cotización')) {
          setIsSaving(false);
          return;
        }
      }
      
      // Validaciones iniciales
      if (!selectedRuc || !selectedRuc.id) {
        alert("Por favor seleccione un RUC para proceder");
        setIsSaving(false);
        return;
      }
      if (!nombreCliente) {
        alert("Por favor ingrese el nombre del cliente");
        setIsSaving(false);
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
          `${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(nombreCliente)}`
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
      } catch (searchError) {
        console.warn("Error al buscar cliente, se procederá a crear uno nuevo:", searchError);
      }
      
      // Si no se encontró el cliente o hubo error en la búsqueda, mostrar modal para crear nuevo
      setNuevoClienteDatos({ nombre: nombreCliente, empresa: '', direccion: '', telefono: '', email: '', ruc_cedula: '' });
      setShowNuevoClienteModal(true);
      setOnNuevoClienteConfirm(() => async (nuevoClienteId) => {
        setSelectedClienteId(nuevoClienteId);
        await continuarGuardadoCotizacion(nuevoClienteId);
      });
      return; // Detener flujo hasta que se confirme el modal
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
        imagenes: (fila.imagenes && Array.isArray(fila.imagenes)) 
          ? fila.imagenes.map(img => ({
              imagen_ruta: img.imagen_ruta,
              imagen_width: img.width || 200,
              imagen_height: img.height || 150
            }))
          : []
      }));

      // 3. Preparar los datos de la cotización
      const cotizacionData = {
        fecha: fecha || new Date().toISOString().split('T')[0],
        subtotal: parseFloat(subtotal) || 0,
        iva: parseFloat(iva) || 0,
        descuento: parseFloat(descuento) || 0,
        total: parseFloat(total) || 0,
        ruc_id: selectedRuc?.id || null,
        cliente_id: clienteId || null,
        tiempo_entrega: TxttiempoEntrega || "5 días hábiles",
        forma_pago: formaPago || "50% anticipo, 50% contra entrega",
        validez_proforma: validezProforma || "15 días",
        observaciones: observaciones || "",
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
          imagenes: fila.imagenes
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
      // El error 403 ya es manejado por el interceptor de axios y el modal global
      // Solo mostramos alert para otros errores
      if (error.message && !error.message.includes('403') && !error.message.includes('Permiso denegado')) {
        alert("Error al procesar la cotización: " + error.message);
      }
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
      // Validar permiso de crear antes de continuar
      if (!verificarYMostrarError('cotizaciones', 'crear', 'crear esta cotización')) {
        setIsSaving(false);
        return;
      }
      
      // Validaciones iniciales
      if (!selectedRuc.id) {
        alert("Selecciona un RUC para la cotización");
        setIsSaving(false);
        return;
      }
      if (!nombreCliente.trim()) {
        alert("El nombre del cliente es requerido");
        setIsSaving(false);
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
          `${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(nombreCliente)}`
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
      } catch (searchError) {
        console.warn("Error al buscar cliente, se procederá a crear uno nuevo:", searchError);
      }
      
      // Si no se encontró el cliente o hubo error en la búsqueda, mostrar modal para crear nuevo
      setNuevoClienteDatos({ nombre: nombreCliente, empresa: '', direccion: '', telefono: '', email: '', ruc_cedula: '' });
      setShowNuevoClienteModal(true);
      setOnNuevoClienteConfirm(() => async (nuevoClienteId) => {
        setSelectedClienteId(nuevoClienteId);
        await guardarCotizacionComoNueva(nuevoClienteId);
      });
      return; // Detener flujo hasta que se confirme el modal
    } catch (error) {
      console.error("Error al guardar la nueva cotización:", error);
      // El error 403 ya es manejado por el interceptor de axios y el modal global
      if (error.message && !error.message.includes('403') && !error.message.includes('Permiso denegado')) {
        alert("Error al guardar la nueva cotización: " + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Nota: El número de cotización se asignará automáticamente por la base de datos al guardar

  // Función para agregar una nueva fila
  const agregarFila = () => {
    setFilas([
      ...filas,
      {
        cantidad: 1,
        detalle: "",
        valor_unitario: 0,
        valor_total: 0,
        imagenes: [],  // Array vacío para múltiples imágenes
        alineacion_imagenes: 'horizontal'  // Alineación por defecto
      }
    ]);
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
        valor_unitario: itemData.precio_unitario,
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
        const width = imagenesActuales.length > 0 ? imagenesActuales[0].width : 200;
        const height = imagenesActuales.length > 0 ? imagenesActuales[0].height : 150;
        
        nuevasFilas[index] = {
          ...nuevasFilas[index],
          imagenes: [
            ...imagenesActuales,
            {
              imagen: `${apiUrl}${data.imagenRuta}`,
              imagen_ruta: data.imagenRuta,
              imagen_ruta_jpeg: data.imagenRutaJpeg,
              width: width,
              height: height,
              thumbnail: data.thumbnail,
              metadata: data.metadata
            }
          ]
        };
        setFilas(nuevasFilas);

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
    if (numero === null || numero === undefined || numero === '') return "0";
    const n = Number(numero);
    if (isNaN(n)) return "0";
    // Mostrar hasta 6 decimales sin forzar 2 decimales
    return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
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

  // Efecto para ajustar la altura de los textareas al cargar o actualizar las filas
  useEffect(() => {
    textareaRefs.current.forEach((textarea) => {
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
      }
    });
  }, [filas]);

  // Función para generar la vista previa
  const generarVistaPrevia = async () => {
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
        subtotal: subtotal,
        iva: iva,
        descuento: descuento,
        total: total,
        tiempo_entrega: TxttiempoEntrega,
        forma_pago: formaPago,
        validez_proforma: validezProforma,
        observaciones: observaciones,
        nombre_ejecutivo: nombreEjecutivo
      };

      const detallesTemp = filas.map(fila => ({
        cantidad: fila.cantidad,
        detalle: fila.detalle,
        valor_unitario: fila.valor_unitario,
        valor_total: fila.valor_total,
        alineacion_imagenes: fila.alineacion_imagenes || 'horizontal',
        imagenes: (fila.imagenes && Array.isArray(fila.imagenes)) 
          ? fila.imagenes.map(img => ({
              imagen_ruta: img.imagen_ruta,
              orden: 0,
              imagen_width: img.width || 200,
              imagen_height: img.height || 150
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

  const showImageAdjustModal = (rowIndex, imgIndex) => {
    setSelectedImageIndices({ row: rowIndex, img: imgIndex });
    const imagen = filas[rowIndex].imagenes[imgIndex];
    setImageDimensions({
      width: imagen.width || 200,
      height: imagen.height || 150
    });
    setImageFitMode('contain'); // Siempre contain para PDF
  };

  // Función para aplicar los cambios de dimensiones
  const applyImageDimensions = () => {
    if (selectedImageIndices.row !== null && selectedImageIndices.img !== null) {
      // Aplicar las mismas restricciones
      const minWidth = 100;
      const minHeight = 75;
      const maxWidth = 600;
      const maxHeight = 400;
      
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, imageDimensions.width));
      const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, imageDimensions.height));
      
      const newFilas = [...filas];
      const imagenesActuales = [...newFilas[selectedImageIndices.row].imagenes];
      imagenesActuales[selectedImageIndices.img] = {
        ...imagenesActuales[selectedImageIndices.img],
        width: constrainedWidth,
        height: constrainedHeight
      };
      newFilas[selectedImageIndices.row] = {
        ...newFilas[selectedImageIndices.row],
        imagenes: imagenesActuales
      };
      setFilas(newFilas);
      setSelectedImageIndices({ row: null, img: null });
    }
  };

  // Función para toggle del formato negrita
  const toggleNegrita = (index) => {
    setFormatoNegritaActivo(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Función para aplicar formato al texto seleccionado en contentEditable
  const aplicarFormatoASeleccion = (index) => {
    const editor = textareaRefs.current[index];
    if (!editor) {
      console.log('Editor no encontrado');
      return;
    }

    // Forzar el foco en el editor
    editor.focus();

    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
      console.log('No hay texto seleccionado');
      alert('Por favor, selecciona el texto que deseas poner en negrita');
      return;
    }

    try {
      // Guardar la selección actual
      const range = selection.getRangeAt(0);
      
      // Verificar si la selección está dentro del editor
      if (!editor.contains(range.commonAncestorContainer)) {
        console.log('La selección no está dentro del editor');
        return;
      }

      // Aplicar el formato bold
      const success = document.execCommand('bold', false, null);
      console.log('execCommand bold resultado:', success);

      // Pequeño delay para asegurar que el DOM se actualice
      setTimeout(() => {
        // Actualizar el estado con el nuevo contenido
        const nuevasFilas = [...filas];
        nuevasFilas[index].detalle = editor.innerHTML;
        setFilas(nuevasFilas);
        console.log('Contenido actualizado:', editor.innerHTML);
        
        // Restaurar el foco
        editor.focus();
      }, 10);
      
    } catch (error) {
      console.error('Error al aplicar formato:', error);
      alert('Hubo un error al aplicar el formato. Por favor intenta nuevamente.');
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
        imagenes: (fila.imagenes && Array.isArray(fila.imagenes)) 
          ? fila.imagenes.map(img => ({
              imagen_ruta: img.imagen_ruta,
              imagen_width: img.width || 200,
              imagen_height: img.height || 150
            }))
          : []
      }));

      // 3. Crear la nueva cotización con todas las relaciones
      const cotizacionData = {
        fecha: fecha || new Date().toISOString().split('T')[0],
        subtotal: parseFloat(subtotal) || 0,
        iva: parseFloat(iva) || 0,
        descuento: parseFloat(descuento) || 0,
        total: parseFloat(total) || 0,
        ruc_id: selectedRuc?.id || null,
        cliente_id: clienteId || null,
        // numero_cotizacion se asignará automáticamente por la base de datos
        tiempo_entrega: TxttiempoEntrega || "5 días hábiles",
        forma_pago: formaPago || "50% anticipo, 50% contra entrega",
        validez_proforma: validezProforma || "15 días",
        observaciones: observaciones || "",
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
      for (const fila of filasData) {
        const detalleData = {
          cotizacion_id: nuevaCotizacion.id,
          cantidad: fila.cantidad,
          detalle: fila.detalle,
          valor_unitario: fila.valor_unitario,
          valor_total: fila.valor_total,
          imagen_ruta: fila.imagen_ruta,
          imagen_width: fila.imagen_width,
          imagen_height: fila.imagen_height
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
          throw new Error("Error al guardar los detalles de la nueva cotización");
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
      // Validar campos mínimos
      if (!nuevoClienteDatos.empresa || !nuevoClienteDatos.direccion || !nuevoClienteDatos.telefono || !nuevoClienteDatos.email || !nuevoClienteDatos.ruc_cedula) {
        alert('Por favor complete todos los campos requeridos.');
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
            direccion: nuevoClienteDatos.direccion,
            telefono: nuevoClienteDatos.telefono,
            email: nuevoClienteDatos.email,
            ruc_cedula: nuevoClienteDatos.ruc_cedula
          })
        });
        if (!crearClienteResponse.ok) {
          const errorData = await crearClienteResponse.json();
          throw new Error(errorData.details || "Error al crear cliente");
        }
        const clienteCreado = await crearClienteResponse.json();
        setShowNuevoClienteModal(false);
        if (onNuevoClienteConfirm) {
          await onNuevoClienteConfirm(clienteCreado.cliente.id);
        }
      } catch (error) {
        alert('Error al guardar el cliente: ' + error.message);
      }
    }
  };

  // Cargar celular del ejecutivo autenticado
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.celular) {
          setCeluar(parsed.celular);
          // Dejar el check desmarcado por defecto, pero mostrar el número
          setUsarCeluar(false);
        }
      }
    } catch (_) {}
  }, []);

  // Sincronizar el contenido de los editores contentEditable cuando cambien las filas
  useEffect(() => {
    filas.forEach((fila, index) => {
      const editor = textareaRefs.current[index];
      if (editor && editor !== document.activeElement) {
        // Solo actualizar si el editor no está siendo editado activamente
        if (editor.innerHTML !== fila.detalle) {
          editor.innerHTML = fila.detalle || '';
        }
      }
    });
  }, [filas]);

  return (
    <div className="container mx-auto px-4 py-8">
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        [contenteditable] strong {
          font-weight: bold;
          color: #000;
        }
      `}</style>
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {id ? "Editar Cotización" : "Nueva Cotización"}
        </h1>
        <div className="flex gap-2">
          {id ? (
            <>
              <button
                onClick={() => setShowConfirmGuardarComoNueva(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <FaSave className="mr-2" /> Guardar como Nueva
              </button>
              <button
                onClick={() => setShowConfirmActualizar(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                disabled={isSaving}
              >
                <FaSave className="mr-2" /> Actualizar Cotizacion
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowConfirmGuardar(true)}
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
                CORPORACION MUNDO GRAFIC MUNDOGRAFIC CIA. LTDA.
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={handleInputChange}
                  onKeyDown={handleClienteKeyDown}
                  placeholder="Ingrese el nombre del cliente..."
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
                      {s.nombre_cliente} {s.email_cliente ? <span className="text-xs text-gray-500 ml-2">({s.email_cliente})</span> : null}
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
                  className={`flex-1 border rounded-md p-2 ${usarContacto ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'border-gray-200 bg-gray-100 cursor-not-allowed'}`}
                />
              </div>
            </div>
            <div className="relative flex flex-col">
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
              <input
                type="text"
                value={nombreEjecutivo}
                onChange={(e) => setNombreEjecutivo(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ejecutivo de cuenta"
              />
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
            onClick={generarVistaPrevia}
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
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Procesos</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24 sm:w-32">Cantidad</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24 sm:w-28">Valor Unitario</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24 sm:w-28">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16 sm:w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, index) => (
                <React.Fragment key={index}>
                  <tr>
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
                    <td className="border border-gray-300 px-4 py-2 align-top">
                      <input
                        type="number"
                        value={fila.cantidad}
                        onChange={(e) => handleCantidadChange(index, e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full border border-gray-300 rounded-md p-2 text-center"
                        min="1"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 align-top">
                      {/* Barra de herramientas de formato */}
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => aplicarFormatoASeleccion(index)}
                          className={`px-2 py-1 rounded border text-sm font-bold flex items-center gap-1 transition-colors ${
                            formatoNegritaActivo[index] 
                              ? 'bg-blue-500 text-white border-blue-600' 
                              : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                          }`}
                          title="Negrita: Selecciona texto y haz clic para aplicar/quitar formato"
                        >
                          <i className="fas fa-bold"></i>
                        </button>
                        <span className="text-xs text-gray-500">
                          Selecciona texto y haz clic en <i className="fas fa-bold text-xs"></i> para formato negrita
                        </span>
                      </div>
                      
                      <div
                        ref={(el) => {
                          textareaRefs.current[index] = el;
                          // Actualizar el contenido si el HTML cambió desde el estado
                          if (el && el.innerHTML !== fila.detalle) {
                            // Solo actualizar si realmente es diferente y no estamos editando
                            const isEditing = el === document.activeElement;
                            if (!isEditing) {
                              el.innerHTML = fila.detalle || '';
                            }
                          }
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const nuevasFilas = [...filas];
                          nuevasFilas[index].detalle = e.currentTarget.innerHTML;
                          setFilas(nuevasFilas);
                        }}
                        onBlur={(e) => {
                          // Guardar el contenido al perder el foco
                          const nuevasFilas = [...filas];
                          nuevasFilas[index].detalle = e.currentTarget.innerHTML;
                          setFilas(nuevasFilas);
                        }}
                        onKeyDown={(e) => {
                          // Ctrl+B para aplicar negrita con teclado
                          if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                            e.preventDefault();
                            aplicarFormatoASeleccion(index);
                          }
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 min-h-[60px] max-h-[400px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{ whiteSpace: 'pre-wrap' }}
                        data-placeholder="Escribe el detalle aquí. Selecciona texto y usa el botón de negrita para dar formato."
                      />
                      
                      {/* Mostrar imágenes existentes */}
                      {fila.imagenes && fila.imagenes.length > 0 && (
                        <>
                          {/* Botones de alineación */}
                          <div className="flex gap-2 mt-2 mb-2 justify-center">
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
                    <td className="border border-gray-300 px-4 py-2 align-top">
                      <input
                        type="number"
                        value={fila.valor_unitario}
                        onChange={(e) => handleValorUnitarioChange(index, e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="w-32 border border-gray-300 rounded-md p-2 text-right"
                        min="0"
                        step="0.0001"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right align-top">
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
              <span className="text-sm font-medium text-gray-700">Subtotal:</span>
              <span className="text-lg font-semibold">${formatearNumero(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aplicar-iva"
                  checked={aplicarIva}
                  onChange={(e) => setAplicarIva(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="aplicar-iva" className="text-sm font-medium text-gray-700 cursor-pointer">
                  IVA 15%:
                </label>
              </div>
              <span className="text-lg font-semibold">${formatearNumero(iva)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Descuento:</span>
              <input
                type="number"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className="w-32 border border-gray-300 rounded-md p-2 text-right"
              />
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-gray-900">${formatearNumero(total)}</span>
            </div>
          </div>
        </div>


        {/* Modal de vista previa */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                <img 
                  src={filas[selectedImageIndices.row]?.imagenes[selectedImageIndices.img]?.imagen}
                  alt="Preview"
                  style={{
                    width: `${imageDimensions.width}px`,
                    height: `${imageDimensions.height}px`,
                    objectFit: 'contain',
                    border: '2px dashed #3B82F6'
                  }}
                />
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    <i className="fas fa-info-circle mr-2"></i>
                    Este tamaño se aplicará en el PDF. Tamaño mínimo: 100x75px | Tamaño máximo: 600x400px
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
                        const value = parseInt(e.target.value) || 100;
                        setImageDimensions(prev => ({ 
                          ...prev, 
                          width: Math.max(100, Math.min(600, value)) 
                        }));
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
                        const value = parseInt(e.target.value) || 75;
                        setImageDimensions(prev => ({ 
                          ...prev, 
                          height: Math.max(75, Math.min(400, value)) 
                        }));
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
                      onClick={() => setImageDimensions({ width: 200, height: 150 })}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      Pequeño<br/>(200x150)
                    </button>
                    <button
                      onClick={() => setImageDimensions({ width: 300, height: 200 })}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                    >
                      Mediano<br/>(300x200)
                    </button>
                    <button
                      onClick={() => setImageDimensions({ width: 400, height: 300 })}
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

        {/* Modal de confirmación para Guardar Cotización (nueva) */}
        {showConfirmGuardar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Confirmar Guardado</h3>
              <p className="text-gray-700 mb-6">
                ¿Está seguro que desea guardar esta cotización?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmGuardar(false)}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmGuardar(false);
                    handleGuardarTodo();
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Sí, Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para Actualizar Cotización */}
        {showConfirmActualizar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Confirmar Actualización</h3>
              <p className="text-gray-700 mb-6">
                ¿Está seguro que desea actualizar esta cotización?<br/>
                <span className="text-sm text-gray-500">Los cambios se guardarán sobre la cotización actual.</span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmActualizar(false)}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmActualizar(false);
                    handleGuardarTodo();
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Sí, Actualizar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación para Guardar como Nueva */}
        {showConfirmGuardarComoNueva && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-green-600">Confirmar Guardar como Nueva</h3>
              <p className="text-gray-700 mb-6">
                ¿Está seguro que desea guardar esto como una nueva cotización?<br/>
                <span className="text-sm text-gray-500">Se creará una cotización nueva con un código diferente.</span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmGuardarComoNueva(false)}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowConfirmGuardarComoNueva(false);
                    handleGuardarComoNueva();
                  }}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Sí, Guardar como Nueva
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para nuevo cliente */}
        {showNuevoClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onKeyDown={handleNuevoClienteKeyDown}
              tabIndex={0}
            >
              <h3 className="text-xl font-bold mb-4 text-blue-600">Crear Nuevo Cliente</h3>
              <p className="mb-4 text-gray-600">El cliente <span className="font-semibold text-gray-800">{nuevoClienteDatos.nombre}</span> no existe en la base de datos. Complete los datos para crearlo:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.nombre}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del cliente"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.empresa}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, empresa: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC / Cédula <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.ruc_cedula}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, ruc_cedula: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="RUC o Cédula"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.telefono}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Teléfono de contacto"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={nuevoClienteDatos.email}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={nuevoClienteDatos.direccion}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección completa"
                    rows="2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowNuevoClienteModal(false);
                    setIsSaving(false);
                  }}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Validar campos mínimos
                    if (!nuevoClienteDatos.empresa || !nuevoClienteDatos.direccion || !nuevoClienteDatos.telefono || !nuevoClienteDatos.email || !nuevoClienteDatos.ruc_cedula) {
                      alert('Por favor complete todos los campos marcados con * (obligatorios).');
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
                          direccion: nuevoClienteDatos.direccion,
                          telefono: nuevoClienteDatos.telefono,
                          email: nuevoClienteDatos.email,
                          ruc_cedula: nuevoClienteDatos.ruc_cedula
                        })
                      });
                      
                      if (!crearClienteResponse.ok) {
                        const errorData = await crearClienteResponse.json();
                        throw new Error(errorData.details || "Error al crear cliente");
                      }
                      
                      const clienteCreado = await crearClienteResponse.json();
                      setShowNuevoClienteModal(false);
                      
                      // Actualizar el ID del cliente seleccionado
                      setSelectedClienteId(clienteCreado.cliente.id);
                      
                      // Agregar el cliente a las sugerencias
                      setSugerencias(prev => [...prev, {
                        id: clienteCreado.cliente.id,
                        nombre_cliente: clienteCreado.cliente.nombre_cliente,
                        email_cliente: clienteCreado.cliente.email_cliente
                      }]);
                      
                      if (onNuevoClienteConfirm) {
                        await onNuevoClienteConfirm(clienteCreado.cliente.id);
                      }
                    } catch (error) {
                      alert('Error al guardar el cliente: ' + error.message);
                      setIsSaving(false);
                    }
                  }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Guardar Cliente y Continuar
                </button>
              </div>
            </div>
          </div>
        )}

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
                          <tr 
                            key={cliente.id} 
                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => {
                              // Seleccionar el cliente y cerrar el modal
                              // Poner la empresa en el campo Cliente
                              setNombreCliente(cliente.empresa || cliente.nombre_cliente);
                              setSelectedClienteId(cliente.id);
                              
                              // Poner el nombre del contacto en el campo Contacto
                              if (cliente.nombre_cliente && cliente.nombre_cliente !== cliente.empresa) {
                                setContacto(cliente.nombre_cliente);
                                setUsarContacto(true);
                              } else {
                                setContacto("");
                                setUsarContacto(false);
                              }
                              
                              setShowClientesModal(false);
                              setBusquedaCliente("");
                            }}
                          >
                            <td className="px-4 py-2 border-b">{cliente.nombre_cliente}</td>
                            <td className="px-4 py-2 border-b">{cliente.empresa}</td>
                            <td className="px-4 py-2 border-b">{cliente.email_cliente}</td>
                            <td className="px-4 py-2 border-b">{cliente.telefono || '-'}</td>
                            <td className="px-4 py-2 border-b text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar doble click
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm pointer-events-none"
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