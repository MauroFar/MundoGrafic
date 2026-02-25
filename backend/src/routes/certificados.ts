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
        const logoPath = path.join(__dirname, '../../public/images/logo.png');
        const b = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${b.toString('base64')}`;
      } catch (e) {
        logoBase64 = '';
      }

      // Generar HTML del certificado (básico, ajusta estilos según plantilla)
      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
            .header { display:flex; align-items:center; gap:16px; }
            .title { text-align:center; flex:1 }
            .box { border:1px solid #000; padding:6px; }
            table{ width:100%; border-collapse: collapse; }
            td, th { border: 1px solid #000; padding:4px; }
            .no-border { border: none; }
            .center { text-align:center }
            .small { font-size:11px }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="width:180px">${logoBase64 ? `<img src="${logoBase64}" style="max-width:160px"/>` : ''}</div>
            <div class="title">
              <h2>CERTIFICADO DE ANALISIS DE CALIDAD</h2>
            </div>
            <div style="width:160px"></div>
          </div>

          <h3>INFORMACION GENERAL</h3>
          <table>
            <tr>
              <td><strong>FECHA:</strong> ${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</td>
                <td><strong>CLIENTE:</strong> ${certificado.cliente_nombre || ''}</td>
                <td><strong>REFERENCIA:</strong> ${certificado.referencia || certificado.descripcion || ''}</td>
            </tr>
            <tr>
              <td><strong>MATERIAL:</strong> ${certificado.material || ''}</td>
              <td><strong>CANTIDAD:</strong> ${certificado.cantidad || ''}</td>
              <td><strong>CODIGO:</strong> ${certificado.codigo || ''}</td>
            </tr>
            <tr>
              <td><strong>LOTE:</strong> ${certificado.lote || ''}</td>
              <td><strong>N° CERTIFICADO:</strong> ${certificado.numero_certificado || ''}</td>
              <td><strong>ORDEN DE COMPRA:</strong> ${certificado.orden_compra || ''}</td>
            </tr>
          </table>

          <h3>CARACTERISTICAS CUANTITATIVAS</h3>
          <table>
            <thead>
              <tr>
                <th>CARACTERISTICA</th>
                <th>MINIMO</th>
                <th>NOMINAL</th>
                <th>MAXIMO</th>
                <th>UNIDAD</th>
              </tr>
            </thead>
            <tbody>
              ${caracteristicas.map((c:any) => `
                <tr>
                  <td>${c.nombre}</td>
                  <td class="center">${c.minimo || ''}</td>
                  <td class="center">${c.nominal || ''}</td>
                  <td class="center">${c.maximo || ''}</td>
                  <td class="center">${c.unidad || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top:16px">
            <strong>OBSERVACIONES:</strong>
            <div class="box">${certificado.observaciones || ''}</div>
          </div>

          <div style="margin-top:24px; display:flex; gap:24px">
            <div style="flex:1">
              <div style="border:1px solid #000; padding:8px; width:240px">INSPECCIONADO POR:<br><div style="margin-top:8px">${certificado.inspeccionado_por || ''}</div></div>
            </div>
            <div style="flex:1"></div>
          </div>

        </body>
        </html>
      `;

      // Generar PDF
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
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
        const logoPath = path.join(__dirname, '../../public/images/logo.png');
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
            body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
            .header { display:flex; align-items:center; gap:16px; }
            .title { text-align:center; flex:1 }
            .box { border:1px solid #000; padding:6px; }
            table{ width:100%; border-collapse: collapse; }
            td, th { border: 1px solid #000; padding:4px; }
            .no-border { border: none; }
            .center { text-align:center }
            .small { font-size:11px }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="width:180px">${logoBase64 ? `<img src="${logoBase64}" style="max-width:160px"/>` : ''}</div>
            <div class="title">
              <h2>CERTIFICADO DE ANALISIS DE CALIDAD</h2>
            </div>
            <div style="width:160px"></div>
          </div>

          <h3>INFORMACION GENERAL</h3>
          <table>
            <tr>
              <td><strong>FECHA:</strong> ${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString('es-EC') : ''}</td>
                <td><strong>CLIENTE:</strong> ${certificado.cliente_nombre || ''}</td>
                <td><strong>REFERENCIA:</strong> ${certificado.referencia || certificado.descripcion || ''}</td>
            </tr>
            <tr>
              <td><strong>MATERIAL:</strong> ${certificado.material || ''}</td>
              <td><strong>CANTIDAD:</strong> ${certificado.cantidad || ''}</td>
              <td><strong>CODIGO:</strong> ${certificado.codigo || ''}</td>
            </tr>
            <tr>
              <td><strong>LOTE:</strong> ${certificado.lote || ''}</td>
              <td><strong>N° CERTIFICADO:</strong> ${certificado.numero_certificado || ''}</td>
              <td><strong>ORDEN DE COMPRA:</strong> ${certificado.orden_compra || ''}</td>
            </tr>
          </table>

          <h3>CARACTERISTICAS CUANTITATIVAS</h3>
          <table>
            <thead>
              <tr>
                <th>CARACTERISTICA</th>
                <th>MINIMO</th>
                <th>NOMINAL</th>
                <th>MAXIMO</th>
                <th>UNIDAD</th>
              </tr>
            </thead>
            <tbody>
              ${caracteristicas.map((c:any) => `
                <tr>
                  <td>${c.nombre}</td>
                  <td class="center">${c.minimo || ''}</td>
                  <td class="center">${c.nominal || ''}</td>
                  <td class="center">${c.maximo || ''}</td>
                  <td class="center">${c.unidad || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top:16px">
            <strong>OBSERVACIONES:</strong>
            <div class="box">${certificado.observaciones || ''}</div>
          </div>

          <div style="margin-top:24px; display:flex; gap:24px">
            <div style="flex:1">
              <div style="border:1px solid #000; padding:8px; width:240px">INSPECCIONADO POR:<br><div style="margin-top:8px">${certificado.inspeccionado_por || ''}</div></div>
            </div>
            <div style="flex:1"></div>
          </div>

        </body>
        </html>
      `;

      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
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
