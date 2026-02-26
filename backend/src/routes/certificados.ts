import express from 'express';
import authRequired from '../middleware/auth';
import checkPermission from '../middleware/checkPermission';

export default (client: any) => {
  const router = express.Router();

  // Listar certificados
  router.get('/', authRequired(), checkPermission(client, 'certificados', 'leer'), async (req, res) => {
    try {
      const result = await client.query('SELECT * FROM certificado_calidad ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error al listar certificados:', error);
      res.status(500).json({ error: 'Error al listar certificados' });
    }
  });

  // Obtener siguiente número de certificado (sugerido) sin consumir la secuencia
  router.get('/next-number', authRequired(), checkPermission(client, 'certificados', 'leer'), async (req, res) => {
    try {
      const seqRes = await client.query('SELECT COALESCE(MAX(numero_secuencia), 0) + 1 AS next_seq FROM certificado_calidad');
      const nextSeq = seqRes.rows[0]?.next_seq || 1;
      const yearRes = await client.query("SELECT to_char(now(),'YYYY') AS y");
      const year = yearRes.rows[0]?.y || new Date().getFullYear();
      const numero_certificado = `CERT-${year}-${String(nextSeq).padStart(6,'0')}`;
      res.json({ next_seq: nextSeq, numero_certificado });
    } catch (error: any) {
      console.error('Error al obtener next-number certificados:', error);
      res.status(500).json({ error: 'Error al calcular número de certificado' });
    }
  });

  // Catalogo de caracteristicas (para el formulario)
  router.get('/caracteristicas', authRequired(), checkPermission(client, 'certificados', 'leer'), async (req, res) => {
    try {
      const result = await client.query('SELECT id, nombre, unidad FROM caracteristica ORDER BY nombre');
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error al obtener catalogo de caracteristicas:', error);
      res.status(500).json({ error: 'Error al obtener catalogo' });
    }
  });

  // Obtener un certificado por id (incluye características)
  router.get('/:id', authRequired(), checkPermission(client, 'certificados', 'leer'), async (req, res) => {
    const { id } = req.params;
    try {
      const certRes = await client.query('SELECT * FROM certificado_calidad WHERE id = $1', [id]);
      if (certRes.rows.length === 0) return res.status(404).json({ error: 'Certificado no encontrado' });
      const certificado = certRes.rows[0];
      const carRes = await client.query(`SELECT cm.id, cm.certificado_id, cm.caracteristica_id, cm.minimo, cm.nominal, cm.maximo, cm.orden, c.nombre, c.unidad
        FROM certificado_medicion cm
        LEFT JOIN caracteristica c ON cm.caracteristica_id = c.id
        WHERE cm.certificado_id = $1
        ORDER BY cm.orden ASC`, [id]);
      certificado.caracteristicas = carRes.rows;
      res.json(certificado);
    } catch (error: any) {
      console.error('Error al obtener certificado:', error);
      res.status(500).json({ error: 'Error al obtener certificado' });
    }
  });

  // Generar PDF del certificado
  router.get('/:id/pdf', authRequired(), checkPermission(client, 'certificados', 'leer'), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const certRes = await client.query('SELECT * FROM certificado_calidad WHERE id = $1', [id]);
      if (certRes.rows.length === 0) return res.status(404).json({ error: 'Certificado no encontrado' });
      const certificado = certRes.rows[0];
      const carRes = await client.query(`SELECT cm.id, cm.certificado_id, cm.caracteristica_id, cm.minimo, cm.nominal, cm.maximo, cm.orden, c.nombre, c.unidad
        FROM certificado_medicion cm
        LEFT JOIN caracteristica c ON cm.caracteristica_id = c.id
        WHERE cm.certificado_id = $1
        ORDER BY cm.orden ASC`, [id]);
      const caracteristicas = carRes.rows;

      // Leer logo si existe (intenta logo.png primero, luego logo-mundografic.png)
      const fs = require('fs/promises');
      const path = require('path');
      let logoBase64 = '';
      try {
        const candidates = [
          path.join(__dirname, '../../public/images/logo.png'),
          path.join(__dirname, '../../public/images/logo-mundografic.png')
        ];
        for (const p of candidates) {
          try {
            const b = await fs.readFile(p);
            logoBase64 = `data:image/png;base64,${b.toString('base64')}`;
            break;
          } catch (err) {
            // seguir al siguiente candidato
          }
        }
      } catch (e) {
        logoBase64 = '';
      }

      // Diseño ajustado para reproducir la imagen proporcionada.
      const html = `
         <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif; color: #000; margin:0; }
            .sheet { width: 100%; box-sizing: border-box; padding: 0.5cm 0.8cm; }

            /* Header */
            .header { display:flex; align-items:stretch; gap:14px; border-bottom:2px solid #000; padding-bottom:12px; }
            .logo { width:182px; }
            .company { flex:1; display:flex; flex-direction:column; justify-content:center; }
            .company-name { font-size:20px; font-weight:700; letter-spacing:0.6px; }
            .company-meta { font-size:12px; color:#222; margin-top:6px; }
            .cert-number { width:202px; text-align:right; font-weight:700; font-size:14px; }

            /* Title */
            .title { text-align:center; font-size:16px; font-weight:700; margin:16px 0 8px 0; }

            /* Info grid */
            .info-grid { width:100%; display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px; }
            .info-item { display:flex; }
            .info-label { width:142px; font-weight:700; font-size:13px; }
            .info-value { flex:1; border-bottom:1px solid #ddd; padding-bottom:6px; font-size:13px; }

            /* Measurements table */
            table.carac { width:100%; border-collapse:collapse; font-size:13px; margin-top:8px; }
            table.carac thead th { text-align:center; font-weight:700; padding:10px 8px; border-bottom:1px solid #000; }
            table.carac tbody td { padding:10px 8px; border-bottom:1px solid #e0e0e0; }
            table.carac tbody tr:nth-child(even) td { background:#f7f7f7; }
            .carac-name { text-align:left; padding-left:10px; }
            .carac-unidad { width:82px; text-align:center; }
            .carac-val { width:92px; text-align:center; }

            .observaciones { margin-top:14px; font-size:13px; }
            .obs-box { border:1px solid #000; padding:10px; min-height:50px; }

            .signatures { display:flex; gap:14px; margin-top:20px; }
            .sign-block { flex:1; border-top:1px solid #000; padding-top:10px; text-align:left; font-size:13px; }
            .sign-label { font-weight:700; font-size:13px; margin-bottom:8px; }

            .footer { position:fixed; bottom:10px; left:0; right:0; text-align:center; font-size:12px; color:#444; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="logo">${logoBase64 ? `<img src="${logoBase64}" style="max-width:260px; height:auto;"/>` : ''}</div>
              <div style="flex:1"></div>
              <div class="cert-number">
                ${certificado.numero_certificado ? `N° ${certificado.numero_certificado}` : ''}
                <div style="font-size:12px; color:#222; margin-top:8px; font-weight:400">Fecha emisión: ${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</div>
              </div>
            </div>

            <div style="text-align:center; font-weight:700; font-size:18px; margin:14px 0 12px 0">CERTIFICADO DE ANÁLISIS DE CALIDAD</div>

            <div class="title">INFORMACIÓN DEL PRODUCTO</div>

            <div class="header-block">
              <div class="box big-left">
                <div class="label">CLIENTE</div>
                <div class="value">${certificado.cliente_nombre || ''}</div>
              </div>
              <div class="box big-center">
                <div class="label">CONCEPTO</div>
                <div class="value">${certificado.referencia || certificado.descripcion || ''}</div>
              </div>
              <div class="box right-col">
                <div class="box small" style="border:0; padding:0; margin:0 0 6px 0;">
                  <div class="label">CÓDIGO</div>
                  <div class="value right-small">${certificado.codigo || ''}</div>
                </div>
                <div class="box small" style="margin-top:6px;">
                  <div class="label">CANTIDAD SOLICITADA</div>
                  <div class="small right-small">${certificado.cantidad || ''}</div>
                </div>
                <div class="box small" style="margin-top:6px;">
                  <div class="label">CANTIDAD DESPACHADA</div>
                  <div class="value right-small">${certificado.cantidad_despachada || ''}</div>
                </div>
                <div class="box small" style="margin-top:6px;">
                  <div class="label">LOTE DE DESPACHO</div>
                  <div class="value right-small">${certificado.lote_despacho || ''}</div>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:8px;">
              <div style="flex:1;">
                <div class="box">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div class="label">FECHA:</div>
                      <div class="small">${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</div>
                    </div>
                    <div>
                      <div class="label">ORDEN DE COMPRA:</div>
                      <div class="small">${certificado.orden_compra || ''}</div>
                    </div>
                    <div>
                      <div class="label">LOTE:</div>
                      <div class="lot-highlight">${certificado.lote || ''}</div>
                    </div>
                  </div>
                </div>
                <div class="box full-row" style="margin-top:8px;"><div class="label">MATERIAL:</div><div class="small">${certificado.material || ''}</div></div>
                <div class="box full-row" style="margin-top:8px;"><div class="label">RECUBRIMIENTO:</div><div class="small">${certificado.recubrimiento || ''}</div></div>
                <div style="display:flex; gap:8px; margin-top:8px;">
                  <div style="flex:1;" class="box">
                    <div class="label">FECHA DE ELABORACIÓN</div>
                    <div class="small">${certificado.fecha_elaboracion ? new Date(certificado.fecha_elaboracion).toLocaleDateString('es-EC') : ''}</div>
                  </div>
                  <div style="flex:1;" class="box">
                    <div class="label">FECHA DE CADUCIDAD</div>
                    <div class="small">${certificado.fecha_caducidad ? new Date(certificado.fecha_caducidad).toLocaleDateString('es-EC') : ''}</div>
                  </div>
                </div>
              </div>
              <div style="width:220px;">
                <div class="box">
                  <div class="label">TAMAÑO cm.</div>
                  <div class="value center">${certificado.tamano_cm || ''}</div>
                </div>
              </div>
            </div>

            <div class="section-title">CARACTERÍSTICAS CUANTITATIVAS</div>
            <div class="carac-wrap">
              <table class="carac">
                <thead>
                  <tr>
                    <th>CARACTERÍSTICAS</th>
                    <th>ESPECIFICACIONES</th>
                    <th>MÍNIMO</th>
                    <th>MEDIO</th>
                    <th>MÁXIMO</th>
                  </tr>
                </thead>
                <tbody>
                  ${caracteristicas && caracteristicas.length > 0 ? caracteristicas.map((c:any) => `
                    <tr>
                      <td>${c.nombre || ''}</td>
                      <td class="small">${c.unidad || ''}</td>
                      <td class="center">${c.minimo || ''}</td>
                      <td class="center">${c.nominal || ''}</td>
                      <td class="center">${c.maximo || ''}</td>
                    </tr>
                  `).join('') : `
                    <tr><td>LARGO (mm)</td><td></td><td></td><td></td><td></td></tr>
                    <tr><td>ANCHO (mm)</td><td></td><td></td><td></td><td></td></tr>
                    <tr><td>ESPESOR (mm)</td><td></td><td></td><td></td><td></td></tr>
                    <tr><td>ESPESOR (micras)</td><td></td><td></td><td></td><td></td></tr>
                  `}
                </tbody>
              </table>
            </div>

            <div class="obs">
              <div class="label">OBSERVACIONES:</div>
              <div class="box">${certificado.observaciones || 'MUNDOGRAFIC certifica que el 100% del producto se encuentra revisado y aprobado por el control de calidad.'}</div>
            </div>

            <div class="signs">
              <div class="sign">
                <div class="small">CORPORACIÓN MUNDOGRAFIC</div>
                <div style="margin-top:8px; font-weight:700;">APROBADO POR: ${certificado.inspeccionado_por || ''}</div>
                <div class="small" style="margin-top:6px">ÁREA / DEPARTAMENTO</div>
                <div style="margin-top:18px">FIRMA: ________________________</div>
              </div>
              <div class="sign">
                <div class="small">RECEPCIÓN DE PRODUCTO</div>
                <div style="margin-top:8px; font-weight:700;">${certificado.cliente_nombre || ''}</div>
                <div class="small" style="margin-top:6px">ÁREA / DEPARTAMENTO</div>
                <div style="margin-top:18px">FIRMA: ________________________</div>
              </div>
            </div>

          </div>
        </body>
        </html>
      `;

      // Generar PDF
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' } });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="certificado_${certificado.numero_certificado || id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generando PDF certificado:', error);
      res.status(500).json({ error: 'Error generando PDF' });
    }
  });

  // Endpoint de preview: generar PDF y devolver base64 para vista previa en frontend
  router.get('/:id/preview', authRequired(), checkPermission(client, 'certificados', 'leer'), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const certRes = await client.query('SELECT * FROM certificado_calidad WHERE id = $1', [id]);
      if (certRes.rows.length === 0) return res.status(404).json({ success: false, error: 'Certificado no encontrado' });
      const certificado = certRes.rows[0];
      const carRes = await client.query(`SELECT cm.id, cm.certificado_id, cm.caracteristica_id, cm.minimo, cm.nominal, cm.maximo, cm.orden, c.nombre, c.unidad
        FROM certificado_medicion cm
        LEFT JOIN caracteristica c ON cm.caracteristica_id = c.id
        WHERE cm.certificado_id = $1
        ORDER BY cm.orden ASC`, [id]);
      const caracteristicas = carRes.rows;

      const fs = require('fs/promises');
      const path = require('path');
      let logoBase64 = '';
      try {
        const candidates = [
          path.join(__dirname, '../../public/images/logo.png'),
          path.join(__dirname, '../../public/images/logo-mundografic.png')
        ];
        for (const p of candidates) {
          try {
            const b = await fs.readFile(p);
            logoBase64 = `data:image/png;base64,${b.toString('base64')}`;
            break;
          } catch (err) {
            // seguir
          }
        }
      } catch (e) {
        logoBase64 = '';
      }

      // Usar la misma plantilla visual para preview (consistente con el PDF).
      const html = `
          <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif; color: #000; margin:0; }
            .sheet { width: 100%; box-sizing: border-box; padding: 0.5cm 0.8cm; }

            /* Header */
            .header { display:flex; align-items:stretch; gap:14px; border-bottom:2px solid #000; padding-bottom:12px; }
            .logo { width:182px; }
            .company { flex:1; display:flex; flex-direction:column; justify-content:center; }
            .company-name { font-size:20px; font-weight:700; letter-spacing:0.6px; }
            .company-meta { font-size:12px; color:#222; margin-top:6px; }
            .cert-number { width:202px; text-align:right; font-weight:700; font-size:14px; }

            /* Title */
            .title { text-align:center; font-size:16px; font-weight:700; margin:16px 0 8px 0; }

            /* Info grid */
            .info-grid { width:100%; display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px; }
            .info-item { display:flex; }
            .info-label { width:142px; font-weight:700; font-size:13px; }
            .info-value { flex:1; border-bottom:1px solid #ddd; padding-bottom:6px; font-size:13px; }

            /* Measurements table */
            table.carac { width:100%; border-collapse:collapse; font-size:13px; margin-top:8px; }
            table.carac thead th { text-align:center; font-weight:700; padding:10px 8px; border-bottom:1px solid #000; }
            table.carac tbody td { padding:10px 8px; border-bottom:1px solid #e0e0e0; }
            table.carac tbody tr:nth-child(even) td { background:#f7f7f7; }
            .carac-name { text-align:left; padding-left:10px; }
            .carac-unidad { width:82px; text-align:center; }
            .carac-val { width:92px; text-align:center; }

            .observaciones { margin-top:14px; font-size:13px; }
            .obs-box { border:1px solid #000; padding:10px; min-height:50px; }

            .signatures { display:flex; gap:14px; margin-top:20px; }
            .sign-block { flex:1; border-top:1px solid #000; padding-top:10px; text-align:left; font-size:13px; }
            .sign-label { font-weight:700; font-size:13px; margin-bottom:8px; }

            .footer { position:fixed; bottom:10px; left:0; right:0; text-align:center; font-size:12px; color:#444; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="logo">${logoBase64 ? `<img src="${logoBase64}" style="max-width:230px; height:auto;"/>` : ''}</div>
                <div style="text-align:center; font-weight:700; font-size:18px; margin:14px 0 12px 0">CERTIFICADO DE ANÁLISIS DE CALIDAD</div>
              <div style="flex:1"></div>
              <div class="cert-number">
                ${certificado.numero_certificado ? `N° ${certificado.numero_certificado}` : ''}
              
                <div style="font-size:12px; color:#222; margin-top:8px; font-weight:400">Fecha emisión: ${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</div>
              
                <div style="font-size:12px; color:#222; margin-top:8px; font-weight:400">ORDEN DE COMPRA: ${certificado.orden_compra || ''}</div>
                  
              </div>
            </div>

            

            <div class="title">INFORMACIÓN DEL PRODUCTO</div>

            <div class="header-block">
              <div class="box big-left">
                <div class="label">CLIENTE</div>
                <div class="value">${certificado.cliente_nombre || ''}</div>
              </div>
              <div class="box big-center">
                <div class="label">CONCEPTO</div>
                <div class="value">${certificado.referencia || certificado.descripcion || ''}</div>
              </div>
              <div class="box right-col">
                <div class="box small" style="border:0; padding:0; margin:0 0 6px 0;">
                  <div class="label">CÓDIGO</div>
                  <div class="value right-small">${certificado.codigo || ''}</div>
                </div>
                <div class="box small" style="margin-top:6px;">
                  <div class="label">CANTIDAD SOLICITADA</div>
                  <div class="small right-small">${certificado.cantidad || ''}</div>
                </div>
                <div class="box small" style="margin-top:6px;">
                  <div class="label">CANTIDAD DESPACHADA</div>
                  <div class="value right-small">${certificado.cantidad_despachada || ''}</div>
                </div>
                <div class="box small" style="margin-top:6px;">
                  <div class="label">LOTE DE DESPACHO</div>
                  <div class="value right-small">${certificado.lote_despacho || ''}</div>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:8px;">
              <div style="flex:1;">
                <div class="box">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                      <div class="label">FECHA:</div>
                      <div class="small">${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</div>
                    </div>
                   
                    <div>
                      <div class="label">LOTE:</div>
                      <div class="lot-highlight">${certificado.lote || ''}</div>
                    </div>
                  </div>
                </div>
                <div class="box full-row" style="margin-top:8px;"><div class="label">MATERIAL:</div><div class="small">${certificado.material || ''}</div></div>
                <div class="box full-row" style="margin-top:8px;"><div class="label">RECUBRIMIENTO:</div><div class="small">${certificado.recubrimiento || ''}</div></div>
              </div>
              <div style="width:220px;">
                <div class="box">
                  <div class="label">TAMAÑO cm.</div>
                  <div class="value center">${certificado.tamano_cm || ''}</div>
                </div>
              </div>
            </div>

            <div class="section-title">CARACTERÍSTICAS CUANTITATIVAS</div>
            <table class="carac">
              <thead>
                <tr>
                  <th>CARACTERÍSTICA</th>
                  <th>UNIDAD</th>
                  <th>MÍNIMO</th>
                  <th>NOMINAL</th>
                  <th>MÁXIMO</th>
                </tr>
              </thead>
              <tbody>
                ${caracteristicas.map((c:any) => `
                  <tr>
                    <td>${c.nombre || ''}</td>
                    <td class="small">${c.unidad || ''}</td>
                    <td class="center">${c.minimo || ''}</td>
                    <td class="center">${c.nominal || ''}</td>
                    <td class="center">${c.maximo || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="obs">
              <div class="label">OBSERVACIONES:</div>
              <div class="box">${certificado.observaciones || ''}</div>
            </div>

            <div class="signs">
              <div class="sign">
                <div class="small">INSPECCIONADO POR</div>
                <div style="margin-top:8px; font-weight:700;">${certificado.inspeccionado_por || ''}</div>
                <div style="margin-top:14px">Firma: _________________________</div>
              </div>
              <div class="sign">
                <div class="small">RECEPCIÓN DE PRODUCTO</div>
                <div style="margin-top:8px; font-weight:700;">${certificado.cliente_nombre || ''}</div>
                <div style="margin-top:14px">Firma: _________________________</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' } });
      await browser.close();

      const pdfBase64 = pdfBuffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
      res.json({ success: true, pdf: dataUrl });
    } catch (error: any) {
      console.error('Error generando preview PDF certificado:', error);
      res.status(500).json({ success: false, error: 'Error generando preview' });
    }
  });

  // Crear certificado (y mediciones)
  router.post('/', authRequired(), checkPermission(client, 'certificados', 'crear'), async (req: any, res) => {
    const {
      numero_orden,
      cliente_nombre,
      producto_cod_mg,
      producto_cod_cliente,
      producto_descripcion,
      cantidad,
      codigo_producto,
      lote,
      orden_compra,
      fecha_elaboracion,
      fecha_caducidad,
      inspeccionado_por,
      observaciones,
      caracteristicas
    } = req.body;

    const userId = req.user?.id || null;

    try {
      await client.query('BEGIN');
      // Insertar en certificado_calidad
      const insertQuery = `INSERT INTO certificado_calidad (
        numero_certificado, fecha_elaboracion, fecha_caducidad, cliente_nombre,
        referencia, material, descripcion, cantidad, codigo, lote,
        cantidad_despachada, lote_despacho, tamano_cm, orden_compra,
        inspeccionado_por, observaciones, created_by, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now()) RETURNING id, numero_certificado`;

      // Mapear referencia/material/descripcion desde body o desde los campos producto_ para mayor compatibilidad
      const referenciaVal = req.body.referencia || producto_cod_mg || req.body.producto_cod_mg || null;
      const materialVal = req.body.material || producto_descripcion || req.body.producto_descripcion || null;
      const descripcionVal = req.body.descripcion || producto_descripcion || req.body.producto_descripcion || null;
      const codigoVal = req.body.codigo || codigo_producto || req.body.codigo_producto || null;

      const result = await client.query(insertQuery, [
        req.body.numero_certificado || null,
        fecha_elaboracion || null,
        fecha_caducidad || null,
        cliente_nombre || null,
        referenciaVal,
        materialVal,
        descripcionVal,
        cantidad || null,
        codigoVal,
        lote || null,
        req.body.cantidad_despachada || null,
        req.body.lote_despacho || null,
        req.body.tamano_cm || null,
        orden_compra || null,
        inspeccionado_por || null,
        observaciones || null,
        userId
      ]);

      const certificadoId = result.rows[0].id;

      // Insertar mediciones: preferimos caracteristica_id del payload; si no existe, resolvemos por nombre.
      if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
        for (let i = 0; i < caracteristicas.length; i++) {
          const c = caracteristicas[i];
          let nombre = c.nombre || c.name || null;
          let caracteristicaId: number | null = c.caracteristica_id || null;
          let unidadResolved: string | null = c.unidad || null;

          // Si nos dieron un id, obtener nombre/unidad del catálogo si falta información
          if (caracteristicaId) {
            const catRes = await client.query('SELECT id, nombre, unidad FROM caracteristica WHERE id = $1 LIMIT 1', [caracteristicaId]);
            if (catRes.rows.length > 0) {
              const cat = catRes.rows[0];
              nombre = nombre || cat.nombre || nombre;
              if (!unidadResolved && cat.unidad) unidadResolved = cat.unidad;
            } else {
              // id proporcionado pero no existe: ignorarlo
              caracteristicaId = null;
            }
          }

          // Si no hay id, intentamos resolver por nombre (case-insensitive)
          if (!caracteristicaId && nombre) {
            const catRes = await client.query('SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre) = lower($1) LIMIT 1', [nombre]);
            if (catRes.rows.length > 0) {
              caracteristicaId = catRes.rows[0].id;
              nombre = catRes.rows[0].nombre || nombre;
              if (!unidadResolved && catRes.rows[0].unidad) unidadResolved = catRes.rows[0].unidad;
            }
          }

          await client.query(`INSERT INTO certificado_medicion (
            certificado_id, caracteristica_id, minimo, nominal, maximo, orden
          ) VALUES ($1,$2,$3,$4,$5,$6)`, [certificadoId, caracteristicaId, c.minimo || null, c.nominal || null, c.maximo || null, c.orden || i]);
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ id: certificadoId, numero_certificado: result.rows[0].numero_certificado });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error al crear certificado:', error);
      res.status(500).json({ error: 'Error al crear certificado' });
    }
  });

  // Actualizar certificado
  router.put('/:id', authRequired(), checkPermission(client, 'certificados', 'editar'), async (req: any, res) => {
    const { id } = req.params;
    const {
      producto_cod_mg,
      producto_cod_cliente,
      producto_descripcion,
      cantidad,
      codigo_producto,
      lote,
      orden_compra,
      fecha_elaboracion,
      fecha_caducidad,
      inspeccionado_por,
      observaciones,
      caracteristicas
    } = req.body;

    const userId = req.user?.id || null;

    try {
      await client.query('BEGIN');
      const referenciaValUp = req.body.referencia || producto_cod_mg || req.body.producto_cod_mg || null;
      const materialValUp = req.body.material || producto_descripcion || req.body.producto_descripcion || null;
      const descripcionValUp = req.body.descripcion || producto_descripcion || req.body.producto_descripcion || null;
      const codigoValUp = req.body.codigo || codigo_producto || req.body.codigo_producto || null;

      await client.query(`UPDATE certificado_calidad SET
        fecha_elaboracion=$1, fecha_caducidad=$2, cliente_nombre=$3,
        referencia=$4, material=$5, descripcion=$6, cantidad=$7, codigo=$8, lote=$9,
        cantidad_despachada=$10, lote_despacho=$11, tamano_cm=$12, orden_compra=$13,
        inspeccionado_por=$14, observaciones=$15, updated_by=$16, updated_at=now()
        WHERE id=$17`, [
        fecha_elaboracion || null,
        fecha_caducidad || null,
        req.body.cliente_nombre || null,
        referenciaValUp,
        materialValUp,
        descripcionValUp,
        cantidad || null,
        codigoValUp,
        lote || null,
        req.body.cantidad_despachada || null,
        req.body.lote_despacho || null,
        req.body.tamano_cm || null,
        orden_compra || null,
        inspeccionado_por || null,
        observaciones || null,
        userId,
        id
      ]);

      // Reemplazar mediciones: eliminar existentes y reinsertar
      await client.query('DELETE FROM certificado_medicion WHERE certificado_id = $1', [id]);
      if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
        for (let i = 0; i < caracteristicas.length; i++) {
          const c = caracteristicas[i];
          let nombre = c.nombre || c.name || null;
          let caracteristicaId: number | null = c.caracteristica_id || null;
          let unidadResolved: string | null = c.unidad || null;

          if (caracteristicaId) {
            const catRes = await client.query('SELECT id, nombre, unidad FROM caracteristica WHERE id = $1 LIMIT 1', [caracteristicaId]);
            if (catRes.rows.length > 0) {
              const cat = catRes.rows[0];
              nombre = nombre || cat.nombre || nombre;
              if (!unidadResolved && cat.unidad) unidadResolved = cat.unidad;
            } else {
              caracteristicaId = null;
            }
          }

          if (!caracteristicaId && nombre) {
            const catRes = await client.query('SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre) = lower($1) LIMIT 1', [nombre]);
            if (catRes.rows.length > 0) {
              caracteristicaId = catRes.rows[0].id;
              nombre = catRes.rows[0].nombre || nombre;
              if (!unidadResolved && catRes.rows[0].unidad) unidadResolved = catRes.rows[0].unidad;
            }
          }

          await client.query(`INSERT INTO certificado_medicion (
            certificado_id, caracteristica_id, minimo, nominal, maximo, orden
          ) VALUES ($1,$2,$3,$4,$5,$6)`, [id, caracteristicaId, c.minimo || null, c.nominal || null, c.maximo || null, c.orden || i]);
        }
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error al actualizar certificado:', error);
      res.status(500).json({ error: 'Error al actualizar certificado' });
    }
  });

  // Eliminar certificado
  router.delete('/:id', authRequired(), checkPermission(client, 'certificados', 'eliminar'), async (req, res) => {
    const { id } = req.params;
    try {
      await client.query('DELETE FROM certificado_calidad WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error al eliminar certificado:', error);
      res.status(500).json({ error: 'Error al eliminar certificado' });
    }
  });

  return router;
};
