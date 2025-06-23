import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Logo from "../../components/Logo";
import axios from 'axios';
import "react-resizable/css/styles.css";
import { Resizable } from "react-resizable";
import Encabezado from "../../components/Encabezado";
import { FaSave, FaEye, FaTimes } from "react-icons/fa";

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
  const [ejecutivo, setEjecutivo] = useState("");
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
  const [numeroCotizacion, setNumeroCotizacion] = useState("Generando...");
  const textareaRefs = useRef([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 300, height: 200 });
  const [sugerenciasEjecutivo, setSugerenciasEjecutivo] = useState([]);
  // Estados para navegación con teclado en sugerencias
  const [clienteIndex, setClienteIndex] = useState(-1);
  const [ejecutivoIndex, setEjecutivoIndex] = useState(-1);
  // Estados para modal de nuevo cliente
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false);
  const [nuevoClienteDatos, setNuevoClienteDatos] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: ''
  });
  const [onNuevoClienteConfirm, setOnNuevoClienteConfirm] = useState(null); // callback para continuar flujo
  // Estado para el id del cliente seleccionado
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  // Estado para prevenir doble guardado
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const cargarCotizacion = async () => {
    try {
      // Cargar datos de la cotización usando la API correcta
      const cotizacionResponse = await fetch(`${apiUrl}/api/cotizacionesEditar/${id}`);
      const cotizacionData = await cotizacionResponse.json();
      console.log("Datos recibidos de la cotización:", cotizacionData);

      // Cargar detalles de la cotización
      const detallesResponse = await fetch(`${apiUrl}/api/cotizacionesDetalles/${id}`);
      const detallesData = await detallesResponse.json();
      console.log("Detalles de la cotización:", detallesData);

      // Actualizar el estado con los datos completos
      setFecha(cotizacionData.fecha ? cotizacionData.fecha.split('T')[0] : today);
      setNumeroCotizacion(cotizacionData.numero_cotizacion || "");
      setTxtTiempoEntrega(cotizacionData.tiempo_entrega || "5 días hábiles");
      setFormaPago(cotizacionData.forma_pago || "50% anticipo, 50% contra entrega");
      setValidezProforma(cotizacionData.validez_proforma || "15 días");
      setObservaciones(cotizacionData.observaciones || "");
      
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

      // Establecer el nombre del cliente
      if (cotizacionData.nombre_cliente) {
        setNombreCliente(cotizacionData.nombre_cliente);
      }

      // Establecer el nombre del ejecutivo
      if (cotizacionData.nombre_ejecutivo) {
        setEjecutivo(cotizacionData.nombre_ejecutivo);
      }

      // Establecer los detalles de la cotización y calcular totales
      if (detallesData && detallesData.length > 0) {
        const filasActualizadas = detallesData.map(detalle => {
          // Asegurarnos de que los valores sean números válidos
          const cantidad = parseFloat(detalle.cantidad) || 0;
          const valorUnitario = parseFloat(detalle.valor_unitario) || 0;
          const valorTotal = parseFloat(detalle.valor_total) || (cantidad * valorUnitario);

          // Construir las URLs de las imágenes
          const imagenRuta = detalle.imagen_ruta || null;
          const imagenUrl = imagenRuta ? `${apiUrl}${imagenRuta}` : null;
          const imagenRutaJpeg = imagenRuta ? imagenRuta.replace('.webp', '.jpeg') : null;

          console.log('Rutas de imagen:', {
            original: imagenRuta,
            url: imagenUrl,
            jpeg: imagenRutaJpeg
          });

          return {
            cantidad,
            detalle: detalle.detalle || "",
            valor_unitario: valorUnitario,
            valor_total: valorTotal,
            imagen: imagenUrl,
            imagen_ruta: imagenRuta,
            imagen_ruta_jpeg: imagenRutaJpeg,
            width: 200,
            height: 150
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
    setClienteIndex(-1);
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
      let url = `${apiUrl}/api/clientes/buscar?q=${encodeURIComponent(nombre)}`;
      if (selectedRuc.id) {
        url += `&ruc_id=${selectedRuc.id}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        setSugerencias([]);
        return;
      }
      const data = await response.json();
      setSugerencias(Array.isArray(data) ? data : []);
    } catch (error) {
      setSugerencias([]);
    }
  };

  const handleSeleccionarCliente = (cliente) => {
    setNombreCliente(cliente.nombre_cliente);
    setSelectedClienteId(cliente.id); // Guardar el id del cliente seleccionado
    setSugerencias([]);
    setClienteIndex(-1);
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

  useEffect(() => {
    if (ejecutivo) {
      console.log("Ejecutivo seleccionado:", ejecutivo);
    }
  }, [ejecutivo]);

  // --- AUTOCOMPLETADO EJECUTIVO ---
  const handleEjecutivoChange = async (event) => {
    const valor = event.target.value;
    setEjecutivo(valor);
    setEjecutivoIndex(-1);
    if (valor.trim() !== "") {
      await buscarEjecutivos(valor);
    } else {
      setSugerenciasEjecutivo([]);
    }
  };

  const handleEjecutivoKeyDown = (e) => {
    if (sugerenciasEjecutivo.length === 0) return;
    if (e.key === 'ArrowDown') {
      setEjecutivoIndex((prev) => (prev < sugerenciasEjecutivo.length - 1 ? prev + 1 : 0));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setEjecutivoIndex((prev) => (prev > 0 ? prev - 1 : sugerenciasEjecutivo.length - 1));
      e.preventDefault();
    } else if (e.key === 'Enter' && ejecutivoIndex >= 0) {
      handleSeleccionarEjecutivo(sugerenciasEjecutivo[ejecutivoIndex]);
      e.preventDefault();
    }
  };

  const buscarEjecutivos = async (nombre) => {
    try {
      const response = await fetch(`${apiUrl}/api/ejecutivos/buscar?nombre=${encodeURIComponent(nombre)}`);
      if (!response.ok) {
        setSugerenciasEjecutivo([]);
        return;
      }
      const data = await response.json();
      setSugerenciasEjecutivo(Array.isArray(data) ? data : []);
    } catch (error) {
      setSugerenciasEjecutivo([]);
    }
  };

  const handleSeleccionarEjecutivo = (ejecutivoObj) => {
    setEjecutivo(ejecutivoObj.nombre);
    setSugerenciasEjecutivo([]);
    setEjecutivoIndex(-1);
  };

  //////////////////////////guardar cotizaciones en la bbdd ////////////////////

  const handleGuardarTodo = async () => {
    if (isSaving) return; // Prevenir doble guardado
    setIsSaving(true);
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
      if (!ejecutivo) {
        alert("Por favor ingrese el nombre del ejecutivo");
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
      // 1. Primero, obtener o crear el ejecutivo
      const ejecutivoResponse = await fetch(`${apiUrl}/api/ejecutivos/obtenerOCrear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: ejecutivo })
      });
      if (!ejecutivoResponse.ok) {
        throw new Error("Error al procesar el ejecutivo");
      }
      const { id: ejecutivo_id } = await ejecutivoResponse.json();
      // 2. Si hay un cliente seleccionado, usar su id directamente
      if (selectedClienteId) {
        await continuarGuardadoCotizacion(selectedClienteId, ejecutivo_id);
        return;
      }
      // Si no hay cliente seleccionado, buscar por nombre
      const buscarClienteResponse = await fetch(
        `${apiUrl}/api/clientes/buscar?nombre=${encodeURIComponent(nombreCliente)}`
      );
      if (!buscarClienteResponse.ok) {
        throw new Error("Error al buscar cliente");
      }
      const clientesEncontrados = await buscarClienteResponse.json();
      let clienteId;
      if (clientesEncontrados.length > 0) {
        // Cliente existente
        clienteId = clientesEncontrados[0].id;
        setSelectedClienteId(clienteId); // Guardar el id para futuras acciones
        await continuarGuardadoCotizacion(clienteId, ejecutivo_id);
        return;
      } else {
        // Mostrar modal para ingresar datos del nuevo cliente
        setNuevoClienteDatos({ nombre: nombreCliente, direccion: '', telefono: '', email: '' });
        setShowNuevoClienteModal(true);
        setOnNuevoClienteConfirm(() => async (nuevoClienteId) => {
          setSelectedClienteId(nuevoClienteId);
          await continuarGuardadoCotizacion(nuevoClienteId, ejecutivo_id);
        });
        return; // Detener flujo hasta que se confirme el modal
      }
    } catch (error) {
      console.error("Error al procesar la cotización:", error);
      alert("Error al procesar la cotización: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Nueva función auxiliar para continuar el guardado de la cotización
  const continuarGuardadoCotizacion = async (clienteId, ejecutivo_id) => {
    try {
      // Preparar los datos de las filas incluyendo las dimensiones de la imagen
      const filasData = filas.map(fila => ({
        cantidad: fila.cantidad,
        detalle: fila.detalle,
        valor_unitario: fila.valor_unitario,
        valor_total: fila.valor_total,
        imagen_ruta: fila.imagen_ruta,
        imagen_width: fila.width || 300,
        imagen_height: fila.height || 200
      }));

      // 3. Preparar los datos de la cotización
      const cotizacionData = {
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        ruc_id: selectedRuc.id,
        cliente_id: clienteId,
        ejecutivo_id: ejecutivo_id,
        tiempo_entrega: TxttiempoEntrega,
        forma_pago: formaPago,
        validez_proforma: validezProforma,
        observaciones: observaciones
      };

      let cotizacionId;
      let numeroCotizacionGuardada = numeroCotizacion;
      if (id) {
        // Actualizar cotización existente
        const updateResponse = await fetch(`${apiUrl}/api/cotizaciones/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cotizacionData)
        });
        if (!updateResponse.ok) {
          throw new Error("Error al actualizar la cotización");
        }
        const updatedCotizacion = await updateResponse.json();
        cotizacionId = updatedCotizacion.id;
        numeroCotizacionGuardada = updatedCotizacion.numero_cotizacion || numeroCotizacion;
        // Actualizar detalles existentes
        const detallesActualizados = filasData.map(fila => ({
          cantidad: fila.cantidad,
          detalle: fila.detalle,
          valor_unitario: fila.valor_unitario,
          valor_total: fila.valor_total,
          imagen_ruta: fila.imagen_ruta
        }));

        const detallesResponse = await fetch(`${apiUrl}/api/cotizacionesDetalles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ detalles: detallesActualizados })
        });

        if (!detallesResponse.ok) {
          const errorData = await detallesResponse.json();
          throw new Error(errorData.error || "Error al actualizar los detalles de la cotización");
        }

        setShowSuccessModal(true);
        setSuccessMessage('¡Cotización actualizada exitosamente!');
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
          navigate("/cotizaciones/ver");
        }, 2000);
      } else {
        // Crear nueva cotización
        const createResponse = await fetch(`${apiUrl}/api/cotizaciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cotizacionData)
        });
        if (!createResponse.ok) {
          throw new Error("Error al crear la cotización");
        }
        const nuevaCotizacion = await createResponse.json();
        cotizacionId = nuevaCotizacion.id;
        numeroCotizacionGuardada = nuevaCotizacion.numero_cotizacion || numeroCotizacion;
        // Guardar detalles de la nueva cotización
        if (filasData.length > 0) {
          const detallesResponse = await fetch(`${apiUrl}/api/cotizacionesDetalles/${cotizacionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ detalles: filasData })
          });

          if (!detallesResponse.ok) {
            const errorData = await detallesResponse.json();
            throw new Error(errorData.error || "Error al guardar los detalles de la cotización");
          }
        }

        setShowSuccessModal(true);
        setSuccessMessage('¡Cotización creada exitosamente!');
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessMessage('');
          navigate("/cotizaciones/ver");
        }, 2000);
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

      if (!ejecutivo.trim()) {
        alert("El nombre del ejecutivo es requerido");
        return;
      }

      // Obtener el número de cotización actual y preparar el siguiente
      const numeroActual = await obtenerNumeroCotizacion();
      const siguienteNumero = (parseInt(numeroActual) + 1).toString().padStart(5, '0');

      // 1. Primero, obtener o crear el ejecutivo
      const ejecutivoResponse = await fetch(`${apiUrl}/api/ejecutivos/obtenerOCrear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: ejecutivo })
      });

      if (!ejecutivoResponse.ok) {
        throw new Error("Error al procesar el ejecutivo");
      }

      const { id: ejecutivo_id } = await ejecutivoResponse.json();

      // 2. Obtener o crear el cliente
      const buscarClienteResponse = await fetch(
        `${apiUrl}/api/clientes/buscar?nombre=${encodeURIComponent(nombreCliente)}`
      );

      if (!buscarClienteResponse.ok) {
        throw new Error("Error al buscar cliente");
      }

      const clientesEncontrados = await buscarClienteResponse.json();
      let clienteId;

      if (clientesEncontrados.length > 0) {
        // Cliente existente
        clienteId = clientesEncontrados[0].id;
      } else {
        // Crear nuevo cliente
        const crearClienteResponse = await fetch(`${apiUrl}/api/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombreCliente })
        });

        if (!crearClienteResponse.ok) {
          throw new Error("Error al crear cliente");
        }

        const clienteCreado = await crearClienteResponse.json();
        clienteId = clienteCreado.clienteId;
      }

      // Preparar los datos de las filas incluyendo las dimensiones de la imagen
      const filasData = filas.map(fila => ({
        cantidad: fila.cantidad,
        detalle: fila.detalle,
        valor_unitario: fila.valor_unitario,
        valor_total: fila.valor_total,
        imagen_ruta: fila.imagen_ruta,
        imagen_width: fila.width || 300,
        imagen_height: fila.height || 200
      }));

      // 3. Crear la nueva cotización con todas las relaciones
      const cotizacionData = {
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        ruc_id: selectedRuc.id,
        cliente_id: clienteId,
        ejecutivo_id: ejecutivo_id,
        numero_cotizacion: siguienteNumero,
        tiempo_entrega: TxttiempoEntrega,
        forma_pago: formaPago,
        validez_proforma: validezProforma,
        observaciones: observaciones
      };

      const responseCotizacion = await fetch(`${apiUrl}/api/cotizaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cotizacionData),
      });

      if (!responseCotizacion.ok) {
        throw new Error("Error al guardar la nueva cotización");
      }

      const { id: nuevaCotizacionId } = await responseCotizacion.json();

      // 4. Guardar los detalles de la nueva cotización
      for (const fila of filasData) {
        const detalleData = {
          cotizacion_id: nuevaCotizacionId,
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detalleData),
        });

        if (!responseDetalle.ok) {
          throw new Error("Error al guardar los detalles de la nueva cotización");
        }
      }

      setShowSuccessModal(true);
      setSuccessMessage('¡Nueva cotización guardada exitosamente!');
      setTimeout(() => {
        setShowSuccessModal(false);
        setSuccessMessage('');
        navigate("/cotizaciones/ver");
      }, 2000);
    } catch (error) {
      console.error("Error al guardar la nueva cotización:", error);
      alert("Error al guardar la nueva cotización: " + error.message);
    }
  };

  // Función para obtener el último número de cotización
  const obtenerNumeroCotizacion = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/cotizaciones/ultima`);
      if (response.data && response.data.numero_cotizacion) {
        // Si estamos en modo edición, mantenemos el número actual
        if (!id) {
          // Si es una nueva cotización, usamos el último número sin incrementar
          const ultimoNumero = parseInt(response.data.numero_cotizacion);
          const numeroFormateado = ultimoNumero.toString().padStart(5, '0');
          setNumeroCotizacion(numeroFormateado);
          return numeroFormateado;
        }
      } else {
        // Si no hay cotizaciones previas, comenzamos desde 00001
        setNumeroCotizacion("00001");
        return "00001";
      }
    } catch (error) {
      console.error("Error al obtener el número de cotización:", error);
      setNumeroCotizacion("Error");
      return "Error";
    }
  };

  // Llamada al cargar el componente o antes de crear una cotización
  useEffect(() => {
    if (!id) {
      obtenerNumeroCotizacion();
    }
  }, [id]);

  // Función para agregar una nueva fila
  const agregarFila = () => {
    setFilas([
      ...filas,
      {
        cantidad: 1,
        detalle: "",
        valor_unitario: 0,
        valor_total: 0,
        imagen: null,
        width: 200,
        height: 150
      }
    ]);
  };

  // Función para eliminar una fila
  const eliminarFila = (index) => {
    const nuevasFilas = filas.filter((_, i) => i !== index);
    setFilas(nuevasFilas);
  };

  // Función para manejar el cambio de imagen
  const handleImagenChange = async (index, file) => {
    if (file) {
      try {
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
        
        // Actualizar el estado con la ruta de la imagen
        const nuevasFilas = [...filas];
        nuevasFilas[index] = {
          ...nuevasFilas[index],
          imagen: `${apiUrl}${data.imagenRuta}`,
          imagen_ruta: data.imagenRuta,
          imagen_ruta_jpeg: data.imagenRutaJpeg,
          thumbnail: data.thumbnail,
          metadata: data.metadata
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
      }
    }
  };

  // Función para manejar el clic en el botón de agregar imagen
  const handleAgregarImagenClick = (index) => {
    const fileInput = document.getElementById(`file-upload-${index}`);
    if (fileInput) {
      fileInput.value = ''; // Resetear el input antes de abrir el selector
      fileInput.click();
    }
  };

  // Función para eliminar una imagen
  const handleEliminarImagen = async (index) => {
    try {
      const imagenRuta = filas[index].imagen_ruta;
      
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

      // Actualizar el estado local independientemente de si estamos en modo edición o creación
      const nuevasFilas = [...filas];
      nuevasFilas[index] = {
        ...nuevasFilas[index],
        imagen: null,
        imagen_ruta: null,
        imagen_ruta_jpeg: null,
        thumbnail: null,
        metadata: null,
        width: 200,
        height: 150
      };
      setFilas(nuevasFilas);

      // Mostrar mensaje de éxito
      alert('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      alert('Error al eliminar la imagen: ' + error.message);
    }
  };

  // Función auxiliar para formatear números de manera segura
  const formatearNumero = (numero) => {
    if (numero === null || numero === undefined || isNaN(numero)) return "0.00";
    return parseFloat(numero).toFixed(2);
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
    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    setSubtotal(subtotal);
    setIva(iva);
    setTotal(total);
  };

  // Actualiza el subtotal cuando cambian los productos
  useEffect(() => {
    const nuevoSubtotal = filas.reduce((acc, fila) => {
      return acc + (parseFloat(fila.valor_total) || 0);
    }, 0);
    setSubtotal(nuevoSubtotal);
  }, [filas]); // Se ejecuta cada vez que `filas` cambia

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
      
      // Crear un objeto temporal con los datos actuales
      const cotizacionTemp = {
        numero_cotizacion: numeroCotizacion,
        fecha: fecha,
        nombre_cliente: nombreCliente,
        nombre_ejecutivo: ejecutivo,
        ruc: selectedRuc.ruc,
        subtotal: subtotal,
        iva: iva,
        descuento: descuento,
        total: total,
        tiempo_entrega: TxttiempoEntrega,
        forma_pago: formaPago,
        validez_proforma: validezProforma,
        observaciones: observaciones
      };

      // Convertir las filas al formato esperado
      const detallesTemp = filas.map(fila => ({
        cantidad: fila.cantidad,
        detalle: fila.detalle,
        valor_unitario: fila.valor_unitario,
        valor_total: fila.valor_total,
        imagen_ruta: fila.imagen_ruta,
        imagen_width: fila.imagen_width || 300,
        imagen_height: fila.imagen_height || 200
      }));

      console.log('Enviando datos al backend:', { cotizacion: cotizacionTemp, detalles: detallesTemp });

      // Enviar los datos al backend para generar el PDF
      const response = await fetch(`${apiUrl}/api/cotizaciones/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cotizacion: cotizacionTemp,
          detalles: detallesTemp
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar la vista previa');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Error al generar la vista previa');
      }

      setPreviewUrl(data.pdf);
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

  // Función para mostrar el modal de ajuste de imagen
  const showImageAdjustModal = (index) => {
    setSelectedImageIndex(index);
    setImageDimensions({
      width: filas[index].imagen_width || 300,
      height: filas[index].imagen_height || 200
    });
  };

  // Función para aplicar los cambios de dimensiones
  const applyImageDimensions = () => {
    if (selectedImageIndex !== null) {
      const newFilas = [...filas];
      newFilas[selectedImageIndex] = {
        ...newFilas[selectedImageIndex],
        width: imageDimensions.width,
        height: imageDimensions.height,
        imagen_width: imageDimensions.width,
        imagen_height: imageDimensions.height
      };
      setFilas(newFilas);
      setSelectedImageIndex(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/cotizaciones/ver")}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <span className="mr-2">←</span> Volver
        </button>
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
      <div className="fixed top-0 left-0 h-full w-48 bg-white shadow-lg p-4 flex flex-col gap-3">
        <button
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
          onClick={() => navigate("/cotizaciones/ver")}
        >
          <i className="fas fa-arrow-left"></i>
          Regresar
        </button>

        <button
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
          onClick={() => navigate("/cotizaciones/ver")}
        >
          <i className="fas fa-search"></i>
          Buscar
        </button>

        <button 
          className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
          onClick={agregarFila}
        >
          <i className="fas fa-plus"></i>
          Agregar Producto
        </button>
      </div>

      {/* Contenedor principal con formato A4 */}
      <div className="ml-48 mx-auto bg-white shadow-lg rounded-lg p-6 w-full max-w-6xl min-h-screen" id="cotizaciones-container">
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
            {/* Derecha: COTIZACIÓN y R.U.C en una sola línea */}
<div className="flex flex-row items-start justify-end space-x-6">
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
      className="w-48 border border-gray-300 rounded-md p-2"
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

        {/* Datos del cliente y ejecutivo */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-6">
            {/* CLIENTE */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente:</label>
              <input
                id="cliente"
                type="text"
                value={nombreCliente}
                onChange={handleInputChange}
                onKeyDown={handleClienteKeyDown}
                placeholder="Ingrese el nombre del cliente..."
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
              {sugerencias.length > 0 && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 50, borderTop: '3px solid #2563eb', background: '#f8fafc' }} className="w-full border border-gray-300 rounded-b-md shadow-lg animate-fade-in">
                  <div className="flex items-center gap-2 px-3 py-1 text-xs text-blue-700 bg-blue-50 border-b border-blue-100 rounded-t-md">
                    <i className="fas fa-magic"></i>
                    Sugerencias
                  </div>
                  <ul className="max-h-48 overflow-auto">
                    {sugerencias.map((cliente, idx) => (
                      <li
                        key={cliente.id}
                        onClick={() => handleSeleccionarCliente(cliente)}
                        className={`px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors ${clienteIndex === idx ? 'bg-blue-600 text-white' : ''}`}
                      >
                        {cliente.nombre_cliente}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* EJECUTIVO */}
            <div className="relative flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ejecutivo de Cuenta:</label>
              <input
                type="text"
                value={ejecutivo}
                onChange={handleEjecutivoChange}
                onKeyDown={handleEjecutivoKeyDown}
                placeholder="Ingrese nombre del ejecutivo"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
              {sugerenciasEjecutivo.length > 0 && (
                <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 50, borderTop: '3px solid #2563eb', background: '#f8fafc' }} className="w-full border border-gray-300 rounded-b-md shadow-lg animate-fade-in">
                  <div className="flex items-center gap-2 px-3 py-1 text-xs text-blue-700 bg-blue-50 border-b border-blue-100 rounded-t-md">
                    <i className="fas fa-magic"></i>
                    Sugerencias
                  </div>
                  <ul className="max-h-48 overflow-auto">
                    {sugerenciasEjecutivo.map((ej, idx) => (
                      <li
                        key={ej.id}
                        onClick={() => handleSeleccionarEjecutivo(ej)}
                        className={`px-4 py-2 hover:bg-blue-100 cursor-pointer transition-colors ${ejecutivoIndex === idx ? 'bg-blue-600 text-white' : ''}`}
                      >
                        {ej.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Cantidad</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Valor Unitario</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Total</th>
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, index) => (
                <React.Fragment key={index}>
                  <tr>
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
                      <textarea
                        ref={(el) => (textareaRefs.current[index] = el)}
                        value={fila.detalle}
                        onChange={(e) => {
                          const nuevasFilas = [...filas];
                          nuevasFilas[index].detalle = e.target.value;
                          setFilas(nuevasFilas);
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 resize-none overflow-hidden"
                      />
                      <div className="flex gap-2 mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImagenChange(index, e.target.files[0])}
                          className="hidden"
                          id={`file-upload-${index}`}
                        />
                        <button
                          onClick={() => handleAgregarImagenClick(index)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                        >
                          <i className="fas fa-image"></i> Agregar Imagen
                        </button>
                        {fila.imagen && (
                          <>
                            <button
                              onClick={() => showImageAdjustModal(index)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1 text-sm"
                            >
                              <i className="fas fa-crop"></i> Ajustar Tamaño
                            </button>
                            <button
                              onClick={() => handleEliminarImagen(index)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                            >
                              <i className="fas fa-trash"></i> Eliminar Imagen
                            </button>
                          </>
                        )}
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
                        step="0.01"
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
                  {fila.imagen && (
                    <tr>
                      <td colSpan="5" className="border border-gray-300 px-4 py-2 bg-gray-50">
                        <div className="relative inline-block">
                          <Resizable
                            width={fila.width || 200}
                            height={fila.height || 150}
                            onResize={(e, { size }) => {
                              const nuevasFilas = [...filas];
                              nuevasFilas[index] = {
                                ...nuevasFilas[index],
                                width: size.width,
                                height: size.height,
                                imagen_width: size.width,
                                imagen_height: size.height
                              };
                              setFilas(nuevasFilas);
                              // Actualizar también las dimensiones en el modal si está abierto
                              if (selectedImageIndex === index) {
                                setImageDimensions({
                                  width: size.width,
                                  height: size.height
                                });
                              }
                            }}
                            onResizeStop={(e, { size }) => {
                              const nuevasFilas = [...filas];
                              nuevasFilas[index] = {
                                ...nuevasFilas[index],
                                width: size.width,
                                height: size.height,
                                imagen_width: size.width,
                                imagen_height: size.height
                              };
                              setFilas(nuevasFilas);
                            }}
                            draggableOpts={{ grid: [1, 1] }}
                            resizeHandles={['se']}
                            className="relative"
                          >
                            <div
                              style={{
                                width: `${fila.width || 200}px`,
                                height: `${fila.height || 150}px`,
                                overflow: "hidden",
                                position: "relative",
                              }}
                            >
                              <img
                                src={fila.imagen}
                                alt="Imagen del producto"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain'
                                }}
                                onError={(e) => {
                                  console.error('Error al cargar la imagen:', e);
                                  // Intentar cargar la versión JPEG si la WebP falla
                                  if (fila.imagen_ruta_jpeg) {
                                    e.target.src = `${apiUrl}${fila.imagen_ruta_jpeg}`;
                                  } else {
                                    e.target.style.display = 'none';
                                  }
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  right: '-7px',
                                  bottom: '-7px',
                                  width: '15px',
                                  height: '15px',
                                  backgroundColor: '#3498db',
                                  borderRadius: '50%',
                                  cursor: 'nwse-resize',
                                  zIndex: 1000,
                                  border: '2px solid white',
                                  boxShadow: '0 0 3px rgba(0,0,0,0.3)'
                                }}
                              />
                            </div>
                          </Resizable>
                        </div>
                      </td>
                    </tr>
                  )}
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
              <span className="text-sm font-medium text-gray-700">IVA 15%:</span>
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

        {/* Agregar botón de vista previa junto al botón de guardar */}
        <div className="flex justify-end gap-4 mb-6">
          <button
            onClick={generarVistaPrevia}
            disabled={previewLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <FaEye />
            {previewLoading ? 'Generando...' : 'Vista Previa PDF'}
          </button>
         
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
        {selectedImageIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h3 className="text-lg font-bold mb-4">Ajustar tamaño de imagen</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ancho (px)</label>
                  <input
                    type="number"
                    value={imageDimensions.width}
                    onChange={(e) => setImageDimensions(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alto (px)</label>
                  <input
                    type="number"
                    value={imageDimensions.height}
                    onChange={(e) => setImageDimensions(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedImageIndex(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={applyImageDimensions}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Aplicar cambio de stilo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para nuevo cliente */}
        {showNuevoClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Nuevo cliente</h3>
              <p className="mb-2">El cliente <span className="font-semibold">{nuevoClienteDatos.nombre}</span> no existe. Se creará un nuevo cliente. Por favor, complete los datos:</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.direccion}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, direccion: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                  <input
                    type="text"
                    value={nuevoClienteDatos.telefono}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, telefono: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={nuevoClienteDatos.email}
                    onChange={e => setNuevoClienteDatos(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowNuevoClienteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Validar campos mínimos
                    if (!nuevoClienteDatos.direccion || !nuevoClienteDatos.telefono || !nuevoClienteDatos.email) {
                      alert('Por favor complete todos los campos.');
                      return;
                    }
                    // Guardar cliente en la BBDD
                    try {
                      const crearClienteResponse = await fetch(`${apiUrl}/api/clientes`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          nombre: nuevoClienteDatos.nombre,
                          direccion: nuevoClienteDatos.direccion,
                          telefono: nuevoClienteDatos.telefono,
                          email: nuevoClienteDatos.email
                        })
                      });
                      if (!crearClienteResponse.ok) {
                        throw new Error("Error al crear cliente");
                      }
                      const clienteCreado = await crearClienteResponse.json();
                      setShowNuevoClienteModal(false);
                      if (onNuevoClienteConfirm) {
                        await onNuevoClienteConfirm(clienteCreado.clienteId);
                      }
                    } catch (error) {
                      alert('Error al guardar el cliente: ' + error.message);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Guardar cliente
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center">
              <svg className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-semibold text-lg">{successMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CotizacionesCrear;