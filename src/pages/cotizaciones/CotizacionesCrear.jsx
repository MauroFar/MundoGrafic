import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Logo from "../../components/Logo";
import axios from 'axios';
import "react-resizable/css/styles.css";
import { Resizable } from "react-resizable";
import Encabezado from "../../components/Encabezado";
import { FaSave } from "react-icons/fa";

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
    if (valor.trim() !== "") {
      await buscarClientes(valor);
    } else {
      setSugerencias([]);
    }
  };

  const buscarClientes = async (nombre) => {
    if (!selectedRuc.id) {
      console.warn("No se ha seleccionado ningún RUC, no se puede buscar clientes.");
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/clientes/buscar?nombre=${nombre}&ruc_id=${selectedRuc.id}`);
      const data = await response.json();
      setSugerencias(data);
    } catch (error) {
      console.error("Error al obtener sugerencias de clientes:", error);
    }
  };

  const handleSeleccionarCliente = (cliente) => {
    setNombreCliente(cliente.nombre_cliente);
    setSugerencias([]);
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

  //////////////////////////guardar cotizaciones en la bbdd ////////////////////

  const handleGuardarTodo = async () => {
    try {
      // Validaciones iniciales
      if (!selectedRuc) {
        alert("Por favor seleccione un RUC");
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

        // Actualizar detalles existentes
        const detallesActualizados = filas.map(fila => ({
          cantidad: parseFloat(fila.cantidad),
          detalle: fila.detalle,
          valor_unitario: parseFloat(fila.valor_unitario),
          valor_total: parseFloat(fila.valor_total),
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

        alert("Cotización actualizada exitosamente");
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

        // Guardar detalles de la nueva cotización
        if (filas.length > 0) {
          const detallesActualizados = filas.map(fila => ({
            cantidad: parseFloat(fila.cantidad),
            detalle: fila.detalle,
            valor_unitario: parseFloat(fila.valor_unitario),
            valor_total: parseFloat(fila.valor_total),
            imagen_ruta: fila.imagen_ruta
          }));

          const detallesResponse = await fetch(`${apiUrl}/api/cotizacionesDetalles/${cotizacionId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ detalles: detallesActualizados })
          });

          if (!detallesResponse.ok) {
            const errorData = await detallesResponse.json();
            throw new Error(errorData.error || "Error al guardar los detalles de la cotización");
          }
        }

        alert("Cotización guardada exitosamente");
      }

      navigate("/cotizaciones/ver");
    } catch (error) {
      console.error("Error al procesar la cotización:", error);
      alert("Error al procesar la cotización: " + error.message);
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
      const siguienteNumero = (parseInt(numeroActual) + 1).toString().padStart(3, '0');

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
      for (const fila of filas) {
        const detalleData = {
          cotizacion_id: nuevaCotizacionId,
          cantidad: fila.cantidad,
          detalle: fila.detalle,
          valor_unitario: fila.valor_unitario,
          valor_total: fila.valor_total,
          imagen_ruta: fila.imagen_ruta
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

      alert("Nueva cotización guardada exitosamente");
      navigate("/cotizaciones/ver");
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
          const numeroFormateado = ultimoNumero.toString().padStart(3, '0');
          setNumeroCotizacion(numeroFormateado);
          return numeroFormateado;
        }
      } else {
        // Si no hay cotizaciones previas, comenzamos desde 001
        setNumeroCotizacion("001");
        return "001";
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
      } catch (error) {
        console.error('Error al subir la imagen:', error);
        alert('Error al subir la imagen: ' + error.message);
      }
    }
  };

  // Función para eliminar una imagen
  const handleEliminarImagen = async (index) => {
    try {
      const imagenRuta = filas[index].imagen_ruta;
      if (imagenRuta) {
        // Eliminar la imagen del servidor
        const response = await fetch(`${apiUrl}/api/upload/imagen`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imagenRuta })
        });

        if (!response.ok) {
          throw new Error('Error al eliminar la imagen');
        }
      }

      // Actualizar el estado
      const nuevasFilas = [...filas];
      nuevasFilas[index] = {
        ...nuevasFilas[index],
        imagen: null,
        imagen_ruta: null,
        imagen_ruta_jpeg: null,
        thumbnail: null,
        metadata: null
      };
      setFilas(nuevasFilas);
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
    const iva = subtotal * 0.12;
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
              >
                <FaSave className="mr-2" /> Actualizar
              </button>
            </>
          ) : (
            <button
              onClick={handleGuardarTodo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <FaSave className="mr-2" /> Guardar
            </button>
          )}
        </div>
      </div>

      {/* Barra lateral de botones */}
      <div className="fixed top-0 left-0 h-full w-48 bg-white shadow-lg p-4 flex flex-col gap-3">
        <button
          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
          onClick={() => navigate("/cotizaciones")}
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
            <div className="flex flex-col items-end space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <span className="text-sm font-semibold text-gray-600">COTIZACIÓN</span>
                <div className="text-xl font-bold text-gray-800">{numeroCotizacion}</div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <span className="text-sm font-semibold text-gray-600 block mb-2">R.U.C</span>
                <select
                  value={selectedRuc.ruc}
                  onChange={handleRucChange}
                  className="w-full border border-gray-300 rounded-md p-2"
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente:</label>
              <input
                id="cliente"
                type="text"
                value={nombreCliente}
                onChange={handleInputChange}
                placeholder="Selecciona un Ruc para buscar cliente..."
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
              {sugerencias.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  <ul className="max-h-48 overflow-auto">
                    {sugerencias.map((cliente) => (
                      <li
                        key={cliente.id}
                        onClick={() => handleSeleccionarCliente(cliente)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {cliente.nombre_cliente}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
                   <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            

            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ejecutivo de Cuenta:</label>
              <input 
                type="text"
                value={ejecutivo}
                onChange={(e) => setEjecutivo(e.target.value)}
                placeholder="Ingrese nombre del ejecutivo"
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
         
            </div>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Cantidad</th>
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
                          onClick={() => document.getElementById(`file-upload-${index}`).click()}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                        >
                          <i className="fas fa-image"></i> Agregar Imagen
                        </button>
                        {fila.imagen && (
                          <button
                            onClick={() => handleEliminarImagen(index)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                          >
                            <i className="fas fa-trash"></i> Eliminar Imagen
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 align-top">
                      <input
                        type="number"
                        value={fila.valor_unitario}
                        onChange={(e) => handleValorUnitarioChange(index, e.target.value)}
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
                              };
                              setFilas(nuevasFilas);
                            }}
                            handleStyles={{
                              bottomRight: {
                                width: "15px",
                                height: "15px",
                                backgroundColor: "#3498db",
                                borderRadius: "50%",
                                position: "absolute",
                                right: "5px",
                                bottom: "5px",
                                cursor: "nwse-resize",
                              },
                            }}
                          >
                            <div
                              style={{
                                width: fila.width || 200,
                                height: fila.height || 150,
                                overflow: "hidden",
                                position: "relative",
                              }}
                            >
                              <img
                                src={fila.imagen}
                                alt="Imagen del producto"
                                className="w-full h-full object-contain"
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
      </div>
    </div>
  );
}

export default CotizacionesCrear;