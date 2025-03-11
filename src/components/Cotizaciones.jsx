import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Cotizaciones.css";


function Cotizaciones() {
  //OBTENER FECHA
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);
  //estado para almacenar filas dinamicas
  // Estado para almacenar filas dinámicas
  const [filas, setFilas] = useState([]);

  // Función para agregar una nueva fila
  const agregarFila = () => {
    setFilas([...filas, { cantidad: "", detalle: "", unitario: "", total: "" }]);
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


  return (
    <>
    <div>
      
    <button className="btn-regresar" onClick={() => navigate('/Dashboard')}>
  ← Regresar
</button>
    </div>
    <div className="cotizaciones-container">
    <div className="encabezado-container">
      {/* Contenedor general del encabezado (Izquierda y Derecha) */}
      <div className="encabezado-content">
          
          {/* Izquierda: MUNDOGRAFIC */}
          <div className="encabezado-left">
            <span className="corporacion">CORPORACION</span>
            <h1 className="mundografic">
              MUNDO<span className="grafic">GRAFIC<span className="marca-registrada">®</span></span>
            </h1>
            <p className="subtitulo">CORPORACION MUNDO GRAFIC MUNDOGRAFIC CIA. LTDA.</p>
          </div>

          {/* Derecha: COTIZACIÓN y R.U.C */}
          <div className="cotizacion-section">
            <div className="cotizacion-box">
              <span className="cotizacion-label">COTIZACIÓN</span>
              <div className="numero-cotizacion">000000001</div> {/* Se manejará con BBDD en el futuro */}
            </div>

            <div className="ruc-box">
              <span className="ruc-label">R.U.C</span>
              <select className="ruc-select">
                <option value="1710047984001">1710047984001</option>
                <option value="1798745632001">1798745632001</option>
                <option value="1800987654001">1800987654001</option>
              </select>
            </div>
          
            </div>
            </div>  


      <div className="seccion-columnas">
          <div className="columna">
            ESTUDIO DE DISEÑO GRAFIO PUBLICITARIO CREATIVO,
            IMAGEN CORPORATIVA,
            PAPELERIA EMPRESARIAL,
            CAMPAÑAS PUBLICITARIAS,
            CON ASESORAMIENTO PARA CLIENTES,
            SERVICIO PERSONALIZADO.
          </div>
          <div className="columna">
            IMPRESION COMERCIAL
            EN GRAN VOLUMEN:
            FOLLETOS,CATALOGOS,
            REVISTAS,TRIPTICOS,LIBROS,
            STICKERS,PAPELERIA CORPORATIVA,
            CAJAS PARA ALIMENTOS,MEDICAMENTOS,ETC.
            
          </div>
          <div className="columna">
            IMPRESION DIGITAL
            EN BAJO VOLUMEN:
            FOLLETOS,CATALOGOS,REVISTAS,FLYRES,DIPTICOS,TTRIPTICOS,
            STICKERS,DOCUMENTOS DEL SRI,TARJETAS DE IDENTIFICADION EN PVC,
            DATA VARIABLE Y PERSONALIZACION,ETC.
            </div>
          <div className="columna">
            IMPRESION DE DOCUMENTOS AUTORIZADOS POR EL SRI,FACTURAS,NOTAS DE VENTA,
            NOTAS DE CREDITO Y DEBITO,LIQUIDACIONES DE COMPRA,COMPROBANTES DE RETENCION,GUIAS DE REMISION,ETC.
          </div>
          <div className="columna">
            IMPRESION DE FORMULARIOS CONTINUOS
            EN TODO TIPO DE ROLLOS TERMICOSVENTA DE PAPEL CONTINUO TODOS LOS TAMAÑOS
            PAPEL QUIMICO Y NORMAL 
            AUTORIZADOS POR EL SRI,
            ROLLOS PARA CAJAS REGISTRADORAS, ETC. 
          </div>
          <div className="columna">
            IMPRESION PROMOCIONAL
            BANNERS, ROLL UPS, LONAS,
            ROTULOS, SEÑALETICA,PLOTTER DE CORTE,
            MICROPERFORADO JARROS, ESFEROS Y TODO TIPO DE MATERIAL PUBLICITARIO, ETC.
            </div>
          <div className="columna">
            TERMINADOS GRAFICOS
            PASTA DURA, TROQUELADOS, 
            LAMINADOS MATE Y BRILLANTE
            BARNIZA SELECTIVO UV
            REPUJADO Y PAN DE ORO DIGITAL
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
      <input type="text" placeholder="Nombre del ejecutivo" />
    </div>
  </div>

  {/* Fecha (Izquierda) y Botón de Agregar Producto */}
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

    <button className="btn-agregar" onClick={agregarFila}>Agregar Producto</button>
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
                    <input type="number" value={fila.cantidad} onChange={(e) => {
                      const nuevasFilas = [...filas];
                      nuevasFilas[index].cantidad = e.target.value;
                      setFilas(nuevasFilas);
                    }} />
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
                          e.target.style.height = e.target.scrollHeight + "px"; 
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
                        onClick={() => document.getElementById(`file-upload-${index}`).click()}
                      >
                        📷
                      </button>
                       {/* 🔹 Botón para eliminar la imagen */}
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
                    <input type="number" value={fila.unitario} onChange={(e) => {
                      const nuevasFilas = [...filas];
                      nuevasFilas[index].unitario = e.target.value;
                      nuevasFilas[index].total = (parseFloat(e.target.value) * parseFloat(nuevasFilas[index].cantidad || 0)).toFixed(2);
                      setFilas(nuevasFilas);
                    }} />
                  </td>

                  <td className="col-total">
                    <input type="number" value={fila.total} readOnly />
                  </td>

                  <td className="col-accion">
                    <button className="btn-cancelar" onClick={() => eliminarFila(index)}>Cancelar</button>
                  </td>
                </tr>

                {/* Fila extra solo para la imagen */}
                {fila.imagen && (
                  <tr>
                    <td colSpan="5" className="detalle-imagen-row">
                      <div className="detalle-imagen-container">
                        <img src={fila.imagen} alt="Imagen subida" className="detalle-imagen" />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>





                
      {/* ✅ Pie de Cotización (Sticky) */}
     {/* 🔹 Pie de Cotización (Movido a un `footer`) */}
    <footer className="cotizaciones-footer">
      <div className="pie-cotizacion">
        <div className="pie-izquierda">
          <div className="campoPie"><label>Tiempo de Entrega:</label> <input type="text" /></div>
          <div className="campoPie"><label>Forma de Pago:</label> <input type="text" /></div>
          <div className="campoPie"><label>Validez de Proforma:</label> <input type="text" /></div>
          <div className="campoPie"><label>Observaciones:</label> <input type="text" /></div>
        </div>
        <div className="pie-derecha">
          <div className="campoPie"><label>Subtotal:</label> <span>${subtotal.toFixed(2)}</span></div>
          <div className="campoPie"><label>IVA 15%:</label> <span>${iva.toFixed(2)}</span></div>
          <div className="campoPie"><label>Descuento:</label> <input type="number" /></div>
          <div className="campoPie total"><label>Total:</label> <span>${total.toFixed(2)}</span></div>
          <button className="btn-imprimir" onClick={() => window.print()}>Imprimir</button>
        </div>
      </div>
    </footer>
      
    </div>
    </>
  );
}

export default Cotizaciones;