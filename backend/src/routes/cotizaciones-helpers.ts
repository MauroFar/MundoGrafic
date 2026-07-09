/**
 * ============================================================
 * HELPERS DE GENERACIÓN DE PDF PARA COTIZACIONES
 * ============================================================
 * Este archivo contiene únicamente las funciones helper para
 * generar HTML y PDF de cotizaciones, usadas por el módulo limpio:
 * backend/src/modules/cotizaciones/
 * 
 * Todas las rutas fueron migradas a arquitectura limpia.
 * ============================================================
 */

import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
require('dotenv').config();

/**
 * Genera el HTML completo de una cotización para PDF
 * @param cotizacion - Datos de la cotización
 * @param detalles - Array de detalles con cantidades, descripciones, valores e imágenes
 * @returns String con HTML completo listo para convertir a PDF
 */
export const generarHTMLCotizacion = async (cotizacion: any, detalles: any[]) => {
  // Establecer la URL base para las imágenes
  const baseUrl = process.env.API_URL || 'http://localhost:3000';

  const parseCantidadEntera = (valor: any) => {
    if (valor === null || valor === undefined || valor === '') return 0;

    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? Math.trunc(valor) : 0;
    }

    const texto = String(valor).trim();
    if (!texto) return 0;

    const soloDigitos = texto.replace(/\D/g, '');
    if (!soloDigitos) return 0;

    const parsed = Number.parseInt(soloDigitos, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatearCantidadPDF = (valor: any) => {
    const cantidad = parseCantidadEntera(valor);
    return cantidad > 0 ? cantidad.toLocaleString('es-EC') : '';
  };

  const formatearMonedaPDF = (valor: any, decimals = 2) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return '';

    return numero.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: Math.max(decimals, 6),
    });
  };
  
  // Función para convertir imagen a base64
  const getBase64Image = async (imagePath: string) => {
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
        d.imagenes.map(async (img: any) => {
          const base64Image = await getBase64Image(img.imagen_ruta);
          
          if (base64Image) {
            console.log('✅ Imagen procesada exitosamente');
            return {
              base64: base64Image,
              width: img.imagen_width || 300,
              height: img.imagen_height || 200,
              rotation: Number.isFinite(Number(img.imagen_rotacion)) ? Number(img.imagen_rotacion) : 0
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
        posicion_imagen: d.posicion_imagen || 'abajo',
        alineacion_imagenes: d.alineacion_imagenes || 'horizontal',
        imagenesBase64: imagenesValidas
      };
    } else {
      console.log('📝 Detalle sin imágenes:', d.detalle);
      return { 
        ...d, 
        posicion_imagen: d.posicion_imagen || 'abajo',
        alineacion_imagenes: d.alineacion_imagenes || 'horizontal',
        imagenesBase64: [] 
      };
    }
  }));

  console.log('📊 Resumen de detalles procesados:');
  detallesConImagenes.forEach((d, index) => {
    console.log(`  ${index + 1}. ${d.detalle} - Imágenes: ${d.imagenesBase64?.length || 0}`);
  });

  // Selección dinámica de logo según RUC
  // Asignar logo por id exacto del RUC
  let logoBase64 = '';
  let logoFile = '';
  if (cotizacion.ruc === '1710047984001') {
    logoFile = 'logo_jcp.png';
  } else if (cotizacion.ruc === '1792668026001') {
    logoFile = 'logo_cia.png';
  }
  if (logoFile) {
    const logoPath = path.join(__dirname, '../../public/images/icons', logoFile);
    try {
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (e: any) {
      console.error('No se pudo leer el logo:', e);
      logoBase64 = '';
    }
  } else {
    console.warn('No se encontró logo para el RUC:', cotizacion.ruc);
    logoBase64 = '';
  }

  const mostrarTotales = (
    cotizacion.mostrar_totales !== false &&
    !(cotizacion.subtotal == null && cotizacion.iva == null && cotizacion.descuento == null && cotizacion.total == null)
  );

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
  flex: 1 0 auto;
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
  padding: 6px 8px;
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

/* Estilos para posicionamiento de imágenes */
.detalle-con-imagen.layout-derecha {
  display: flex;
  flex-direction: row;
  gap: 15px;
  align-items: flex-start;
}

.texto-izquierda {
  flex: 1;
  min-width: 0;
  padding-right: 10px;
  white-space: normal;
  word-break: break-word;
  word-wrap: break-word;
}

.imagenes-derecha {
  flex-shrink: 0;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: -4px;
  padding-top: 0;
}

.detalle-con-imagen.layout-abajo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detalle-con-imagen.layout-abajo .detalle-texto {
  align-self: flex-start;
  width: 100%;
  white-space: normal;
  word-break: break-word;
  word-wrap: break-word;
}

.detalle-con-imagen.layout-abajo .imagenes-container {
  align-self: center;
  margin-top: -4px;
}

.escala-linea {
  display: block;
  min-height: 18px;
  line-height: 1.35;
  padding: 1px 0;
}

.escala-linea + .escala-linea {
  margin-top: 4px;
}

.escala-linea-vacia {
  visibility: hidden;
}

/* Footer */
.cotizaciones-footer {
  left: 15mm;
  right: 15mm;
  margin-top: auto;
  break-inside: avoid;
  page-break-inside: avoid;
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
  color: #000;
  min-width: 140px;
  margin-right: 10px;
}
.campoTotal label,
.campoTotal span {
  font-weight: bold;
}

.campoPie span, .campoPie input {
  color: #000;
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
  min-width: 140px;
}

/* Alineación explícita de etiquetas en la columna izquierda */
.datos-izquierda .campo-datos label {
  min-width: 82px;
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
  margin: 0;
  display: block;
  object-fit: contain;
}

.detalle-con-imagen {
  display: flex;
  flex-direction: column;
}

.detalle-texto {
  margin-bottom: 0;
  white-space: pre-line;
  word-break: break-word;
}

.imagen-container {
  margin-top: 10px;
}

.tabla-cotizacion td {
  vertical-align: top;
  padding-top: 6px;
}

.tabla-cotizacion td.col-cant,
.tabla-cotizacion td.col-unitario,
.tabla-cotizacion td.col-total {
  vertical-align: top;
  padding-top: 6px;
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
                ${detallesConImagenes.map(d => {
                  const usaEscalas = d.usa_escalas === true;
                  const escalas = Array.isArray(d.escalas) ? d.escalas : [];
                  const detalleHTML = `
                      <div class="detalle-con-imagen ${d.posicion_imagen === 'derecha' ? 'layout-derecha' : 'layout-abajo'}">
                        ${d.posicion_imagen === 'derecha' && d.imagenesBase64 && d.imagenesBase64.length > 0 ? `
                          <!-- Layout: Texto a la izquierda, imagen a la derecha -->
                          <div class="texto-izquierda">${d.detalle.replace(/\n/g, '<br>')}</div>
                          <div class="imagenes-derecha">
                            ${d.imagenesBase64.map((img: any) => `
                              <div style="position: relative; width: ${img.width}px; height: ${img.height}px; overflow: hidden;">
                                <img 
                                  src="${img.base64}" 
                                  alt="Imagen del producto" 
                                  class="imagen-producto"
                                  style="width: ${img.rotation % 180 === 0 ? img.width : img.height}px; height: ${img.rotation % 180 === 0 ? img.height : img.width}px; display: block; object-fit: contain; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(${img.rotation}deg);"
                                />
                              </div>
                            `).join('')}
                          </div>
                        ` : `
                          <!-- Layout: Texto arriba, imagen(es) debajo -->
                          <div class="detalle-texto">${d.detalle.replace(/\n/g, '<br>')}</div>
                          ${d.imagenesBase64 && d.imagenesBase64.length > 0 ? `
                            <div class="imagenes-container" style="display: flex; flex-direction: ${d.alineacion_imagenes === 'vertical' ? 'column' : 'row'}; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 0;">
                              ${d.imagenesBase64.map((img: any) => `
                                <div style="position: relative; width: ${img.width}px; height: ${img.height}px; overflow: hidden;">
                                  <img 
                                    src="${img.base64}" 
                                    alt="Imagen del producto" 
                                    class="imagen-producto"
                                    style="width: ${img.rotation % 180 === 0 ? img.width : img.height}px; height: ${img.rotation % 180 === 0 ? img.height : img.width}px; display: block; object-fit: contain; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(${img.rotation}deg);"
                                  />
                                </div>
                              `).join('')}
                            </div>
                          ` : ''}
                        `}
                      </div>
                  `;

                  const cantidadesEscalasHTML = usaEscalas && escalas.length > 0
                    ? escalas.map((escala: any) => `
                        <span class="escala-linea">${formatearCantidadPDF(escala.cantidad)}</span>
                      `).join('')
                    : '';

                  const unitariosEscalasHTML = usaEscalas && escalas.length > 0
                    ? escalas.map((escala: any) => `
                        <span class="escala-linea">${formatearMonedaPDF(escala.valor_unitario, 2)}</span>
                      `).join('')
                    : '';

                  const totalesEscalasHTML = usaEscalas && escalas.length > 0
                    ? escalas.map((escala: any) => `
                        <span class="escala-linea">${formatearMonedaPDF(escala.valor_total, 2)}</span>
                      `).join('')
                    : '';

                  return `
                  <tr>
                    <td class="col-cant">${usaEscalas ? cantidadesEscalasHTML : formatearCantidadPDF(d.cantidad)}</td>
                    <td class="col-detalle">
                      ${detalleHTML}
                    </td>
                    <td class="col-unitario">
                      ${usaEscalas ? unitariosEscalasHTML : Number(d.valor_unitario).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </td>
                    <td class="col-total">${usaEscalas ? totalesEscalasHTML : Number(d.valor_total).toFixed(2)}</td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <footer class="cotizaciones-footer">
          <div class="pie-cotizacion">
            <div class="pie-izquierda">
              <div class="campoPie">
                <label>Tiempo De Entrega:</label>
                <span>${cotizacion.tiempo_entrega ?? ''}</span>
              </div>
              <div class="campoPie">
                <label>Forma De Pago:</label>
                <span>${cotizacion.forma_pago ?? ''}</span>
              </div>
              <div class="campoPie">
                <label>Validez Proforma:</label>
                <span>${cotizacion.validez_proforma ?? ''}</span>
              </div>
              <div class="campoPie">
                <label>Observaciones:</label>
                <span>${cotizacion.observaciones ?? ''}</span>
              </div>
            </div>
            <div class="pie-derecha">
              <div class="campoPie">
                <label>SUBTOTAL</label>
                <span>${mostrarTotales ? `$${Number(cotizacion.subtotal).toFixed(2)}` : ''}</span>
              </div>
              <div class="campoPie">
                <label>IVA 15%</label>
                <span>${mostrarTotales ? `$${Number(cotizacion.iva).toFixed(2)}` : ''}</span>
              </div>
              <div class="campoPie">
                <label>DESCUENTO</label>
                <span>${mostrarTotales ? `$${Number(cotizacion.descuento).toFixed(2)}` : ''}</span>
              </div>
              <div class="campoPie campoTotal">
                <label>TOTAL</label>
                <span>${mostrarTotales ? `$${Number(cotizacion.total).toFixed(2)}` : ''}</span>
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

/**
 * Convierte HTML a PDF usando Puppeteer
 * @param htmlContent - HTML completo a convertir
 * @returns Buffer con el PDF generado
 */
export const generarPDF = async (htmlContent: string) => {
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
