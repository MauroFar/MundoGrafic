import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // ❌ 'data' no es un hook válido en react-router-dom
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/Cotizaciones.css";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function Cotizaciones() {
  const [rucs, setRucs] = useState([]); // Lista de RUCs con ejecutivos
  const [selectedRuc, setSelectedRuc] = useState(""); // RUC seleccionado
  const [ejecutivo, setEjecutivo] = useState(""); // Nombre del ejecutivo

  // Cargar los RUCs y sus ejecutivos desde el backend
  useEffect(() => {
    fetch("http://localhost:5000/api/rucs")
      .then((response) => response.json())
      .then((data) => {
        console.log("Datos recibidos del backend:", data); // Verifica que los datos estén correctos
        setRucs(data);
      })
      .catch((error) => console.error("Error al obtener los RUCs:", error));
  }, []);

  // Mostrar los RUCs cargados para ver si la API está devolviendo lo correcto
  useEffect(() => {
    console.log("RUCs cargados:", rucs);
  }, [rucs]);

  // Manejar el cambio de selección de RUC
  const handleRucChange = (event) => {
    const rucSeleccionado = event.target.value;
    setSelectedRuc(rucSeleccionado);

    // Buscar el Ejecutivo en el array de RUCs
    const rucObj = rucs.find((r) => r.ruc === rucSeleccionado);
    const ejecutivoSeleccionado = rucObj ? rucObj.ejecutivo : "";
    setEjecutivo(ejecutivoSeleccionado);
    console.log("Ejecutivo actualizado:", ejecutivoSeleccionado); // Verifica el valor del ejecutivo
  };

  // Mostrar el nombre del ejecutivo en la consola cuando cambie
  useEffect(() => {
    if (ejecutivo) {
      console.log("Ejecutivo seleccionado:", ejecutivo);
    }
  }, [ejecutivo]); // Se ejecutará cada vez que el valor de 'ejecutivo' cambie

  //OBTENER FECHA
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

  //////////////////////////guardar cotizacion ////////////////////
  const [cotizacion, setCotizacion] = useState({
    cliente: "",
    ejecutivo_id: 1, // ID del ejecutivo de cuenta
    fecha: new Date().toISOString().split("T")[0], // Fecha actual
    ruc_id: "", // ID del RUC seleccionado
    subtotal: 0,
    iva: 0,
    descuento: 0,
    total: 0,
    detalles: [], // Array de detalles (productos)
  });

  // Función para manejar el clic en el botón "Guardar BBDD"
  const handleGuardarCotizacion = async () => {
    // Crear el objeto de cotización actualizado
    const cotizacionParaGuardar = {
      cliente: "Nombre del cliente", // Este valor lo tomas de tu input de cliente
      ejecutivo_id: ejecutivo, // Este es el ejecutivo seleccionado
      fecha: fecha, // Fecha de la cotización
      ruc_id: selectedRuc, // ID del RUC seleccionado
      subtotal: subtotal, // El subtotal calculado
      iva: iva, // IVA calculado
      descuento: descuento, // Descuento, si aplica
      total: total, // Total calculado
      detalles: filas.map((fila) => ({
        cantidad: fila.cantidad,
        detalle: fila.detalle,
        unitario: fila.unitario,
        total: fila.total,
      })), // Asegúrate de enviar los detalles de la cotización
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/cotizaciones/guardar-cotizacion",
        cotizacionParaGuardar
      );
      console.log("Cotización guardada:", response.data);
      alert("Cotización guardada con éxito");
    } catch (error) {
      console.error("Error al guardar la cotización:", error);
      alert("Hubo un error al guardar la cotización");
    }
  };
  ///////////////////guardar en formato pdf ////////////////////
  const cotizacionRef = useRef(null); // Usamos React Ref para acceder a la cotización

  const exportPDF = () => {
    // Acceder a los elementos de la cotización
    const cotizacionElement = cotizacionRef.current;

    // Guardar el estado original de los botones (ocultarlos temporalmente)
    const btnCancelar = cotizacionElement.querySelectorAll(".btn-cancelar");
    const btnInsertarImagen = cotizacionElement.querySelectorAll(
      ".btn-insertar-imagen"
    );
    const btnEliminarImagen = cotizacionElement.querySelectorAll(
      ".btn-eliminar-imagen"
    );
    const colAccion = cotizacionElement.querySelectorAll(".col-accion");

    // Ocultar los botones de acción antes de la captura
    btnCancelar.forEach((btn) => (btn.style.display = "none"));
    btnInsertarImagen.forEach((btn) => (btn.style.display = "none"));
    btnEliminarImagen.forEach((btn) => (btn.style.display = "none"));
    colAccion.forEach((col) => (col.style.display = "none")); // Ocultar la columna 'Acción'

    // Ahora, generar el PDF con html2canvas y jsPDF
    html2canvas(cotizacionElement, {
      logging: true,
      useCORS: true,
      scale: 2,
    }).then((canvas) => {
      const imgWidth = 208;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      // Agregar la imagen al PDF
      pdf.addImage(canvas, "PNG", 0, 0, imgWidth, imgHeight);

      // Guardar el archivo PDF
      pdf.save("Cotizacion_" + new Date().toISOString() + ".pdf");

      // Restaurar los botones después de la generación del PDF
      btnCancelar.forEach((btn) => (btn.style.display = "block"));
      btnInsertarImagen.forEach((btn) => (btn.style.display = "block"));
      btnEliminarImagen.forEach((btn) => (btn.style.display = "block"));
      colAccion.forEach((col) => (col.style.display = "table-cell")); // Restaurar la columna
    });
  };

  return (
    <>
      <div className="hoja-general">
        <div className="btnadministracion">
          <button
            className="btn-regresar"
            onClick={() => navigate("/Dashboard")}
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
            Imprimir
          </button>

          <button className="btn-regresar">Guardar BBDD</button>

          <button className="btn-agregar" onClick={agregarFila}>
            Agregar Producto
          </button>

          <button onClick={exportPDF}>Guardar como PDF</button>
        </div>

        <div className="cotizaciones-container" id="App" ref={cotizacionRef}>
          <div className="encabezado-container">
            {/* Contenedor general del encabezado (Izquierda y Derecha) */}
            <div className="encabezado-content">
              {/* Izquierda: MUNDOGRAFIC */}
              <div className="encabezado-left">
                <span className="corporacion">CORPORACION</span>
                <h1 className="mundografic">
                  MUNDO
                  <span className="grafic">
                    GRAFIC<span className="marca-registrada">®</span>
                  </span>
                </h1>
                <p className="subtitulo">
                  CORPORACION MUNDO GRAFIC MUNDOGRAFIC CIA. LTDA.
                </p>
              </div>

              {/* Derecha: COTIZACIÓN y R.U.C */}
              <div className="cotizacion-section">
                <div className="cotizacion-box">
                  <span className="cotizacion-label">COTIZACIÓN</span>
                  <div className="numero-cotizacion">00000020</div>{" "}
                  {/* Se manejará con BBDD en el futuro */}
                </div>

                <div className="ruc-box">
                  <span className="ruc-label">R.U.C</span>
                  <select
                    className="ruc-select"
                    id="ruc"
                    value={selectedRuc}
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

            <div className="seccion-columnas">
              <div className="columna">
                <span className="resaltado">ESTUDIO DE DISEÑO GRAFICO</span>{" "}
                PUBLICITARIO CREATIVO, IMAGEN CORPORATIVA, PAPELERIA
                EMPRESARIAL, CAMPAÑAS PUBLICITARIAS, CON ASESORAMIENTO PARA
                CLIENTES, SERVICIO PERSONALIZADO.
              </div>
              <div className="columna">
                IMPRESION COMERCIAL EN GRAN VOLUMEN: FOLLETOS,CATALOGOS,
                REVISTAS,TRIPTICOS,LIBROS, STICKERS,PAPELERIA CORPORATIVA, CAJAS
                PARA ALIMENTOS,MEDICAMENTOS,ETC.
              </div>
              <div className="columna">
                IMPRESION DIGITAL EN BAJO VOLUMEN:
                FOLLETOS,CATALOGOS,REVISTAS,FLYRES,DIPTICOS,TTRIPTICOS,
                STICKERS,DOCUMENTOS DEL SRI,TARJETAS DE IDENTIFICADION EN PVC,
                DATA VARIABLE Y PERSONALIZACION,ETC.
              </div>
              <div className="columna">
                IMPRESION DE DOCUMENTOS AUTORIZADOS POR EL SRI,FACTURAS,NOTAS DE
                VENTA, NOTAS DE CREDITO Y DEBITO,LIQUIDACIONES DE
                COMPRA,COMPROBANTES DE RETENCION,GUIAS DE REMISION,ETC.
              </div>
              <div className="columna">
                IMPRESION DE FORMULARIOS CONTINUOS EN TODO TIPO DE ROLLOS
                TERMICOSVENTA DE PAPEL CONTINUO TODOS LOS TAMAÑOS PAPEL QUIMICO
                Y NORMAL AUTORIZADOS POR EL SRI, ROLLOS PARA CAJAS
                REGISTRADORAS, ETC.
              </div>
              <div className="columna">
                IMPRESION PROMOCIONAL BANNERS, ROLL UPS, LONAS, ROTULOS,
                SEÑALETICA,PLOTTER DE CORTE, MICROPERFORADO JARROS, ESFEROS Y
                TODO TIPO DE MATERIAL PUBLICITARIO, ETC.
              </div>
              <div className="columna">
                TERMINADOS GRAFICOS PASTA DURA, TROQUELADOS, LAMINADOS MATE Y
                BRILLANTE BARNIZA SELECTIVO UV REPUJADO Y PAN DE ORO DIGITAL
                ALTO RELIEVE AL CALOR Y AL FRIO, ETC.
              </div>
            </div>
          </div>

          {/*cuerpo de datos */}
          <div className="cuerpo-datos">
            {/* Cliente (Izquierda) - Ejecutivo de Cuenta (Derecha) */}
            <div className="fila">
              <div className="campo campo-izquierda">
                <label>Cliente:</label>
                <input type="text" placeholder="Nombre del cliente" />
              </div>

              <div className="campo campo-derecha">
                <label>Ejecutivo de Cuenta:</label>
                <input type="text" value={ejecutivo} />
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
                  <th className="col-accion">Acción</th>
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
                      </td>
                    </tr>

                    {/* Fila extra solo para la imagen */}
                    {fila.imagen && (
                      <tr>
                        <td colSpan="5" className="detalle-imagen-row">
                          <div className="detalle-imagen-container">
                            <img
                              src={fila.imagen}
                              alt="Imagen subida"
                              className="detalle-imagen"
                            />
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
                Martin Telf:2379320 E-mail:ventas@mundografic.com Cel:099661572
              </p>
              <p>
                <a href="https://www.mundografic.com" target="_blank">
                  www.mundografic.com
                </a>{" "}
                |
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

export default Cotizaciones;
