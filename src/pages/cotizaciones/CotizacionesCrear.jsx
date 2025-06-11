import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../styles/cotizaciones/Cotizaciones.css";
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
          total: detalle.valor_total || 0
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
      { cantidad: "", detalle: "", unitario: "", total: "" },
    ]);
  };

  // Función para eliminar una fila específica
  const eliminarFila = (index) => {
    const nuevasFilas = filas.filter((_, i) => i !== index);
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

  const CustomRucSelect = ({ rucs, selectedRuc, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="ruc-box">
        <span className="ruc-label">R.U.C</span>
        <div className="custom-select">
          {/* Mostrar solo el RUC cuando está cerrado */}
          <div 
            className="selected-value"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedRuc.ruc || "Seleccione un RUC"}
          </div>

          {/* Desplegable con RUC + descripción */}
          {isOpen && (
            <div className="options-container">
              {rucs.map((ruc) => (
                <div
                  key={ruc.id}
                  className="option"
                  onClick={() => {
                    onChange({
                      target: { value: ruc.ruc }
                    });
                  }}
                >
                  {ruc.ruc} - {ruc.descripcion}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="hoja-general">
        <div className="btnadministracion">
          <button
            className="w-28 h-12 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center gap-2 text-base"
            onClick={() => navigate("/Cotizaciones")}
          >
            <span>←</span> Regresar
          </button>

          <button
            className="w-28 h-12 bg-blue-500 hover:bg-blue-600  text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center gap-2 text-base"
            onClick={() => navigate("/Cotizaciones/Ver")}
          >
            <i className="fas fa-search"></i> Buscar
          </button>

          <button 
            className="w-28 h-12 bg-green-500 hover:bg-green-600  text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center gap-2 text-base"
            onClick={() => window.print()}
          >
            <i className="fas fa-download"></i> Imprimir
          </button>

          <button 
            className="w-28 h-12 bg-purple-500 hover:bg-purple-600  text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center gap-2 text-base"
            onClick={handleGuardarTodo}
          >
            <i className="fas fa-save"></i> Guardar BBDD
          </button>

          <button 
            className="w-28 h-12 bg-yellow-500 hover:bg-yellow-600  text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out flex items-center justify-center gap-2 text-base"
            onClick={agregarFila}
          >
            <i className="fas fa-plus"></i> Agregar Producto
          </button>  
        </div>

        <div className="cotizaciones-container" id="cotizaciones-container">
          <div className="encabezado-container">
            {/* Contenedor general del encabezado (Izquierda y Derecha) */}
            <div className="encabezado-content">
              {/* Izquierda: MUNDOGRAFIC */}
              <div className="encabezado-left">
                <div className="flex-shrink-0 w-80 mt-0">
                  <Logo/>
                </div>
                <p className="subtitulo">
                  CORPORACION MUNDO GRAFIC MUNDOGRAFIC CIA. LTDA.
                </p>
              </div>

              {/* Derecha: COTIZACIÓN y R.U.C */}
              <div className="cotizacion-section">
                <div className="cotizacion-box">
                  <span className="cotizacion-label">COTIZACIÓN</span>
                  <div className="numero-cotizacion">{numeroCotizacion}</div>
                </div>

                <div className="ruc-box">
                  <span className="ruc-label">R.U.C</span>
                  <select
                    className="ruc-select"
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
            <Encabezado/>        
          </div>

          {/*cuerpo de datos */}
          <div className="cuerpo-datos">
            {/* Cliente (Izquierda) - Ejecutivo de Cuenta (Derecha) */}
            <div className="fila">
              <div className="campo campo-izquierda"  style={{ position: 'relative' }}>
                <label htmlFor="cliente">Cliente:</label>
                <input
                  id="cliente"
                  type="text"
                  value={nombreCliente}
                  onChange={handleInputChange}
                  placeholder="Selecciona un Ruc para buscar cliente..."
                  autoComplete="off"  
                />

                {/* Mostrar las sugerencias personalizadas si hay resultados */}
                {sugerencias.length > 0 && (
                  <div className="sugerencias-container">
                    <ul className="sugerencias-list">
                      {sugerencias.map((cliente) => (
                        <li
                          key={cliente.id}
                          onClick={() => handleSeleccionarCliente(cliente)}
                        >
                          {cliente.nombre_cliente}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="campo campo-derecha">
                <label>Ejecutivo de Cuenta:</label>
                <input 
                  type="text"
                  value={ejecutivo}
                  onChange={(e) => setEjecutivo(e.target.value)}
                  placeholder="Ingrese nombre del ejecutivo"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>
            </div>
            <div className="fila">
              <div className="fecha-container">
                <div className="campo">
                  <label>Fecha:</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Cotización */}
          <div className="cuerpo-cotizacion">
            <table className="tabla-cotizacion">
              <thead>
                <tr>
                  <th className="col-cant">CANT</th>
                  <th className="col-detalle">DETALLE</th>
                  <th className="col-unitario">V. UNITARIO</th>
                  <th className="col-total">V. TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td className="col-cant">
                        <input
                          type="number"
                          value={fila.cantidad}
                          onChange={(e) => {
                            const nuevasFilas = [...filas];
                            nuevasFilas[index].cantidad = e.target.value;
                            setFilas(nuevasFilas);
                          }}
                        />
                      </td>

                      <td className="col-detalle">
                        <div className="detalle-container">
                          <textarea
                            value={fila.detalle}
                            onChange={(e) => {
                              const nuevasFilas = [...filas];
                              nuevasFilas[index].detalle = e.target.value;
                              setFilas(nuevasFilas);

                              e.target.style.height = "auto";
                              e.target.style.height =
                                e.target.scrollHeight + "px";
                            }}
                            rows="1"
                          />

                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const nuevasFilas = [...filas];
                                  nuevasFilas[index].imagen = reader.result;
                                  setFilas(nuevasFilas);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ display: "none" }}
                            id={`file-upload-${index}`}
                          />
                        </div>
                      </td>

                      <td className="col-unitario">
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
                        />
                      </td>

                      <td className="col-total">
                        <input type="number" value={fila.total} readOnly />
                      </td>

                      <td className="col-accion">
                        <button
                          className="btn-cancelar"
                          onClick={() => eliminarFila(index)}
                        >
                          Cancelar
                        </button>
                        <button
                            className="btn-insertar-imagen"
                            onClick={() =>
                              document
                                .getElementById(`file-upload-${index}`)
                                .click()
                            }
                          >
                            📷
                          </button>
                          <button
                            className="btn-eliminar-imagen"
                            onClick={() => {
                              const nuevasFilas = [...filas];
                              nuevasFilas[index].imagen = null;
                              setFilas(nuevasFilas);
                            }}
                          >
                            ❌
                          </button>
                      </td>
                    </tr>

                    {/* Fila extra solo para la imagen */}
                    {fila.imagen && (
                      <tr>
                        <td colSpan="5" className="detalle-imagen-row">
                          <div className="detalle-imagen-container">
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
                                  alt="Imagen subida"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    cursor: "nwse-resize",
                                    border: "none",
                                    boxShadow: "none",
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

          {/* 🔹 Pie de Cotización (Movido a un `footer`) */}
          <footer className="cotizaciones-footer">
            <div className="pie-cotizacion">
              <div className="pie-izquierda">
                <div className="campoPie">
                  <label>Tiempo de Entrega:</label>{" "}
                  <input
                    type="text"
                    value={TxttiempoEntrega}
                    onChange={(e) => setTxtTiempoEntrega(e.target.value)}
                  />
                </div>
                <div className="campoPie">
                  <label>Forma de Pago:</label> <input type="text" />
                </div>
                <div className="campoPie">
                  <label>Validez de Proforma:</label> <input type="text" />
                </div>
                <div className="campoPie">
                  <label>Observaciones:</label> <input type="text" />
                </div>
              </div>
              <div className="pie-derecha">
                <div className="campoPie">
                  <label>Subtotal:</label> <span>${formatearNumero(subtotal)}</span>
                </div>
                <div className="campoPie">
                  <label>IVA 15%:</label> <span>${formatearNumero(iva)}</span>
                </div>
                <div className="campoPie">
                  <label>Descuento:</label>{" "}
                  <input 
                    type="number" 
                    className="input-descuento"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                  />
                </div>
                <div className="campoPie">
                  <label>Total:</label> <span>${formatearNumero(total)}</span>
                </div>
              </div>
            </div>

            <div className="pie-pagina">
              <p>
                Quito: Pasaje San Luis N12-87 y Antonio Ante, Edif Apolo 1
                Telefax:2589134 - Tumbaco:Norberto Salazar E7-224X y pasaje San
                Martin Telf:2379320 E-mail:ventas@mundografic.com Cel:099661572<br></br>
                <a href="https://www.mundografic.com" target="_blank">
                  www.mundografic.com
                </a>{" "}
                <a href="https://instagram.com" target="_blank">
                  <i className="fab fa-instagram"></i>/mundografic
                </a>
                <a href="https://youtube.com" target="_blank">
                  <i className="fab fa-youtube"></i>/mundografic
                </a>
                <a href="https://facebook.com" target="_blank">
                  <i className="fab fa-facebook"></i>/mundografic
                </a>
                <a href="https://twitter.com" target="_blank">
                  <i className="fab fa-twitter"></i>@mundografic
                </a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

export default CotizacionesCrear;
