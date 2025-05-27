import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // ❌ 'data' no es un hook válido en react-router-dom
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../styles/cotizaciones/Cotizaciones.css";
import Logo from "../../components/Logo";
import axios from 'axios';
import "react-resizable/css/styles.css";
import { Resizable } from "react-resizable";
import Encabezado from "../../components/Encabezado";




function CotizacionesCrear() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [rucs, setRucs] = useState([]);
  const [selectedRuc, setSelectedRuc] = useState({ id: "", ruc: "" });
  const [ejecutivo, setEjecutivo] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  
 
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
      setSelectedRuc({ id: rucObj.id, ruc: rucSeleccionado });
      setEjecutivo(rucObj.ejecutivo);
      console.log("RUC seleccionado:", rucObj.id, rucObj.ruc);
    }
    const ejecutivoSeleccionado = rucObj ? rucObj.ejecutivo : "";
    setEjecutivo(ejecutivoSeleccionado);
    console.log("Ejecutivo actualizado:", ejecutivoSeleccionado);
  };

  useEffect(() => {
    if (ejecutivo) {
      console.log("Ejecutivo seleccionado:", ejecutivo);
    }
  }, [ejecutivo]);

  //////////////////////////guardar cotizaciones en la bbdd ////////////////////

  const handleGuardarTodo = async () => {
    const clienteData = {
      nombre: nombreCliente,
      ruc_id: selectedRuc.id,
    };

    const cotizacionData = {
      fecha,
      subtotal,
      iva,
      descuento,
      total,
      ruc_id: selectedRuc.id,
    };
    if (!selectedRuc.id){
      alert("selecciona un ruc para buscar clientes relacionados")
      return;
    }
    try {
      let clienteId = null;

      // Intentar buscar si ya existe el cliente
      const buscarResponse = await fetch(
        `${apiUrl}/api/clientes/buscar?nombre=${encodeURIComponent(nombreCliente)}&ruc_id=${selectedRuc.id}`
      );
      if (buscarResponse.ok) {
        const clienteEncontrado = await buscarResponse.json();
        console.log("Cliente encontrado ", clienteEncontrado);
      
        if (clienteEncontrado.length > 0) {
          clienteId = clienteEncontrado[0].id;
          console.log("Cliente ya existe con ID:", clienteId);
        }
      }
      

      // Si no se encontró el cliente, lo creamos
      if (!clienteId) {
        const responseCliente = await fetch(`${apiUrl}/api/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(clienteData),
        });

        if (!responseCliente.ok) {
          throw new Error("Error al guardar el cliente");
        }

        const clienteResponse = await responseCliente.json();
        clienteId = clienteResponse.clienteId;
        console.log("Cliente nuevo creado con ID:", clienteId);
      }

      // Crear cotización
      cotizacionData.cliente_id = clienteId;

      const responseCotizacion = await fetch(`${apiUrl}/api/cotizaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cotizacionData),
      });

      if (!responseCotizacion.ok) {
        throw new Error("Error al guardar la cotización");
      }

      const cotizacionResponse = await responseCotizacion.json();
      const cotizacionId = cotizacionResponse.id;

      console.log("Esta es la id de la cotización:", cotizacionId);

      const detallesData = {
        cotizacion_id: cotizacionId,
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

      alert("Cliente, cotización y detalles guardados exitosamente!");
      navigate("/Dashboard");

      setFecha("");
      setSubtotal(0);
      setDescuento(0);
      setSelectedRuc({ id: "", ruc: "" });
      setNombreCliente("");

    } catch (error) {
      console.error("Error:", error);
      alert("Hubo un problema al guardar los datos.");
    }
  };

////////////////obtener num cotizacion ///////////////////
const [numeroCotizacion, setNumeroCotizacion] = useState(null);

// Función para obtener el último número de cotización
const obtenerNumeroCotizacion = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/cotizaciones/ultima`);
    console.log("Número de cotización recibido:", response.data.numero_cotizacion);
    setNumeroCotizacion(response.data.numero_cotizacion);  // Establecer el número de cotización en el estado
  } catch (error) {
    console.error("Error al obtener el número de cotización:", error);
  }
};

// Llamada al cargar el componente o antes de crear una cotización
useEffect(() => {
  obtenerNumeroCotizacion();
}, []);

  ////////////////////OBTENER FECHA/////////////////////////////////////////////
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);
  //estado para almacenar filas dinamicas
  // Estado para almacenar filas dinámicas
  const [filas, setFilas] = useState([]);

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

  // Estado para los campos del pie de cotización
  const [tiempoEntrega, setTiempoEntrega] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [validezProforma, setValidezProforma] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Estado para los cálculos del total
  const [subtotal, setSubtotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva - descuento;
  // Actualiza el subtotal cuando cambian los productos
  useEffect(() => {
    const nuevoSubtotal = filas.reduce((acc, fila) => {
      return acc + (parseFloat(fila.total) || 0);
    }, 0);
    setSubtotal(nuevoSubtotal);
  }, [filas]); // Se ejecuta cada vez que `filas` cambia

  const navigate = useNavigate();

  const [TxttiempoEntrega, setTxtTiempoEntrega] = useState("5 días hábiles");

  return (
    <>
        <div className="hoja-general">
          <div className="btnadministracion">
            <button
              className="btn-regresar"
              onClick={() => navigate("/Cotizaciones")}
            >
              ← Regresar
            </button>

            <button
              className="btn-regresar"
              onClick={() => navigate("/Dashboard")}
            >
              Buscar
            </button>

            <button className="btn-regresar" onClick={() => window.print()}>
              Descargar/Imprimir
            </button>

            <button className="btn-regresar" onClick={handleGuardarTodo}>Guardar BBDD</button>

            <button className="btn-agregar" onClick={agregarFila}>
              Agregar Producto
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
                    <div className="numero-cotizacion"> {numeroCotizacion ? numeroCotizacion : "Generando..."} {/* Muestra el número de cotización o 'Generando...' */} </div>{" "}
                    {/* Se manejará con BBDD en el futuro */}
                  </div>

                  <div className="ruc-box">
                    <span className="ruc-label">R.U.C</span>
                    <select
                      className="ruc-select"
                      id="ruc"
                      value={selectedRuc.ruc}
                      onChange={handleRucChange}
                    >
                      <option value="">Seleccione un ruc</option>
                      {rucs.map((ruc) => (
                        <option key={ruc.id} value={ruc.ruc}>
                          {ruc.ruc}
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
                <input type="text" value={ejecutivo}  onChange={(e) => setEjecutivo(e.target.value)} />
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
                    <label>Subtotal:</label> <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="campoPie">
                    <label>IVA 15%:</label> <span>${iva.toFixed(2)}</span>
                  </div>
                  <div className="campoPie">
                    <label>Descuento:</label>{" "}
                    <input type="text" className="input-descuento"></input>
                  </div>
                  <div className="campoPie">
                    <label>Total:</label> <span>${total.toFixed(2)}</span>
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
