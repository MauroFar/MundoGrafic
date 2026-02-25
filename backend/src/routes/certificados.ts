import express from 'express';
import authRequired from '../middleware/auth';
import checkPermission from '../middleware/checkPermission';

export default (client: any) => {
  const router = express.Router();

  // Listar certificados
  router.get('/', authRequired(), checkPermission(client, 'certificados', 'leer'), async (req, res) => {
    try {
      const result = await client.query('SELECT * FROM certificado_calidad ORDER BY id DESC');
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error al listar certificados:', error);
      res.status(500).json({ error: 'Error al listar certificados' });
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
      const carRes = await client.query('SELECT * FROM certificado_medicion WHERE certificado_id = $1 ORDER BY orden ASC', [id]);
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
      const carRes = await client.query('SELECT * FROM certificado_medicion WHERE certificado_id = $1 ORDER BY orden ASC', [id]);
      const caracteristicas = carRes.rows;

      // Leer logo si existe
      const fs = require('fs/promises');
      const path = require('path');
      let logoBase64 = '';
      try {
        const logoPath = path.join(__dirname, '../../public/images/logo-mundografic.png');
        const b = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${b.toString('base64')}`;
      } catch (e) {
        logoBase64 = '';
      }

      // Generar HTML del certificado con márgenes y layout pedido
      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; margin: 0; }
            .page { padding: 1cm; box-sizing: border-box; }
            .header { display:flex; align-items:center; gap:16px; }
            .logo { width:180px; }
            .title-main { text-align:center; flex:1; font-size:16px; font-weight:700; }
            .section-title { text-align:center; font-size:14px; margin:12px 0; font-weight:700; }
            .info-table { width:100%; border-collapse: collapse; margin-bottom:8px; }
            .info-table td { padding:6px 4px; vertical-align:top; }
            .label { font-weight:700; width:40%; }
            .box { border:1px solid #000; padding:6px; min-height:40px; }
            table.carac { width:100%; border-collapse: collapse; margin-top:8px; }
            table.carac th, table.carac td { border:1px solid #000; padding:6px; text-align:center; }
            .observaciones { margin-top:12px; }
            .inspeccion { margin-top:20px; display:flex; gap:24px; }
            .inspeccion .field { border:1px solid #000; padding:8px; width:45%; min-height:48px; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="logo">${logoBase64 ? `<img src="${logoBase64}" style="max-width:160px"/>` : ''}</div>
              <div class="title-main">CERTIFICADO DE ANALISIS DE CALIDAD</div>
              <div style="width:160px; text-align:right; font-weight:700">${certificado.numero_certificado ? `N° ${certificado.numero_certificado}` : ''}</div>
            </div>

            <div class="section-title">INFORMACION GENERAL</div>

            <table class="info-table">
              <tr><td class="label">Fecha:</td><td>${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</td></tr>
              <tr><td class="label">Cliente:</td><td>${certificado.cliente_nombre || ''}</td></tr>
              <tr><td class="label">Referencia:</td><td>${certificado.referencia || certificado.descripcion || ''}</td></tr>
              <tr><td class="label">Material:</td><td>${certificado.material || ''}</td></tr>
              <tr><td class="label">Descripcion:</td><td>${certificado.descripcion || ''}</td></tr>
              <tr><td class="label">Cantidad:</td><td>${certificado.cantidad || ''}</td></tr>
              <tr><td class="label">Codigo:</td><td>${certificado.codigo || ''}</td></tr>
              <tr><td class="label">Lote:</td><td>${certificado.lote || ''}</td></tr>
              <tr><td class="label">Orden de Compra:</td><td>${certificado.orden_compra || ''}</td></tr>
              <tr><td class="label">Fecha Elaboracion:</td><td>${certificado.fecha_elaboracion ? new Date(certificado.fecha_elaboracion).toLocaleDateString('es-EC') : ''}</td></tr>
              <tr><td class="label">Fecha Caducidad:</td><td>${certificado.fecha_caducidad ? new Date(certificado.fecha_caducidad).toLocaleDateString('es-EC') : ''}</td></tr>
            </table>

            <div class="section-title">CARACTERISTICAS CUANTITATIVAS</div>
            <table class="carac">
              <thead>
                <tr>
                  <th>CARACTERISTICA</th>
                  <th>UNIDAD</th>
                  <th>MINIMO</th>
                  <th>NOMINAL</th>
                  <th>MAXIMO</th>
                </tr>
              </thead>
              <tbody>
                ${caracteristicas.map((c:any) => `
                  <tr>
                    <td style="text-align:left; padding-left:8px">${c.nombre}</td>
                    <td>${c.unidad || ''}</td>
                    <td>${c.minimo || ''}</td>
                    <td>${c.nominal || ''}</td>
                    <td>${c.maximo || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="observaciones">
              <strong>OBSERVACIONES:</strong>
              <div class="box">${certificado.observaciones || ''}</div>
            </div>

            <div class="inspeccion">
              <div class="field">
                <div style="font-weight:700; margin-bottom:6px">INSPECCIONADO POR</div>
                <div>Nombre: ${certificado.inspeccionado_por || ''}</div>
                <div style="margin-top:18px">Firma:</div>
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
      const carRes = await client.query('SELECT * FROM certificado_medicion WHERE certificado_id = $1 ORDER BY orden ASC', [id]);
      const caracteristicas = carRes.rows;

      const fs = require('fs/promises');
      const path = require('path');
      let logoBase64 = '';
      try {
        const logoPath = path.join(__dirname, '../../public/images/logo-mundografic.png');
        const b = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${b.toString('base64')}`;
      } catch (e) {
        logoBase64 = '';
      }

      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; margin: 0; }
            .page { padding: 1cm; box-sizing: border-box; }
            .header { display:flex; align-items:center; gap:16px; }
            .logo { width:180px; }
            .title-main { text-align:center; flex:1; font-size:16px; font-weight:700; }
            .section-title { text-align:center; font-size:14px; margin:12px 0; font-weight:700; }
            .info-table { width:100%; border-collapse: collapse; margin-bottom:8px; }
            .info-table td { padding:6px 4px; vertical-align:top; }
            .label { font-weight:700; width:40%; }
            .box { border:1px solid #000; padding:6px; min-height:40px; }
            table.carac { width:100%; border-collapse: collapse; margin-top:8px; }
            table.carac th, table.carac td { border:1px solid #000; padding:6px; text-align:center; }
            .observaciones { margin-top:12px; }
            .inspeccion { margin-top:20px; display:flex; gap:24px; }
            .inspeccion .field { border:1px solid #000; padding:8px; width:45%; min-height:48px; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="logo">${logoBase64 ? `<img src="${logoBase64}" style="max-width:160px"/>` : ''}</div>
              <div class="title-main">CERTIFICADO DE ANALISIS DE CALIDAD</div>
              <div style="width:160px; text-align:right; font-weight:700">${certificado.numero_certificado ? `N° ${certificado.numero_certificado}` : ''}</div>
            </div>

            <div class="section-title">INFORMACION GENERAL</div>

            <table class="info-table">
              <tr><td class="label">Fecha:</td><td>${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</td></tr>
              <tr><td class="label">Cliente:</td><td>${certificado.cliente_nombre || ''}</td></tr>
              <tr><td class="label">Referencia:</td><td>${certificado.referencia || certificado.descripcion || ''}</td></tr>
              <tr><td class="label">Material:</td><td>${certificado.material || ''}</td></tr>
              <tr><td class="label">Descripcion:</td><td>${certificado.descripcion || ''}</td></tr>
              <tr><td class="label">Cantidad:</td><td>${certificado.cantidad || ''}</td></tr>
              <tr><td class="label">Codigo:</td><td>${certificado.codigo || ''}</td></tr>
              <tr><td class="label">Lote:</td><td>${certificado.lote || ''}</td></tr>
              <tr><td class="label">Orden de Compra:</td><td>${certificado.orden_compra || ''}</td></tr>
              <tr><td class="label">Fecha Elaboracion:</td><td>${certificado.fecha_elaboracion ? new Date(certificado.fecha_elaboracion).toLocaleDateString('es-EC') : ''}</td></tr>
              <tr><td class="label">Fecha Caducidad:</td><td>${certificado.fecha_caducidad ? new Date(certificado.fecha_caducidad).toLocaleDateString('es-EC') : ''}</td></tr>
            </table>

            <div class="section-title">CARACTERISTICAS CUANTITATIVAS</div>
            <table class="carac">
              <thead>
                <tr>
                  <th>CARACTERISTICA</th>
                  <th>UNIDAD</th>
                  <th>MINIMO</th>
                  <th>NOMINAL</th>
                  <th>MAXIMO</th>
                </tr>
              </thead>
              <tbody>
                ${caracteristicas.map((c:any) => `
                  <tr>
                    <td style="text-align:left; padding-left:8px">${c.nombre}</td>
                    <td>${c.unidad || ''}</td>
                    <td>${c.minimo || ''}</td>
                    <td>${c.nominal || ''}</td>
                    <td>${c.maximo || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="observaciones">
              <strong>OBSERVACIONES:</strong>
              <div class="box">${certificado.observaciones || ''}</div>
            </div>

            <div class="inspeccion">
              <div class="field">
                <div style="font-weight:700; margin-bottom:6px">INSPECCIONADO POR</div>
                <div>Nombre: ${certificado.inspeccionado_por || ''}</div>
                <div style="margin-top:18px">Firma:</div>
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
        referencia, material, descripcion, cantidad, codigo, lote, orden_compra,
        inspeccionado_por, observaciones, created_by, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now()) RETURNING id, numero_certificado`;

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
        orden_compra || null,
        inspeccionado_por || null,
        observaciones || null,
        userId
      ]);

      const certificadoId = result.rows[0].id;

      // Insertar mediciones: intentamos resolver caracteristica_id y unidad desde catálogo
      if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
        for (let i = 0; i < caracteristicas.length; i++) {
          const c = caracteristicas[i];
          const nombre = c.nombre || c.name || null;
          let caracteristicaId: number | null = null;
          let unidadResolved: string | null = c.unidad || null;

          if (nombre) {
            const catRes = await client.query('SELECT id, unidad FROM caracteristica WHERE lower(nombre) = lower($1) LIMIT 1', [nombre]);
            if (catRes.rows.length > 0) {
              caracteristicaId = catRes.rows[0].id;
              if (!unidadResolved && catRes.rows[0].unidad) unidadResolved = catRes.rows[0].unidad;
            }
          }

          await client.query(`INSERT INTO certificado_medicion (
            certificado_id, caracteristica_id, nombre, minimo, nominal, maximo, unidad, orden
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [certificadoId, caracteristicaId, nombre, c.minimo || null, c.nominal || null, c.maximo || null, unidadResolved || null, c.orden || i]);
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
        referencia=$4, material=$5, descripcion=$6, cantidad=$7, codigo=$8, lote=$9, orden_compra=$10,
        inspeccionado_por=$11, observaciones=$12, updated_by=$13, updated_at=now()
        WHERE id=$14`, [
        fecha_elaboracion || null,
        fecha_caducidad || null,
        req.body.cliente_nombre || null,
        referenciaValUp,
        materialValUp,
        descripcionValUp,
        cantidad || null,
        codigoValUp,
        lote || null,
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
          const nombre = c.nombre || c.name || null;
          let caracteristicaId: number | null = null;
          let unidadResolved: string | null = c.unidad || null;

          if (nombre) {
            const catRes = await client.query('SELECT id, unidad FROM caracteristica WHERE lower(nombre) = lower($1) LIMIT 1', [nombre]);
            if (catRes.rows.length > 0) {
              caracteristicaId = catRes.rows[0].id;
              if (!unidadResolved && catRes.rows[0].unidad) unidadResolved = catRes.rows[0].unidad;
            }
          }

          await client.query(`INSERT INTO certificado_medicion (
            certificado_id, caracteristica_id, nombre, minimo, nominal, maximo, unidad, orden
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, caracteristicaId, nombre, c.minimo || null, c.nominal || null, c.maximo || null, unidadResolved || null, c.orden || i]);
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
