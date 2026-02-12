import express from "express";
const router = express.Router();
import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import authRequired from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";
require('dotenv').config();

// Sistema de emails personalizados por ejecutivo
// Cada ejecutivo envía desde su propia cuenta Gmail

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

      console.log('Procesando imagen:', imagePath);
      
      // Limpiar la ruta de la imagen (eliminar /uploads/ si está presente)
      const cleanPath = imagePath.replace(/^\/uploads\//, '');
      
      // Construir la ruta completa usando process.cwd() para obtener la raíz del proyecto
      const fullPath = path.join(process.cwd(), 'storage', 'uploads', cleanPath);
      
      console.log('Intentando leer imagen desde:', fullPath);
      
      // Verificar si el archivo existe
      try {
        await fs.access(fullPath);
        console.log('✅ Archivo encontrado:', fullPath);
      } catch (error: any) {
        console.error('❌ El archivo no existe:', fullPath);
        return null;
      }

      const imageBuffer = await fs.readFile(fullPath);
      console.log('✅ Imagen leída, tamaño:', imageBuffer.length, 'bytes');
      
      const base64Image = imageBuffer.toString('base64');
      
      // Determinar el tipo MIME basado en la extensión del archivo
      const extension = path.extname(imagePath).toLowerCase();
      let mimeType = 'image/jpeg'; // por defecto
      
      if (extension === '.png') mimeType = 'image/png';
      else if (extension === '.gif') mimeType = 'image/gif';
      else if (extension === '.webp') mimeType = 'image/webp';
      else if (extension === '.jpg' || extension === '.jpeg') mimeType = 'image/jpeg';
      
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      console.log('✅ Imagen convertida a base64, tipo:', mimeType);
      
      return dataUrl;
    } catch (error: any) {
      console.error('❌ Error al convertir imagen a base64:', error);
      return null;
    }
  };

  // Procesar las imágenes de los detalles - ahora soporta múltiples imágenes por detalle
  const detallesConImagenes = await Promise.all(detalles.map(async (d) => {
    console.log('🔍 Procesando detalle:', d.detalle);
    
    // Procesar todas las imágenes del detalle
    if (d.imagenes && Array.isArray(d.imagenes) && d.imagenes.length > 0) {
      console.log(`📸 Detalle tiene ${d.imagenes.length} imagen(es), procesando...`);
      
      const imagenesBase64 = await Promise.all(
        d.imagenes.map(async (img) => {
          const base64Image = await getBase64Image(img.imagen_ruta);
          
          if (base64Image) {
            console.log('✅ Imagen procesada exitosamente');
            return {
              base64: base64Image,
              width: img.imagen_width || 300,
              height: img.imagen_height || 200
            };
          } else {
            console.log('❌ No se pudo procesar una imagen');
            return null;
          }
        })
      );
      
      // Filtrar las imágenes que no se pudieron procesar
      const imagenesValidas = imagenesBase64.filter(img => img !== null);
      
      return { 
        ...d, 
        imagenesBase64: imagenesValidas
      };
    } else {
      console.log('📝 Detalle sin imágenes:', d.detalle);
      return { ...d, imagenesBase64: [] };
    }
  }));

  console.log('📊 Resumen de detalles procesados:');
  detallesConImagenes.forEach((d, index) => {
    console.log(`  ${index + 1}. ${d.detalle} - Imágenes: ${d.imagenesBase64?.length || 0}`);
  });

  // Leer y convertir el logo a base64
  const logoPath = path.join(__dirname, '../../public/images/logo-mundografic.png');
  let logoBase64 = '';
  try {
    const logoBuffer = await fs.readFile(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (e: any) {
    console.error('No se pudo leer el logo:', e);
    // Si falla, dejar el src vacío
    logoBase64 = '';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
      <style>
        /* Estilos generales */
        @font-face {
  font-family: 'Century Gothic';
  src: url('/images/icons/fonts/centurygothic.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Century Gothic';
  src: url('/images/icons/fonts/centurygothic_bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
}


  
html {
  height: 100%;
}
body {
  font-family: 'Century Gothic', Arial, sans-serif;
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
    margin-top: 4px;
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
  font-size: 8.5px;
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
  font-size: 7px;
  position: relative;
  display: inline-block;
  top: 2px;
  margin-left: 1px;
  color: #ff0000;
  font-weight: normal;
}

.subtitulo {
  font-size: 10.5px;
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
  font-size: 20px;
  margin-bottom: 2px;
  letter-spacing: 0.5px;
}

.numero-cotizacion {
  color: #ff0000;
  margin-left: 5px;
}

.ruc-box {
  font-size: 15px;
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
  font-size: 8px;
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
  z-index: 2;
}

.linea-vertical {
  position: absolute;
  top: -1px;
  bottom: 0;
  width: 1px;
  background-color: #999;
  height: calc(100% + 2px);
}

.linea-vertical-1 {
  left: 10%;
}

.linea-vertical-2 {
  left: 80%;
}

.linea-vertical-3 {
  left: 90%;
}

.tabla-cotizacion th {
  background-color: #f2f2f2;
  border-bottom: 1px solid #999;
  border-top: 1px solid #999;
  padding: 8px;
  font-size: 13px;
  font-weight: bold;
  text-align: left;
  color: #666;
  position: relative;
}

.tabla-cotizacion td {
  padding: 8px;
  font-size: 13px;
  border: none;
  position: relative;
  background-color: transparent;
}

.tabla-cotizacion .col-cant { 
  width: 10%; 
  text-align: center;
}
.tabla-cotizacion .col-detalle { 
  width: 70%; 
  text-align: center;
}
.tabla-cotizacion .col-unitario { 
  width: 10%; 
  text-align: center;
}
.tabla-cotizacion .col-total { 
  width: 10%; 
  text-align: center;
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
  text-align: center;
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
  font-size: 12px;
  color: #666;
}

.campoPie label {
  font-weight: bold;
  color: #666;
  min-width: 140px;
  margin-right: 10px;
}
.campoTotal label,
.campoTotal span {
  font-weight: bold;
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
  font-size: 10px;
  color: #666;
  border-top: none;
  margin-top: 10px;
}

.pie-pagina p {
  margin-left: -15px;
  
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
  font-size: 12px;
  gap: 5px;
}

.redes-sociales i {
  font-size: 15px;
  color: #666;
}

.website-link {
  color: #666;
  text-decoration: none;
  font-weight: bold;
  font-size: 13px;
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
  text-align: left;
  min-width: 300px;
}

.datos-derecha .campo-datos {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.datos-derecha .campo-datos label {
  min-width: 140px; /* reduce separación entre título y valor */
}

/* Alineación explícita de etiquetas en la columna izquierda */
.datos-izquierda .campo-datos label {
  min-width: 82px; /* acercar más los valores a la izquierda para alinear con 'QUITO,' */
}

.campo-datos {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  font-size: 13px;
  color: #333;
}

.campo-datos label {
  min-width: 90px;
  font-weight: normal;
  color: #333;
}

.campo-datos span {
  margin-left: 3px;
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
  margin-left: 0;
}

.campo-datos.fecha .ciudad {
  margin-right: 3px;
}

/* Estilos para las imágenes */
.imagen-producto {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  display: block;
  object-fit: contain;
}

.detalle-con-imagen {
  display: flex;
  flex-direction: column;
}

.detalle-texto {
  margin-bottom: 10px;
  white-space: pre-line; /* respeta \n como saltos de línea en HTML/PDF */
  word-break: break-word; /* evita desbordes si hay palabras largas */
}

.imagen-container {
  margin-top: 10px;
}

.tabla-cotizacion td {
  vertical-align: top;
  padding-top: 8px;
}

.tabla-cotizacion td.col-cant,
.tabla-cotizacion td.col-unitario,
.tabla-cotizacion td.col-total {
  vertical-align: top;
  padding-top: 8px;
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
                  <img src="${logoBase64}" alt="Logo MUNDOGRAFIC" style="width: 350px; max-width: 100%; height: auto; display: block; margin-bottom: 0;" />
                </div>
              </div>
              
              <div class="cotizacion-section">
                <div class="cotizacion-box">
                  <span>COTIZACIÓN</span> <span class="numero-cotizacion">${cotizacion.codigo_cotizacion || '000000000'}</span>
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
                  <span>${cotizacion.empresa_cliente || cotizacion.nombre_cliente}</span>
                </div>
                ${cotizacion.contacto ? `
                <div class="campo-datos">
                  <label>Contacto:</label>
                  <span>${cotizacion.contacto}</span>
                </div>
                ` : ''}
                <div class="campo-datos fecha">
                  <label>Fecha:</label>
                  <div class="contenido-fecha">
                    <span class="ciudad">QUITO,</span>
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
                ${cotizacion.celuar ? `
                <div class="campo-datos">
                  <label>Celular:</label>
                  <span>${cotizacion.celuar}</span>
                </div>
                ` : ''}
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
                        ${d.imagenesBase64 && d.imagenesBase64.length > 0 ? `
                          <div class="imagenes-container" style="display: flex; flex-direction: ${d.alineacion_imagenes === 'vertical' ? 'column' : 'row'}; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 10px;">
                            ${d.imagenesBase64.map(img => `
                              <img 
                                src="${img.base64}" 
                                alt="Imagen del producto" 
                                class="imagen-producto"
                                style="width: ${img.width}px; height: ${img.height}px; display: block;"
                              />
                            `).join('')}
                          </div>
                        ` : ''}
                      </div>
                    </td>
                    <td class="col-unitario">
                      ${Number(d.valor_unitario).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })}
                    </td>
                    <td class="col-total">${Number(d.valor_total).toFixed(2)}</td>
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
                <span>  ${Number(cotizacion.subtotal).toFixed(2)}</span>
              </div>
              <div class="campoPie">
                <label>IVA 15%</label>
                <span>${Number(cotizacion.iva).toFixed(2)}</span>
              </div>
              <div class="campoPie">
                <label>DESCUENTO</label>
                <span>${Number(cotizacion.descuento).toFixed(2)}</span>
              </div>
              <div class="campoPie campoTotal">
                <label>TOTAL</label>
                <span>${Number(cotizacion.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="pie-pagina">
            <p style="margin-left: -20px; font-size: 8px; white-space: nowrap;">
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
const generarPDF = async (htmlContent) => {
  let browser = null;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
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

const CotizacionDatos = (client: any) => {
  // Ruta para crear una cotización y guardar todos los datos del cliente
  router.post("/", authRequired(), checkPermission(client, 'cotizaciones', 'crear'), async (req: any, res: any) => {
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
      observaciones,
      contacto,
      celuar,
      nombre_ejecutivo
    } = req.body;
    const estado = "pendiente";
    const user = req.user;
    const userId = req.user?.id; // Usuario de la sesión para auditoría

    try {
      // Insertar sin numero_cotizacion (ya no existe)
      const insertQuery = `
        INSERT INTO cotizaciones (
          cliente_id, 
          fecha, 
          subtotal, 
          iva, 
          descuento, 
          total, 
          estado, 
          ruc_id,
          usuario_id,
          tiempo_entrega,
          forma_pago,
          validez_proforma,
          observaciones,
          contacto,
          celuar,
          nombre_ejecutivo,
          created_by,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        cliente_id,
        fecha,
        subtotal,
        iva,
        descuento,
        total,
        estado,
        ruc_id,
        user.id,
        tiempo_entrega,
        forma_pago,
        validez_proforma,
        observaciones,
        contacto || null,
        celuar || null,
        nombre_ejecutivo || user.nombre || null,
        user.id // created_by
      ]);

      console.log("🎉 Cotización creada exitosamente:", {
        id: result.rows[0].id,
        codigo_cotizacion: result.rows[0].codigo_cotizacion,
        cliente_id: result.rows[0].cliente_id
      });

      // Generar código único basado en el ID (9 dígitos: 000000001)
      const cotizacionId = result.rows[0].id;
      const codigoCotizacion = String(cotizacionId).padStart(9, '0');
      
      await client.query(
        'UPDATE cotizaciones SET codigo_cotizacion = $1 WHERE id = $2',
        [codigoCotizacion, cotizacionId]
      );

      console.log("✅ Código generado:", codigoCotizacion);

      // Retornar con el código actualizado
      const cotizacionActualizada = {
        ...result.rows[0],
        codigo_cotizacion: codigoCotizacion
      };

      res.json(cotizacionActualizada);
    } catch (error: any) {
      console.error("❌ Error al insertar cotización:", error);
      res.status(500).json({ error: "Error al insertar cotización" });
    }
  });

  router.get("/ultima", authRequired(), async (req: any, res: any) => {
    try {
      console.log("🔍 Obteniendo último código de cotización...");
      
      // Obtener el último ID y calcular el siguiente código
      const query = "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM cotizaciones";
      const result = await client.query(query);
      const nextId = Number(result.rows[0]?.next_id || 1);
      const nextCodigo = String(nextId).padStart(9, '0');
      
      console.log("✅ Siguiente código:", nextCodigo);
      return res.json({ codigo_cotizacion: nextCodigo });
    } catch (error: any) {
      console.error("❌ Error al obtener último código:", error);
      return res.json({ codigo_cotizacion: '000000001' });
    }
  });

  // Obtener todas las cotizaciones con filtros simplificados
  router.get("/todas", authRequired(), checkPermission(client, 'cotizaciones', 'leer'), async (req: any, res: any) => {
    console.log("Recibiendo petición en /todas");
    const { busqueda, fechaDesde, fechaHasta, limite, ordenar, global } = req.query;
    const user = req.user;
    console.log("Parámetros recibidos:", { busqueda, fechaDesde, fechaHasta, limite, ordenar, global });
    
    try {
      let query = `
        SELECT 
          c.id,
          c.codigo_cotizacion,
          cl.nombre_cliente,
          cl.empresa_cliente,
          cl.email_cliente,
          c.fecha,
          c.estado,
          c.total,
          r.ruc,
          r.descripcion as ruc_descripcion,
          u.nombre as nombre_ejecutivo,
          c.created_at,
          c.created_by,
          c.updated_by,
          c.updated_at,
          u1.nombre as created_by_nombre,
          u2.nombre as updated_by_nombre,
          (SELECT detalle FROM detalle_cotizacion WHERE cotizacion_id = c.id ORDER BY id LIMIT 1) as primer_detalle
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        JOIN usuarios u ON c.usuario_id = u.id
        LEFT JOIN usuarios u1 ON c.created_by = u1.id
        LEFT JOIN usuarios u2 ON c.updated_by = u2.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 1;

      if (busqueda) {
        query += ` AND (
          CAST(c.codigo_cotizacion AS TEXT) ILIKE $${paramCount} 
          OR cl.nombre_cliente ILIKE $${paramCount}
          OR cl.empresa_cliente ILIKE $${paramCount}
          OR u.nombre ILIKE $${paramCount}
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

      const isGlobal = typeof global === 'string' ? global.toLowerCase() === 'true' : !!global;
      console.log("🔍 Filtrado de usuario - isGlobal:", isGlobal, "| user.rol:", user?.rol, "| user.id:", user?.id);
      
      // Si NO es búsqueda global Y el usuario es ejecutivo, filtrar solo sus cotizaciones
      if (!isGlobal && user && user.rol === 'ejecutivo') {
        console.log("✅ Aplicando filtro de usuario (solo cotizaciones del ejecutivo)");
        query += ` AND c.usuario_id = $${paramCount}`;
        params.push(user.id);
        paramCount++;
      } else {
        console.log("🌐 Mostrando todas las cotizaciones (sin filtro de usuario)");
      }

      // Ordenar por número de cotización descendente (más recientes primero)
      query += ` ORDER BY c.id DESC`;

      // Aplicar límite
      // Si es búsqueda global con filtros de búsqueda, traer todos los resultados
      // Si es búsqueda global sin filtros, limitamos a un número razonable para evitar problemas de rendimiento
      // Si no es global, aplicamos el límite normal
      if (!busqueda && !fechaDesde && !fechaHasta && !isGlobal) {
        // Sin filtros y sin búsqueda global: mostrar solo las últimas cotizaciones
        query += ` LIMIT ${limite || 15}`;
      } else if (isGlobal && !busqueda && !fechaDesde && !fechaHasta) {
        // Búsqueda global sin filtros: mostrar todas las cotizaciones (sin límite)
        // O si prefieres un límite razonable, usa: query += ` LIMIT 1000`;
      } else if (!isGlobal) {
        // Con filtros pero sin global: aplicar límite
        query += ` LIMIT ${limite || 15}`;
      }
      // Si es global CON filtros: no aplicar límite para traer todos los resultados

      console.log("Query a ejecutar:", query);
      console.log("Parámetros:", params);

      const result = await client.query(query, params);
      console.log("Resultados obtenidos:", result.rows.length);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error al obtener cotizaciones:", error);
      res.status(500).json({ error: "Error al obtener las cotizaciones: " + error.message });
    }
  });

  ///*Cotizaciones editar*////////
  router.get("/:id", authRequired(), checkPermission(client, 'cotizaciones', 'leer'), async (req: any, res: any) => {
    try {
      const { id } = req.params;
  
      const query = `
        SELECT 
          c.*,
          cl.nombre_cliente,
          cl.empresa_cliente,
          cl.email_cliente,
          r.ruc,
          r.descripcion as ruc_descripcion,
          u.nombre as nombre_ejecutivo,
          u1.nombre as created_by_nombre,
          u2.nombre as updated_by_nombre
        FROM cotizaciones c
        LEFT JOIN clientes cl ON c.cliente_id = cl.id
        LEFT JOIN rucs r ON c.ruc_id = r.id
        LEFT JOIN usuarios u ON c.usuario_id = u.id
        LEFT JOIN usuarios u1 ON c.created_by = u1.id
        LEFT JOIN usuarios u2 ON c.updated_by = u2.id
        WHERE c.id = $1
      `;
      const result = await client.query(query, [id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      // Obtener los detalles de la cotización
      const detallesQuery = `
        SELECT 
          id,
          cotizacion_id,
          cantidad,
          detalle,
          valor_unitario as precio_unitario,
          valor_total as subtotal
        FROM detalle_cotizacion
        WHERE cotizacion_id = $1
        ORDER BY id
      `;
      const detallesResult = await client.query(detallesQuery, [id]);
  
      // Agregar los detalles a la respuesta
      const cotizacion = {
        ...result.rows[0],
        detalles: detallesResult.rows
      };

      res.json(cotizacion);
    } catch (error: any) {
      console.error("Error al obtener cotización por ID:", error);
      res.status(500).json({ error: "Error al obtener cotización por ID" });
    }
  });

  // Actualizar una cotización existente
  router.put("/:id", authRequired(), checkPermission(client, 'cotizaciones', 'editar'), async (req: any, res: any) => {
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
      observaciones,
      contacto,
      celuar,
      nombre_ejecutivo
    } = req.body;
    const userId = req.user?.id; // Usuario de la sesión para auditoría

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
            observaciones = $11,
            contacto = $12,
            celuar = $13,
            nombre_ejecutivo = $14,
            updated_by = $15,
            updated_at = NOW()
        WHERE id = $16
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
        contacto || null,
        celuar || null,
        nombre_ejecutivo || null,
        userId,
        id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error al actualizar la cotización:", error);
      res.status(500).json({ error: "Error al actualizar la cotización" });
    }
  });

  // Eliminar una cotización
  router.delete("/:id", authRequired(), checkPermission(client, 'cotizaciones', 'eliminar'), async (req: any, res: any) => {
    const { id } = req.params;

    try {
      // Primero verificar si la cotización existe
      const checkQuery = "SELECT id FROM cotizaciones WHERE id = $1";
      const checkResult = await client.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      // Eliminar los detalles de la cotización primero (por la foreign key)
      const deleteDetallesQuery = "DELETE FROM detalle_cotizacion WHERE cotizacion_id = $1";
      await client.query(deleteDetallesQuery, [id]);

      // Eliminar la cotización
      const deleteCotizacionQuery = "DELETE FROM cotizaciones WHERE id = $1";
      const result = await client.query(deleteCotizacionQuery, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Cotización no encontrada" });
      }

      res.json({ 
        success: true, 
        message: "Cotización eliminada exitosamente" 
      });
    } catch (error: any) {
      console.error("Error al eliminar la cotización:", error);
      res.status(500).json({ error: "Error al eliminar la cotización" });
    }
  });

  // Ruta para aprobar una cotización
  router.put('/:id/aprobar', authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const result = await client.query(
        `UPDATE cotizaciones SET estado = 'aprobada' WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Cotización no encontrada' });
      }
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error al aprobar la cotización:', error);
      res.status(500).json({ error: 'Error al aprobar la cotización' });
    }
  });

  // Ruta para generar PDF de una cotización
  router.get("/:id/pdf", authRequired(), async (req: any, res: any) => {
    const { id } = req.params;
    
    try {
      console.log('Iniciando generación de PDF para cotización:', id);

      // 1. Obtener los datos de la cotización
      const cotizacionQuery = `
        SELECT 
          c.id,
          c.codigo_cotizacion,
          c.fecha,
          c.subtotal,
          c.iva,
          c.descuento,
          c.total,
          cl.nombre_cliente,
          cl.empresa_cliente,
          u.nombre AS nombre_ejecutivo,
          r.ruc,
          r.descripcion AS ruc_descripcion,
          c.tiempo_entrega,
          c.forma_pago,
          c.validez_proforma,
          c.observaciones,
          c.contacto,
          c.celuar
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.id = $1
      `;
      
      const cotizacionResult = await client.query(cotizacionQuery, [id]);
      if (cotizacionResult.rows.length === 0) {
        console.log('No se encontró la cotización');
        return res.status(404).json({ error: "Cotización no encontrada" });
      }
      const cotizacion = cotizacionResult.rows[0];
      console.log('Datos de cotización obtenidos:', cotizacion);

      // 2. Obtener los detalles de la cotización con sus imágenes
      const detallesQuery = `
        SELECT 
          d.id,
          d.cantidad, 
          d.detalle, 
          d.valor_unitario, 
          d.valor_total,
          d.alineacion_imagenes
        FROM detalle_cotizacion d
        WHERE d.cotizacion_id = $1
        ORDER BY d.id ASC
      `;
      console.log('Obteniendo detalles de la cotización...');
      const detallesResult = await client.query(detallesQuery, [id]);
      
      // Para cada detalle, obtener sus imágenes
      const detalles = await Promise.all(
        detallesResult.rows.map(async (detalle) => {
          const imagenesQuery = `
            SELECT imagen_ruta, orden, imagen_width, imagen_height
            FROM detalle_cotizacion_imagenes
            WHERE detalle_cotizacion_id = $1
            ORDER BY orden ASC
          `;
          const imagenesResult = await client.query(imagenesQuery, [detalle.id]);
          
          return {
            ...detalle,
            imagenes: imagenesResult.rows
          };
        })
      );
      
      console.log('Detalles obtenidos con imágenes:', detalles);

      // 3. Generar el PDF
      const html = await generarHTMLCotizacion(cotizacion, detalles);
      const pdfBuffer = await generarPDF(html);
      
      // 4. Enviar el PDF al cliente
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${cotizacion.codigo_cotizacion}.pdf`);
      res.send(pdfBuffer);

    } catch (error: any) {
      console.error('Error al generar PDF:', error);
      res.status(500).json({ error: 'Error al generar el PDF: ' + error.message });
    }
  });

  /**
   * ============================================================
   * ENVIAR COTIZACIÓN POR CORREO ELECTRÓNICO
   * ============================================================
   * 
   * Esta ruta envía una cotización por correo electrónico.
   * 
   * LÓGICA: Usa el usuario con SESIÓN ACTIVA para TODO
   * ✅ FIRMA: Del usuario que envía (sesión activa)
   * ✅ CREDENCIALES EMAIL: Del usuario que envía (sesión activa)
   * 
   * Esto permite que cualquier ejecutivo pueda enviar cualquier cotización
   * usando su propia identidad (correo + firma), independientemente de
   * quién creó la cotización originalmente.
   * 
   * @route POST /:id/enviar-correo
   * @auth Requiere autenticación (authRequired)
   */
  router.post('/:id/enviar-correo', authRequired(), async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { email, asunto, mensaje, nombrePDF, destinatarios } = req.body;

      // Validar que el correo fue proporcionado
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico es requerido'
        });
      }

      // ✅ Validar formato de email (soporta múltiples correos separados por coma)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = email.split(',').map(e => e.trim()).filter(e => e.length > 0);
      
      // Verificar que todos los emails tengan formato válido
      const invalidEmails = emails.filter(e => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Los siguientes correos electrónicos no tienen formato válido: ${invalidEmails.join(', ')}`
        });
      }

      // Log de destinatarios para debugging
      if (destinatarios && Array.isArray(destinatarios)) {
        console.log('📧 Destinatarios recibidos:', destinatarios.length);
        destinatarios.forEach((dest, index) => {
          console.log(`  ${index + 1}. ${dest.email} (${dest.tipo}) - ${dest.nombre || 'Sin nombre'}`);
        });
      }

      // Obtener información de la cotización
      const cotizacionQuery = `
        SELECT 
          c.id,
          c.codigo_cotizacion,
          c.fecha,
          c.subtotal,
          c.iva,
          c.descuento,
          c.total,
          c.usuario_id,
          cl.nombre_cliente,
          cl.empresa_cliente,
          u.nombre AS nombre_ejecutivo,
          r.ruc,
          r.descripcion AS ruc_descripcion,
          c.tiempo_entrega,
          c.forma_pago,
          c.validez_proforma,
          c.observaciones,
          c.contacto,
          c.celuar
        FROM cotizaciones c
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN rucs r ON c.ruc_id = r.id
        JOIN usuarios u ON c.usuario_id = u.id
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
        SELECT 
          cantidad, 
          detalle, 
          valor_unitario, 
          valor_total, 
          imagen_ruta,
          imagen_width,
          imagen_height
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
      const fileName = `cotizacion-${cotizacion.codigo_cotizacion}-${timestamp}.pdf`;
      const pdfPath = path.join(pdfDir, fileName);

      // Generar el HTML
      const html = await generarHTMLCotizacion(cotizacion, detalles);

      // Generar el PDF
      const pdfBuffer = await generarPDF(html);
      
      // Guardar el PDF
      await fs.writeFile(pdfPath, pdfBuffer);

                    // ============================================================
      // PASO 1: Obtener la firma del usuario con SESIÓN ACTIVA
      // ============================================================
      let signatureHtml = '';
      let signatureAttachments: any[] = [];
      
      try {
        console.log('📝 [FIRMA] Obteniendo firma del usuario con sesión activa (ID:', req.user?.id, ')');
        const senderFirmaQuery = `
          SELECT id, nombre, firma_html, firma_activa
          FROM usuarios 
          WHERE id = $1
        `;
        const senderFirmaResult = await client.query(senderFirmaQuery, [req.user.id]);
        
        if (senderFirmaResult.rows.length > 0) {
          const sender = senderFirmaResult.rows[0];
          console.log('✅ [FIRMA] Usuario encontrado:', sender.nombre);
          console.log('   [FIRMA] Firma activa:', sender.firma_activa);
          console.log('   [FIRMA] Tiene firma HTML:', !!sender.firma_html);
          
          if (sender.firma_activa && sender.firma_html) {
            signatureHtml = sender.firma_html;
            signatureAttachments = [];
            console.log('✅ [FIRMA] Usando firma personalizada de:', sender.nombre);
          } else {
            console.log('⚠️  [FIRMA] Usuario no tiene firma personalizada activa');
          }
        }
      } catch (error) {
        console.warn('⚠️  [FIRMA] Error al obtener firma personalizada:', error);
      }
       
      // Si no hay firma personalizada, enviar sin firma (solo texto simple)
      if (!signatureHtml) {
        console.log('⚠️  [FIRMA] Usuario sin firma configurada - enviando sin firma personalizada');
        signatureHtml = '<p style="margin-top: 20px;">Saludos cordiales</p>';
        signatureAttachments = [];
      }

      // ============================================================
      // PASO 2: Obtener credenciales del usuario que ENVÍA el correo (sesión activa)
      // ============================================================
      let emailUser = '';
      let emailPassword = '';
      
      console.log('🔑 [EMAIL] Sistema de emails personalizados por ejecutivo');
      console.log('🔑 [EMAIL] Usuario con sesión activa (ID:', req.user?.id, ')');
      
      try {
        // Obtener datos del usuario que está enviando el correo (sesión activa)
        const senderQuery = `
          SELECT id, nombre, email_config, email_personal
          FROM usuarios 
          WHERE id = $1
        `;
        const senderResult = await client.query(senderQuery, [req.user.id]);
        
        if (senderResult.rows.length === 0) {
          throw new Error('No se encontró el usuario con sesión activa');
        }
        
        const sender = senderResult.rows[0];
        console.log('✅ [EMAIL] Remitente encontrado:', sender.nombre);
        console.log('   [EMAIL] Email personal:', sender.email_personal);
        console.log('   [EMAIL] Email config:', sender.email_config);
        
        if (!sender.email_config) {
          throw new Error(`El usuario ${sender.nombre} no tiene configurado su email_config. Por favor contacte al administrador.`);
        }
        
        const emailConfig = sender.email_config.toUpperCase();
        
        // Buscar credenciales específicas del ejecutivo
        const specificEmailUser = process.env[`EMAIL_USER_${emailConfig}`];
        const specificEmailPassword = process.env[`EMAIL_PASSWORD_${emailConfig}`];
        
        console.log(`🔍 [EMAIL] Buscando: EMAIL_USER_${emailConfig}:`, specificEmailUser ? '✅ Configurado' : '❌ No configurado');
        console.log(`🔍 [EMAIL] Buscando: EMAIL_PASSWORD_${emailConfig}:`, specificEmailPassword ? '✅ Configurado' : '❌ No configurado');
        
        if (!specificEmailUser || !specificEmailPassword) {
          throw new Error(`No se encontraron credenciales de email para ${sender.nombre} (${emailConfig}). Por favor contacte al administrador.`);
        }
        
        emailUser = specificEmailUser;
        emailPassword = specificEmailPassword;
        
        console.log(`✅ [EMAIL] Usando credenciales de ${sender.nombre}: ${emailUser}`);
        console.log(`✅ [EMAIL] El correo se enviará DESDE: ${emailUser}`);
        
      } catch (error: any) {
        console.error('❌ [EMAIL] Error al obtener credenciales:', error.message);
        throw new Error(`Error al configurar el email: ${error.message}`);
      }

      // ============================================================
      // PASO 3: Crear transporter con las credenciales del remitente
      // ============================================================
      console.log('📧 [SMTP] Creando transporter dinámico');
      console.log('   [SMTP] Host: smtp.gmail.com');
      console.log('   [SMTP] Puerto: 587');
      console.log('   [SMTP] Usuario:', emailUser);
      console.log('   [SMTP] Contraseña:', emailPassword ? '✅ Configurada' : '❌ No configurada');
      
      const dynamicTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });
      
      // Verificar la conexión del transporter
      try {
        await dynamicTransporter.verify();
        console.log('✅ [SMTP] Transporter verificado correctamente');
      } catch (verifyError: any) {
        console.error('❌ [SMTP] Error al verificar transporter:', verifyError);
        throw new Error(`Error de configuración del transporter: ${verifyError.message}`);
      }

      // ============================================================
      // RESUMEN DE CONFIGURACIÓN
      // ============================================================
      console.log('\n📋 [RESUMEN] Configuración del email:');
      console.log('   ✉️  Remitente (FROM):', emailUser);
      console.log('   📝 Firma:', signatureHtml ? `Personalizada (${signatureHtml.length} caracteres)` : 'Por defecto del sistema');
      console.log('   📎 Adjuntos de firma:', signatureAttachments.length);
      
      // 6. Preparar destinatarios por tipo
      let toEmails = [];
      let ccEmails = [];
      let bccEmails = [];

      if (destinatarios && Array.isArray(destinatarios)) {
        // Usar la nueva estructura de destinatarios
        destinatarios.forEach(dest => {
          if (dest.tipo === 'to') {
            toEmails.push(dest.email);
          } else if (dest.tipo === 'cc') {
            ccEmails.push(dest.email);
          } else if (dest.tipo === 'bcc') {
            bccEmails.push(dest.email);
          }
        });
      } else {
        // Fallback al método anterior (compatibilidad)
        toEmails = emails;
      }

      // Asegurar que haya al menos un destinatario principal
      if (toEmails.length === 0) {
        toEmails = emails;
      }

      console.log('📧 Configuración de destinatarios:');
      console.log('📧 Para (TO):', toEmails.join(', '));
      if (ccEmails.length > 0) console.log('📧 CC:', ccEmails.join(', '));
      if (bccEmails.length > 0) console.log('📧 BCC:', bccEmails.join(', '));

      // 7. Enviar el correo
      const mailOptions: any = {
        from: emailUser,
        to: toEmails.join(', '),
        subject: asunto || `Cotización MUNDOGRAFIC ${cotizacion.codigo_cotizacion}`,
        text: mensaje || 'Adjunto encontrará la cotización solicitada.',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>${(mensaje || 'Adjunto encontrará la cotización solicitada.').replace(/\n/g, '<br>')}</p>
            ${signatureHtml || ''}
          </div>
        `,
        attachments: [
          {
            filename: `${nombrePDF || `cotizacion_${cotizacion.codigo_cotizacion}`}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      // Agregar CC y BCC si existen
      if (ccEmails.length > 0) {
        mailOptions.cc = ccEmails.join(', ');
      }
      if (bccEmails.length > 0) {
        mailOptions.bcc = bccEmails.join(', ');
      }

      await dynamicTransporter.sendMail(mailOptions);

      // Limpiar el archivo PDF después de enviarlo
      setTimeout(async () => {
        try {
          await fs.unlink(pdfPath);
          console.log('Archivo PDF temporal eliminado');
        } catch (error: any) {
          console.error('Error al eliminar archivo temporal:', error);
        }
      }, 1000);

      // Responder al cliente
      res.json({
        success: true,
        message: 'Correo enviado exitosamente'
      });

    } catch (error: any) {
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

  // Ruta para generar vista previa del PDF
  router.post('/preview', authRequired(), async (req: any, res: any) => {
    try {
      const { cotizacion, detalles } = req.body;

      console.log('📋 Recibiendo preview request');
      console.log('📊 Detalles recibidos:', JSON.stringify(detalles, null, 2));
      console.log('🖼️ Total de detalles con imágenes:', detalles.filter(d => d.imagenes && d.imagenes.length > 0).length);

      // Generar el HTML (esto ya procesa las imágenes a base64 internamente)
      const html = await generarHTMLCotizacion(cotizacion, detalles);

      // Generar el PDF
      const pdfBuffer = await generarPDF(html);

      // Convertir el buffer a base64
      const base64PDF = pdfBuffer.toString('base64');

      console.log('✅ PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');

      // Enviar el PDF en base64
      res.json({ 
        success: true, 
        pdf: `data:application/pdf;base64,${base64PDF}`
      });
    } catch (error: any) {
      console.error('❌ Error al generar vista previa:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error al generar la vista previa del PDF' 
      });
    }
  });

  return router;
};

export default CotizacionDatos;
