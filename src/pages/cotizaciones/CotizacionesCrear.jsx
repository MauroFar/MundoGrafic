import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Logo from "../../components/Logo";
import axios from 'axios';
import "react-resizable/css/styles.css";
import { Resizable } from "react-resizable";
import Encabezado from "../../components/Encabezado";

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
  const [numeroCotizacion, setNumeroCotizacion] = useState("Generando...");
  const textareaRefs = useRef([]);

  // Cargar datos de la cotización si estamos en modo edición
  useEffect(() => {
    if (id) {
      cargarCotizacion();
    }
  }, [id]);

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
      setSubtotal(cotizacionData.subtotal || 0);
      setDescuento(cotizacionData.descuento || 0);
      setSelectedRuc({
        id: cotizacionData.ruc_id || "",
        ruc: cotizacionData.ruc || "",
        descripcion: cotizacionData.ruc_descripcion || ""
      });
      setNombreCliente(cotizacionData.nombre_cliente || "");
      setEjecutivo(cotizacionData.nombre_ejecutivo || "");
      setNumeroCotizacion(cotizacionData.numero_cotizacion || "");
      
      // Actualizar las filas con los detalles
      if (Array.isArray(detallesData)) {
        setFilas(detallesData.map(detalle => ({
          cantidad: detalle.cantidad || 0,
          detalle: detalle.detalle || "",
          unitario: detalle.valor_unitario || 0,
          total: detalle.valor_total || 0,
          imagen: detalle.imagen_base64 || null,
          width: detalle.imagen_width || 200,
          height: detalle.imagen_height || 150,
        })));
      } else {
        setFilas([]);
      }

    } catch (error) {
      console.error("Error al cargar la cotización:", error);
      alert("Error al cargar los datos de la cotización");
      // Establecer valores por defecto en caso de error
      setFecha(today);
      setSubtotal(0);
      setDescuento(0);
      setSelectedRuc({ id: "", ruc: "", descripcion: "" });
      setNombreCliente("");
      setEjecutivo("");
      setNumeroCotizacion("");
      setFilas([]);
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
    fetch(`${apiUrl}/api/rucs`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Datos recibidos del backend:", data);
        setRucs(data);
      })
      .catch((error) => console.error("Error al obtener los RUCs:", error));
  }, []);

  useEffect(() => {
    console.log("RUCs cargados:", rucs);
  }, [rucs]);

  const handleRucChange = (event) => {
    const rucSeleccionado = event.target.value;
    const rucObj = rucs.find((r) => r.ruc === rucSeleccionado);
    if (rucObj) {
      setSelectedRuc({ 
        id: rucObj.id, 
        ruc: rucObj.ruc,
        descripcion: rucObj.descripcion 
      });
      console.log("RUC seleccionado:", rucObj.id, rucObj.ruc);
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

      // 3. Crear la cotización con todas las relaciones
      const cotizacionData = {
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        ruc_id: selectedRuc.id,
        cliente_id: clienteId,
        ejecutivo_id: ejecutivo_id
      };

      const responseCotizacion = await fetch(`${apiUrl}/api/cotizaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cotizacionData),
      });

      if (!responseCotizacion.ok) {
        throw new Error("Error al guardar la cotización");
      }

      const cotizacionResponse = await responseCotizacion.json();

      // 4. Guardar los detalles de la cotización
      const detallesData = {
        cotizacion_id: cotizacionResponse.id,
        detalles: filas.map((fila) => ({
          cantidad: fila.cantidad,
          detalle: fila.detalle,
          valor_unitario: fila.unitario,
          valor_total: fila.total,
          imagen_base64: fila.imagen,
          imagen_width: fila.width,
          imagen_height: fila.height,
        })),
      };

      const responseDetalles = await fetch(`${apiUrl}/api/cotizacionesDetalles/prueba`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detallesData),
      });

      if (!responseDetalles.ok) {
        throw new Error("Error al guardar los detalles de la cotización");
      }

      alert("Cotización guardada exitosamente!");
      navigate("/cotizaciones/ver");

    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Hubo un problema al guardar los datos.");
    }
  };

  // Función para obtener el último número de cotización
  const obtenerNumeroCotizacion = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/cotizaciones/ultima`);
      if (response.data && response.data.numero_cotizacion) {
        // Si estamos en modo edición, mantenemos el número actual
        if (!id) {
          // Si es una nueva cotización, incrementamos el último número
          const ultimoNumero = parseInt(response.data.numero_cotizacion);
          const nuevoNumero = ultimoNumero + 1;
          setNumeroCotizacion(nuevoNumero.toString().padStart(3, '0'));
        }
      } else {
        // Si no hay cotizaciones previas, comenzamos desde 001
        setNumeroCotizacion("001");
      }
    } catch (error) {
      console.error("Error al obtener el número de cotización:", error);
      setNumeroCotizacion("Error");
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
        unitario: 0,
        total: 0,
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
  const handleImagenChange = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const nuevasFilas = [...filas];
        nuevasFilas[index].imagen = reader.result;
        setFilas(nuevasFilas);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para eliminar una imagen
  const handleEliminarImagen = (index) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index].imagen = null;
    setFilas(nuevasFilas);
  };

  // Función auxiliar para formatear números de manera segura
  const formatearNumero = (numero) => {
    if (numero === null || numero === undefined) return "0.00";
    const num = typeof numero === 'string' ? parseFloat(numero) : numero;
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Actualizar cálculos cuando cambien los valores
  useEffect(() => {
    const nuevoIva = parseFloat(subtotal) * 0.15;
    const nuevoTotal = parseFloat(subtotal) + nuevoIva - parseFloat(descuento);
    setIva(nuevoIva);
    setTotal(nuevoTotal);
  }, [subtotal, descuento]);

  // Actualiza el subtotal cuando cambian los productos
  useEffect(() => {
    const nuevoSubtotal = filas.reduce((acc, fila) => {
      return acc + (parseFloat(fila.total) || 0);
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
    <div className="min-h-screen bg-gray-100 p-8">
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
          onClick={handleGuardarTodo}
        >
          <i className="fas fa-save"></i>
          Guardar
        </button>

        <button 
          className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-sm transition-all duration-300 ease-in-out flex items-center justify-center gap-2"
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
                  className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  id="ruc"
                  value={selectedRuc.ruc}
                  onChange={handleRucChange}
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
                        onChange={(e) => {
                          const nuevasFilas = [...filas];
                          nuevasFilas[index].cantidad = e.target.value;
                          setFilas(nuevasFilas);
                        }}
                        className="w-full border border-gray-300 rounded-md p-2 text-center"
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
                        value={fila.unitario}
                        onChange={(e) => {
                          const nuevasFilas = [...filas];
                          nuevasFilas[index].unitario = e.target.value;
                          nuevasFilas[index].total = (
                            parseFloat(e.target.value) *
                            parseFloat(nuevasFilas[index].cantidad || 0)
                          ).toFixed(2);
                          setFilas(nuevasFilas);
                        }}
                        className="w-32 border border-gray-300 rounded-md p-2 text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right align-top">
                      ${formatearNumero(fila.total)}
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
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Tiempo de Entrega:</label>
              <input
                type="text"
                value={TxttiempoEntrega}
                onChange={(e) => setTxtTiempoEntrega(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Forma de Pago:</label>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Validez de Proforma:</label>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-700">Observaciones:</label>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md p-2"
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