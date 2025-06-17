const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verificar la conexión del transporter
transporter.verify(function(error, success) {
  if (error) {
    console.log("Error al configurar el correo:", error);
  } else {
    console.log("Servidor de correo listo para enviar mensajes");
  }
});

// Función para generar el HTML de la cotización
const generarHTMLCotizacion = async (cotizacion, detalles) => {
  // Establecer la URL base para las imágenes
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  
  // Función para convertir imagen a base64
  const getBase64Image = async (imagePath) => {
    try {
      if (!imagePath) {
        console.log('No hay ruta de imagen proporcionada');
        return null;
      }

      // Limpiar la ruta de la imagen (eliminar /storage/uploads/ si está presente)
      const cleanPath = imagePath.replace(/^\/storage\/uploads\//, '');
      
      // Construir la ruta completa
      const fullPath = path.join(__dirname, '../../storage/uploads', cleanPath);
      
      console.log('Intentando leer imagen desde:', fullPath);
      
      // Verificar si el archivo existe
      try {
        await fs.access(fullPath);
      } catch (error) {
        console.error('El archivo no existe:', fullPath);
        return null;
      }

      const imageBuffer = await fs.readFile(fullPath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = imagePath.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error('Error al convertir imagen a base64:', error);
      return null;
    }
  };

  // Procesar las imágenes de los detalles
  const detallesConImagenes = await Promise.all(detalles.map(async (d) => {
    if (d.imagen_ruta) {
      const base64Image = await getBase64Image(d.imagen_ruta);
      return { ...d, base64Image };
    }
    return d;
  }));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
      <style>
        /* Estilos generales */
        html {
          height: 100%;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          width: 210mm;
          height: 100%;
          position: relative;
        }
        
        /* Contenedor principal */
        .cotizaciones-container {
          width: 100%;
          max-width: 210mm;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 0mm;
          background-color: white;
          box-sizing: border-box;
          position: relative;
        }

        /* Contenido principal para que crezca y empuje el footer */
        .contenido-principal {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Encabezado */
        .encabezado-container {
          margin-bottom: 10px;
        }

        .encabezado-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        /* Logo y título */
        .encabezado-left {
          flex: 1;
          position: relative;
          line-height: 0.9;
        }

        .logo-wrapper {
          display: inline-block;
          position: relative;
        }

        .corporacion {
          position: absolute;
          bottom: 85%;
          right: 0;
          text-align: right;
          font-size: 6.5px;
          color: #999;
          letter-spacing: 3px;
          margin-bottom: 0;
          font-weight: 300;
          width: 180px;
          white-space: nowrap;
        }

        .logo-container {
          position: relative;
          display: inline-block;
        }

        .mundo {
          font-size: 32px;
          font-weight: 1000;
          color: #000;
          margin: 0;
          letter-spacing: -1px;
          line-height: 1;
          display: inline-block;
        }

        .grafic {
          font-size: 32px;
          color: #ff0000;
          font-weight: 100;
          margin-left: -6px;
          display: inline-block;
          position: relative;
          font-family: Arial, sans-serif;
          letter-spacing: 0.5px;
          -webkit-text-stroke: 0.2px #ff0000;
          text-stroke: 0.2px #ff0000;
          font-stretch: ultra-condensed;
        }

        .marca-registrada {
          font-size: 5px;
          position: relative;
          display: inline-block;
          top: 2px;
          margin-left: 1px;
          color: #ff0000;
          font-weight: normal;
        }

        .subtitulo {
          font-size: 8px;
          color: #333;
          margin: 0;
          margin-top: -1px;
          line-height: 1;
        }

        /* Sección de cotización */
        .cotizacion-section {
          text-align: right;
          min-width: 200px;
        }

        .cotizacion-box {
          font-size: 18px;
          margin-bottom: 2px;
          letter-spacing: 0.5px;
        }

        .numero-cotizacion {
          color: #ff0000;
          margin-left: 5px;
        }

        .ruc-box {
          font-size: 11px;
          color: #666;
        }

        /* Sección de servicios */
        .seccion-servicios {
          display: flex;
          justify-content: space-between;
          padding: 0;
          margin-bottom: 10px;
        }

        .servicio {
          flex: 1;
          font-size: 6px;
          line-height: 1.2;
          padding: 0 2px;
          border-right: 1px solid #999;
        }

        .servicio:last-child {
          border-right: none;
        }

        .servicio-titulo {
          color: #ff0000;
          font-weight: bold;
          margin-bottom: 2px;
          text-transform: uppercase;
          white-space: nowrap;
          font-size: 6px;
        }

        .servicio-texto {
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.2;
          font-size: 6px;
        }

        .intersection-overlay {
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: #ffffff;
          right: 84px;
          top: 45%;
          transform: translateY(-50%);
          mix-blend-mode: lighten;
          opacity: 0.6;
          border-radius: 50%;
        }

        /* Tabla de cotización */
        .tabla-container {
          position: relative;
          margin-top: 5px;
          margin-bottom: 0;
          flex: 1;
        }

        .tabla-cotizacion {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          position: relative;
        }

        /* Líneas verticales internas de la tabla */
        .lineas-verticales {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .linea-vertical {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #999;
        }

        .linea-vertical-1 {
          left: 10%;
        }

        .linea-vertical-2 {
          left: 65%;
        }

        .linea-vertical-3 {
          left: 82.5%;
        }

        .tabla-cotizacion th {
          background-color: #f2f2f2;
          border-bottom: 1px solid #999;
          padding: 8px;
          font-size: 11px;
          font-weight: bold;
          text-align: left;
          color: #666;
          position: relative;
        }

        .tabla-cotizacion td {
          padding: 8px;
          font-size: 11px;
          border: none;
          position: relative;
          background-color: transparent;
        }

        .tabla-cotizacion .col-cant { 
          width: 10%; 
          text-align: center;
        }
        .tabla-cotizacion .col-detalle { 
          width: 55%; 
          text-align: left;
        }
        .tabla-cotizacion .col-unitario { 
          width: 17.5%; 
          text-align: right;
        }
        .tabla-cotizacion .col-total { 
          width: 17.5%; 
          text-align: right;
        }

        /* Ajustes para las celdas de datos */
        .tabla-cotizacion td.col-cant {
          text-align: center;
        }
        .tabla-cotizacion td.col-detalle {
          text-align: left;
          padding-left: 15px;
        }
        .tabla-cotizacion td.col-unitario,
        .tabla-cotizacion td.col-total {
          text-align: right;
          padding-right: 15px;
        }

        /* Footer */
        .cotizaciones-footer {
          left: 15mm;
          right: 15mm;
        }

        .pie-cotizacion {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          padding: 10px 0;
          border-top: 1px solid #ccc;
          background-color: white;
        }

        .pie-izquierda {
          width: 50%;
        }

        .pie-derecha {
          width: 30%;
          text-align: right;
        }

        .campoPie {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 11px;
          color: #666;
        }

        .campoPie label {
          font-weight: bold;
          color: #666;
          min-width: 140px;
          margin-right: 10px;
        }

        .campoPie span, .campoPie input {
          color: #666;
        }

        .pie-derecha .campoPie {
          justify-content: flex-end;
        }

        .pie-derecha .campoPie label {
          text-align: right;
          margin-right: 15px;
        }

        .pie-derecha .campoPie span {
          min-width: 80px;
          text-align: right;
        }

        .pie-pagina {
          text-align: center;
          font-size: 9px;
          color: #666;
          border-top: none;
          margin-top: 10px;
        }

        .pie-pagina p {
          margin: 5px 0;
        }

        .redes-sociales {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 10px;
        }

        .redes-sociales a {
          display: flex;
          align-items: center;
          color: #666;
          text-decoration: none;
          font-size: 11px;
          gap: 5px;
        }

        .redes-sociales i {
          font-size: 14px;
          color: #666;
        }

        .website-link {
          color: #666;
          text-decoration: none;
          font-weight: bold;
        }

        /* Datos del cliente */
        .cuerpo-datos {
          margin: 10px 0 5px 0;
          padding: 5px 0;
        }

        .datos-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .datos-izquierda {
          flex: 1;
        }

        .datos-derecha {
          text-align: right;
          min-width: 300px;
        }

        .campo-datos {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          color: #333;
        }

        .campo-datos label {
          min-width: 80px;
          font-weight: normal;
          color: #333;
        }

        .campo-datos span {
          margin-left: 10px;
          font-weight: normal;
        }

        .campo-datos.fecha {
          margin-left: 0;
          display: flex;
          align-items: center;
        }

        .campo-datos.fecha label {
          min-width: 80px;
        }

        .campo-datos.fecha .contenido-fecha {
          display: flex;
          align-items: center;
          margin-left: 10px;
        }

        .campo-datos.fecha .ciudad {
          margin-right: 10px;
        }

        /* Estilos para las imágenes */
        .imagen-producto {
          max-width: 300px;
          max-height: 200px;
          margin: 10px 0;
          display: block;
          object-fit: contain;
        }

        .detalle-con-imagen {
          margin-bottom: 20px;
        }

        .detalle-texto {
          margin-bottom: 10px;
        }

        .imagen-container {
          margin-top: 10px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="cotizaciones-container">
        <div class="contenido-principal">
          <div class="encabezado-container">
            <div class="encabezado-content">
              <div class="encabezado-left">
                <div class="logo-wrapper">
                  <div class="corporacion">C O R P O R A C I O N</div>
                  <div class="logo-container">
                    <div class="intersection-overlay"></div>
                    <h1 class="mundo">
                      MUNDO<span class="grafic">GRAFIC<span class="marca-registrada">®</span></span>
                    </h1>
                  </div>
                </div>
                <p class="subtitulo">CORPORACION MUNDOGRAFIC CIA.LTA</p>
              </div>
              
              <div class="cotizacion-section">
                <div class="cotizacion-box">
                  <span>COTIZACIÓN</span> <span class="numero-cotizacion">${String(cotizacion.numero_cotizacion).padStart(9, "0")}</span>
                </div>
                <div class="ruc-box">
                  R.U.C.:<span class="ruc-numero">${cotizacion.ruc}</span>
                </div>
              </div>
            </div>

            <div class="seccion-servicios">
              <div class="servicio">
                <div class="servicio-titulo">ESTUDIO DE DISEÑO GRÁFICO</div>
                <div class="servicio-texto">
                  PUBLICITARIO CREATIVO, IMAGEN CORPORATIVA, PAPELERIA EMPRESARIAL, CAMPAÑAS PUBLICITARIAS, CON ASESORAMIENTO PARA CLIENTES, SERVICIO PERSONALIZADO.
                </div>
              </div>
              <div class="servicio">
                <div class="servicio-titulo">IMPRESIÓN COMERCIAL</div>
                <div class="servicio-texto">
                  EN GRAN VOLUMEN: FOLLETOS, CATALOGOS, REVISTAS, FLYERS, DIPTICOS, TRIPTICOS, LIBROS, STICKERS, PAPELERIA CORPORATIVA, CAJAS PARA ALIMENTOS, MEDICAMENTOS, ETC.
                </div>
              </div>
              <div class="servicio">
                <div class="servicio-titulo">IMPRESIÓN DIGITAL</div>
                <div class="servicio-texto">
                  EN BAJO VOLUMEN: FOLLETOS, CATALOGOS, REVISTAS, FLYERS, DIPTICOS, TRIPTICOS, STICKERS, DOCUMENTOS DEL SRI, TARJETAS DE IDENTIFICACION EN PVC, DATA VARIABLE Y PERSONALIZACION, ETC.
                </div>
              </div>
              <div class="servicio">
                <div class="servicio-titulo">IMPRESIÓN DE DOCUMENTOS</div>
                <div class="servicio-texto">
                  AUTORIZADOS POR EL SRI, FACTURAS, NOTAS DE VENTA, NOTAS DE CREDITO Y DEBITO, LIQUIDACIONES DE COMPRA, COMPROBANTES DE RETENCION, GUIAS DE REMISION, ETC.
                </div>
              </div>
              <div class="servicio">
                <div class="servicio-titulo">IMPRESIÓN DE FORMULARIOS</div>
                <div class="servicio-texto">
                  CONTINUOS EN TODO TIPO DE ROLLOS TERMICOS, VENTA DE PAPEL CONTINUO TODOS LOS TAMAÑOS, PAPEL QUIMICO Y NORMAL AUTORIZADOS POR EL SRI, ROLLOS PARA CAJAS REGISTRADORAS, ETC.
                </div>
              </div>
              <div class="servicio">
                <div class="servicio-titulo">IMPRESIÓN PROMOCIONAL</div>
                <div class="servicio-texto">
                  BANNERS, ROLL UPS, LONAS, ROTULOS, SEÑALETICA, PLOTTER DE CORTE, MICROPERFORADO, JARROS, ESFEROS Y TODO TIPO DE MATERIAL PUBLICITARIO, ETC.
                </div>
              </div>
              <div class="servicio">
                <div class="servicio-titulo">TERMINADOS GRÁFICOS</div>
                <div class="servicio-texto">
                  PASTA DURA, TROQUELADOS, LAMINADOS MATE Y BRILLANTE, BARNIZ SELECTIVO UV, REPUJADO Y PAN DE ORO, METALIZADO ALTO RELIEVE AL CALOR Y AL FRIO, ETC.
                </div>
              </div>
            </div>
          </div>

          <div class="cuerpo-datos">
            <div class="datos-container">
              <div class="datos-izquierda">
                <div class="campo-datos">
                  <label>Cliente:</label>
                  <span>${cotizacion.nombre_cliente}</span>
                </div>
                <div class="campo-datos fecha">
                  <label>Fecha:</label>
                  <div class="contenido-fecha">
                    <span class="ciudad">QUITO</span>
                    <span>${new Date(cotizacion.fecha).toLocaleDateString('es-EC', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    }).replace(/\//g, '/')}</span>
                  </div>
                </div>
              </div>
              <div class="datos-derecha">
                <div class="campo-datos">
                  <label>Ejecutivo de Cuenta:</label>
                  <span>${cotizacion.nombre_ejecutivo || 'No asignado'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="tabla-container">
            <div class="lineas-verticales">
              <div class="linea-vertical linea-vertical-1"></div>
              <div class="linea-vertical linea-vertical-2"></div>
              <div class="linea-vertical linea-vertical-3"></div>
            </div>
            <table class="tabla-cotizacion">
              <thead>
                <tr>
                  <th class="col-cant">CANT</th>
                  <th class="col-detalle">DETALLE</th>
                  <th class="col-unitario">V. UNIT.</th>
                  <th class="col-total">V. TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${detallesConImagenes.map(d => `
                  <tr>
                    <td class="col-cant">${d.cantidad}</td>
                    <td class="col-detalle">
                      <div class="detalle-con-imagen">
                        <div class="detalle-texto">${d.detalle}</div>
                        ${d.base64Image ? `
                          <div class="imagen-container">
                            <img 
                              src="${d.base64Image}" 
                              alt="Imagen del producto" 
                              class="imagen-producto"
                            />
                          </div>
                        ` : ''}
                      </div>
                    </td>
                    <td class="col-unitario">$${Number(d.valor_unitario).toFixed(2)}</td>
                    <td class="col-total">$${Number(d.valor_total).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <footer class="cotizaciones-footer">
          <div class="pie-cotizacion">
            <div class="pie-izquierda">
              <div class="campoPie">
                <label>Tiempo De Entrega:</label>
                <span>${cotizacion.tiempo_entrega || 'No especificado'}</span>
              </div>
              <div class="campoPie">
                <label>Forma De Pago:</label>
                <span>${cotizacion.forma_pago || 'No especificado'}</span>
              </div>
              <div class="campoPie">
                <label>Validez Proforma:</label>
                <span>${cotizacion.validez_proforma || 'No especificado'}</span>
              </div>
              <div class="campoPie">
                <label>Observaciones:</label>
                <span>${cotizacion.observaciones || 'Sin observaciones'}</span>
              </div>
            </div>
            <div class="pie-derecha">
              <div class="campoPie">
                <label>SUBTOTAL</label>
                <span>$${Number(cotizacion.subtotal).toFixed(2)}</span>
              </div>
              <div class="campoPie">
                <label>IVA 15%</label>
                <span>$${Number(cotizacion.iva).toFixed(2)}</span>
              </div>
              <div class="campoPie">
                <label>DESCUENTO</label>
                <span>$${Number(cotizacion.descuento).toFixed(2)}</span>
              </div>
              <div class="campoPie">
                <label>TOTAL</label>
                <span>$${Number(cotizacion.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="pie-pagina">
            <p>
              Quito: Pasaje San Luis N12-87 y Antonio Ante, Edif. Apolo 1 Telefax.: 2589134 - Tumbaco: Norberto Salazar E7-224 y Pasaje San Martin Telf.: 2379320 E-mail: ventas@mundografic.com Cel.:099661572
            </p>
            <div class="redes-sociales">
              <a href="https://www.mundografic.com" class="website-link">www.mundografic.com</a>
              <a href="https://instagram.com/mundografic">
                <i class="fab fa-instagram"></i>
                /mundografic
              </a>
              <a href="https://youtube.com/mundografic">
                <i class="fab fa-youtube"></i>
                /mundografic
              </a>
              <a href="https://facebook.com/mundografic">
                <i class="fab fa-facebook"></i>
                /mundografic
              </a>
              <a href="https://twitter.com/MundoGraficEC">
                <i class="fab fa-twitter"></i>
                @MundoGraficEC
              </a>
            </div>
          </div>
        </footer>
      </div>
    </body>
    </html>
  `;
};

// Función para generar el PDF
const generarPDF = async (cotizacion, detalles) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Generar el HTML con las imágenes en base64
    const htmlContent = await generarHTMLCotizacion(cotizacion, detalles);
    
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const CotizacionDatos = (client) => {
  // Ruta para crear una cotización y guardar todos los datos del cliente
  router.post("/", async (req, res) => {
    const { 
      fecha, 
      subtotal, 
      iva, 
      descuento, 
      total, 
      ruc_id, 
      cliente_id, 
      ejecutivo_id,
      tiempo_entrega,
      forma_pago,
      validez_proforma,
      observaciones
    } = req.body;
    const estado = "pendiente";

    try {
      // 🔹 1️⃣ Obtener el último número de cotización
      const ultimoNumeroQuery = "SELECT numero_cotizacion FROM cotizaciones ORDER BY numero_cotizacion DESC LIMIT 1";
      const ultimoNumeroResult = await client.query(ultimoNumeroQuery);
      
      // 🔹 2️⃣ Determinar el nuevo número de cotización
      const nuevoNumeroCotizacion = ultimoNumeroResult.rows.length > 0 
        ? ultimoNumeroResult.rows[0].numero_cotizacion + 1 
        : 1; // Si no hay registros, comenzamos en 1
      
      // 🔹 3️⃣ Insertar la nueva cotización con el número generado
      const insertQuery = `
        INSERT INTO cotizaciones (
          numero_cotizacion, 
          cliente_id, 
          fecha, 
          subtotal, 
          iva, 
          descuento, 
          total, 
          estado, 
          ruc_id,
          ejecutivo_id,
          tiempo_entrega,
          forma_pago,
          validez_proforma,
          observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        nuevoNumeroCotizacion,
        cliente_id,
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        estado,
        ruc_id,
        ejecutivo_id,
        tiempo_entrega,
        forma_pago,
        validez_proforma,
        observaciones
      ]);

      res.json(result.rows[0]); // Respuesta con la nueva cotización creada
    } catch (error) {
      console.error("Error al insertar cotización:", error);
      res.status(500).json({ error: "Error al insertar cotización" });
    }
  });

  router.get("/ultima", async (req, res) => {
    try {
      const ultimoNumeroQuery = "SELECT numero_cotizacion FROM cotizaciones ORDER BY numero_cotizacion DESC LIMIT 1";
      const ultimoNumeroResult = await client.query(ultimoNumeroQuery);
      
      const ultimoNumeroCotizacion = ultimoNumeroResult.rows[0]?.numero_cotizacion || 0;
    
      // 🔹 Generar el nuevo número con 9 dígitos
      const nuevoNumeroCotizacion = (ultimoNumeroCotizacion + 1).toString().padStart(9, "0");
  
      // ✅ Enviar el número formateado con ceros al frontend
      res.json({ numero_cotizacion: nuevoNumeroCotizacion });
  
    } catch (error) {
      console.error("Error al obtener la última cotización:", error);
      res.status(500).json({ error: "Error al obtener la última cotización" });
    }
  });

  // Obtener todas las cotizaciones con filtros simplificados
  router.get("/todas", async (req, res) => {
    console.log("Recibiendo petición en /todas");
    const { busqueda, fechaDesde, fechaHasta, limite, ordenar } = req.query;
    console.log("Parámetros recibidos:", { busqueda, fechaDesde, fechaHasta, limite, ordenar });
    
    try {
      let query = `
        SELECT 
          c.id,
          c.numero_cotizacion,
          cl.nombre_cliente,
          c.fecha,
          c.estado,
          c.total,
          r.ruc,
          r.descripcion as ruc_descripcion,
          e.nombre as nombre_ejecutivo
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        LEFT JOIN ejecutivos e ON c.ejecutivo_id = e.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 1;

      if (busqueda) {
        query += ` AND (
          CAST(c.numero_cotizacion AS TEXT) ILIKE $${paramCount} 
          OR cl.nombre_cliente ILIKE $${paramCount}
        )`;
        params.push(`%${busqueda}%`);
        paramCount++;
      }

      if (fechaDesde) {
        query += ` AND DATE(c.fecha) >= DATE($${paramCount})`;
        params.push(fechaDesde);
        paramCount++;
      }

      if (fechaHasta) {
        query += ` AND DATE(c.fecha) <= DATE($${paramCount})`;
        params.push(fechaHasta);
        paramCount++;
      }

      // Ordenar por número de cotización descendente (más recientes primero)
      query += ` ORDER BY c.numero_cotizacion DESC`;

      // Aplicar límite si no hay filtros de búsqueda
      if (!busqueda && !fechaDesde && !fechaHasta) {
        query += ` LIMIT ${limite || 15}`;
      }

      console.log("Query a ejecutar:", query);
      console.log("Parámetros:", params);

      const result = await client.query(query, params);
      console.log("Resultados obtenidos:", result.rows.length);
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener cotizaciones:", error);
      res.status(500).json({ error: "Error al obtener las cotizaciones: " + error.message });
    }
  });

  ///*Cotizaciones editar*////////
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      const query = "SELECT * FROM cotizaciones WHERE id = $1";
      const result = await client.query(query, [id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al obtener cotización por ID:", error);
      res.status(500).json({ error: "Error al obtener cotización por ID" });
    }
  });

  // Actualizar una cotización existente
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { 
      fecha, 
      subtotal, 
      iva, 
      descuento, 
      total, 
      ruc_id, 
      cliente_id,
      tiempo_entrega,
      forma_pago,
      validez_proforma,
      observaciones
    } = req.body;

    try {
      const query = `
        UPDATE cotizaciones 
        SET fecha = $1, 
            subtotal = $2, 
            iva = $3, 
            descuento = $4, 
            total = $5, 
            ruc_id = $6, 
            cliente_id = $7,
            tiempo_entrega = $8,
            forma_pago = $9,
            validez_proforma = $10,
            observaciones = $11
        WHERE id = $12
        RETURNING *
      `;

      const result = await client.query(query, [
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        ruc_id,
        cliente_id,
        tiempo_entrega,
        forma_pago,
        validez_proforma,
        observaciones,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error al actualizar la cotización:", error);
      res.status(500).json({ error: "Error al actualizar la cotización" });
    }
  });

  // Ruta para generar PDF de una cotización
  router.get("/:id/pdf", async (req, res) => {
    const { id } = req.params;
    
    try {
      console.log('Iniciando generación de PDF para cotización:', id);

      // 1. Obtener los datos de la cotización
      const cotizacionQuery = `
        SELECT 
          c.id,
          c.numero_cotizacion,
          c.fecha,
          c.subtotal,
          c.iva,
          c.descuento,
          c.total,
          cl.nombre_cliente,
          e.nombre AS nombre_ejecutivo,
          r.ruc,
          r.descripcion AS ruc_descripcion,
          c.tiempo_entrega,
          c.forma_pago,
          c.validez_proforma,
          c.observaciones
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        LEFT JOIN ejecutivos e ON c.ejecutivo_id = e.id
        WHERE c.id = $1
      `;
      
      const cotizacionResult = await client.query(cotizacionQuery, [id]);
      if (cotizacionResult.rows.length === 0) {
        console.log('No se encontró la cotización');
        return res.status(404).json({ error: "Cotización no encontrada" });
      }
      const cotizacion = cotizacionResult.rows[0];
      console.log('Datos de cotización obtenidos:', cotizacion);

      // 2. Obtener los detalles de la cotización
      const detallesQuery = `
        SELECT cantidad, detalle, valor_unitario, valor_total, imagen_ruta
        FROM detalle_cotizacion
        WHERE cotizacion_id = $1
        ORDER BY id ASC
      `;
      console.log('Obteniendo detalles de la cotización...');
      const detallesResult = await client.query(detallesQuery, [id]);
      const detalles = detallesResult.rows;
      console.log('Detalles obtenidos:', detalles);

      // 3. Generar el PDF
      const pdfBuffer = await generarPDF(cotizacion, detalles);
      
      // 4. Enviar el PDF al cliente
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${cotizacion.numero_cotizacion}.pdf`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      res.status(500).json({ error: 'Error al generar el PDF: ' + error.message });
    }
  });

  // Ruta para enviar correo con PDF adjunto
  router.post('/:id/enviar-correo', async (req, res) => {
    try {
      const { id } = req.params;
      const { email, asunto, mensaje } = req.body;

      // Validar que el correo fue proporcionado
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico es requerido'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'El formato del correo electrónico no es válido'
        });
      }

      // Obtener información de la cotización
      const cotizacionQuery = `
        SELECT 
          c.id,
          c.numero_cotizacion,
          c.fecha,
          c.subtotal,
          c.iva,
          c.descuento,
          c.total,
          cl.nombre_cliente,
          e.nombre AS nombre_ejecutivo,
          r.ruc,
          r.descripcion AS ruc_descripcion,
          c.tiempo_entrega,
          c.forma_pago,
          c.validez_proforma,
          c.observaciones
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        LEFT JOIN ejecutivos e ON c.ejecutivo_id = e.id
        WHERE c.id = $1
      `;
      
      const cotizacionResult = await client.query(cotizacionQuery, [id]);
      
      if (cotizacionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      const cotizacion = cotizacionResult.rows[0];

      // Obtener los detalles de la cotización
      const detallesQuery = `
        SELECT cantidad, detalle, valor_unitario, valor_total, imagen_ruta
        FROM detalle_cotizacion
        WHERE cotizacion_id = $1
        ORDER BY id ASC
      `;
      const detallesResult = await client.query(detallesQuery, [id]);
      const detalles = detallesResult.rows;

      // Crear directorio para PDFs si no existe
      const pdfDir = path.join(__dirname, '../../storage/pdfs');
      await fs.mkdir(pdfDir, { recursive: true });

      // Generar nombre único para el PDF
      const timestamp = new Date().getTime();
      const fileName = `cotizacion-${cotizacion.numero_cotizacion}-${timestamp}.pdf`;
      const pdfPath = path.join(pdfDir, fileName);

      // Generar el PDF
      const pdfBuffer = await generarPDF(cotizacion, detalles);
      
      // Guardar el PDF
      await fs.writeFile(pdfPath, pdfBuffer);

      // Configurar el correo
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: asunto || `Cotización MUNDOGRAFIC #${cotizacion.numero_cotizacion}`,
        text: mensaje || `Estimado/a ${cotizacion.nombre_cliente},\n\n` +
              `Adjunto encontrará la cotización #${cotizacion.numero_cotizacion} solicitada.\n\n` +
              `Saludos cordiales,\n` +
              `Equipo MUNDOGRAFIC`,
        attachments: [{
          filename: fileName,
          path: pdfPath
        }]
      };

      // Enviar el correo con reintentos
      const maxRetries = 3;
      let retryCount = 0;
      let lastError = null;

      while (retryCount < maxRetries) {
        try {
          await transporter.sendMail(mailOptions);
          break;
        } catch (error) {
          lastError = error;
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (retryCount === maxRetries) {
        throw lastError;
      }

      // Limpiar el archivo PDF después de enviarlo
      setTimeout(async () => {
        try {
          await fs.unlink(pdfPath);
          console.log('Archivo PDF temporal eliminado');
        } catch (error) {
          console.error('Error al eliminar archivo temporal:', error);
        }
      }, 1000);

      // Responder al cliente
      res.json({
        success: true,
        message: 'Correo enviado exitosamente'
      });

    } catch (error) {
      console.error('Error al enviar correo:', error);
      
      // Manejar errores específicos
      if (error.code === 'EAUTH') {
        return res.status(500).json({
          success: false,
          message: 'Error de autenticación del servidor de correo. Verifique las credenciales.'
        });
      }
      
      if (error.code === 'ESOCKET') {
        return res.status(500).json({
          success: false,
          message: 'Error de conexión con el servidor de correo.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al enviar el correo: ' + error.message
      });
    }
  });

  return router;
};

module.exports = CotizacionDatos;
