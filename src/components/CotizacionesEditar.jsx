import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // ❌ 'data' no es un hook válido en react-router-dom
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/Cotizaciones.css";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { useParams } from "react-router-dom";


function CotizacionesEditar() {
///////////*aqui se maneja los datos en comunicacion con la api ////////*/
  const { id } = useParams();
    // ✅ Esta función es esencial
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    };
  
  useEffect(() => {
    console.log("ID recibido en CotizacionesEditar:", id); // ✅ Aquí verificas si llega correctamente
  }, [id]);
  const [cotizacion, setCotizacion] = useState(null); // Estado para almacenar los datos de la cotización
  const [formData, setFormData] = useState({
    numero_cotizacion: "",
    fecha: "",
    estado: "",
  });

  
  // Obtener la cotización específica al cargar el componente
  useEffect(() => {
    const obtenerCotizacion = async () => {
      try {
        // Realizamos la solicitud GET para obtener la cotización con el id
        const response = await fetch(`${apiUrl}/api/cotizacionesEditar/${id}`);
        const data = await response.json();
        
        // Si la cotización existe, la guardamos en el estado
        if (data) {
          setCotizacion(data); // Guardamos los datos de la cotización en el estado
          setFormData({
            numero_cotizacion: data.numero_cotizacion,
            fecha: data.fecha,
            estado: data.estado,
          });
        } else {
          alert("Cotización no encontrada");
        }
      } catch (error) {
        console.error("Error al obtener la cotización:", error);
      }
    };

    obtenerCotizacion();
  }, [id]); // Solo se ejecutará cuando el id cambie



  


/////////////////*////////////////////////*/
  const apiUrl = import.meta.env.VITE_API_URL;
  const [filas, setFilas] = useState([]);
   // Función para agregar una nueva fila
   const agregarFila = () => {
    setFilas([
      ...filas,
      { cantidad: "", detalle: "", unitario: "", total: "" },
    ]);
  };



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

    

    ///////////////////guardar en formato pdf ////////////////////
    
    const downloadPDF = async () => {
      const input = document.getElementById('cotizaciones-container');
    
      // Crear un clon profundo del contenedor
      const pdfContent = input.cloneNode(true);
    
      // Procesar específicamente los textareas y asegurarnos de que se visualicen bien
      pdfContent.querySelectorAll('textarea').forEach(textarea => {
        const span = document.createElement('span');
        span.textContent = textarea.value;
        span.style.whiteSpace = 'pre-wrap'; // Asegurar que respete los saltos de línea
        span.style.display = 'block';
        span.style.wordBreak = 'break-word'; // Añadir quiebre de palabras
        textarea.parentNode.replaceChild(span, textarea);
      });
    
      // Procesar específicamente el select de RUC
      pdfContent.querySelectorAll('select').forEach(select => {
        const span = document.createElement('span');
        // Usamos el valor del estado selectedRuc
        span.textContent = selectedRuc.ruc || 'R.U.C no seleccionado'; // Si no hay RUC seleccionado
        span.style.whiteSpace = 'pre-wrap';
        span.style.display = 'block'; 
        span.style.wordBreak = 'break-word'; 
        select.parentNode.replaceChild(span, select);
      });
    
      // Quitar bordes de los inputs en el clon
      pdfContent.querySelectorAll('input').forEach(input => {
        input.style.border = 'none';
        input.style.outline = 'none';
        input.style.background = 'transparent';
      });
    
      // Ocultar elementos no deseados
      pdfContent.querySelectorAll('.col-accion, .btn-cancelar, .btn-eliminar-imagen, .btn-insertar-imagen').forEach(el => {
        el.style.display = 'none';
      });
    
      try {
        // Añadir el clon temporalmente al documento
        document.body.appendChild(pdfContent);
        pdfContent.style.position = 'absolute';
        pdfContent.style.left = '-9999px';
        pdfContent.style.top = '-9999px';
    
        const canvas = await html2canvas(pdfContent, {
          scale: 3,
          useCORS: true,
          logging: false,
          allowTaint: true,
          scrollX: 0,
          scrollY: -window.scrollY,
          width: pdfContent.scrollWidth,
          height: pdfContent.scrollHeight,
          backgroundColor: '#FFFFFF',
          letterRendering: true,
          wordwrap: true
        });
    
        // Remover el clon del documento
        document.body.removeChild(pdfContent);
    
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
    
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
    
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    
        let heightLeft = imgHeight;
        let position = 0;
    
        const moveRight = 2; // Desplazamiento pequeño
    
        // Agregar la imagen al PDF con un pequeño desplazamiento a la derecha
        pdf.addImage(imgData, 'JPEG', moveRight, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
    
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', moveRight, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
    
        pdf.save(`Cotizacion_${new Date().toISOString().slice(0, 10)}.pdf`);
    
      } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Hubo un problema al generar el PDF');
      }
    };
    
  return (
    <>
        <div className="hoja-general">
          <div className="btnadministracion">
            <button
              className="btn-regresar"
              onClick={() => navigate("/CotizacionesMenu")}
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

            <button className="btn-regresar" onClick={handleGuardarTodo}>Guardar BBDD</button>

            <button className="btn-agregar" onClick={agregarFila}>
              Agregar Producto
            </button>

            <button className="btn-regresar"onClick={downloadPDF} >Guardar como PDF</button>
           
         
          </div>

          <div className="cotizaciones-container" id="cotizaciones-container">
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
                    <div className="numero-cotizacion"> {formData.numero_cotizacion}
       </div>
                    {/* Se manejará con BBDD en el futuro */}

                    {/* Se manejará con BBDD en el futuro */}
                  </div>

                  <div className="ruc-box">
                    <span className="ruc-label">R.U.C</span>
                    <select
                      className="ruc-select"
                      id="ruc"
                  
                    >
                      <option value="">Seleccione un ruc</option>
               
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
            <div className="campo campo-izquierda"  style={{ position: 'relative' }}>
  <label htmlFor="cliente">Cliente:</label>
  <input
    id="cliente"
    type="text"
 
  />
</div>



              <div className="campo campo-derecha">
                <label>Ejecutivo de Cuenta:</label>
                <input type="text" />
              </div>
            </div>
            <div className="fila">
              <div className="fecha-container">
                <div className="campo">
                  <label>Fecha:</label>
                  <input
  type="date"
  value={formData.fecha ? formData.fecha.substring(0, 10) : ''}
  onChange={handleChange}
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

export default CotizacionesEditar;
