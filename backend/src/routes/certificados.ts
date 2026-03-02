import express from "express";
import authRequired from "../middleware/auth";
import checkPermission from "../middleware/checkPermission";

export default (client: any) => {
  const router = express.Router();

  // Genera la plantilla HTML usada tanto para PDF como para preview
  function generateHtml(
    certificado: any,
    caracteristicas: any[],
    logoBase64: string,
  ) {
    const referenciaRaw = (certificado.referencia || certificado.descripcion || "") as string;
    const referenciaHtml = referenciaRaw.replace(/\r\n/g,'\n').replace(/\n/g,'<br/>');
    const formatMesAno = (d:any) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      const months = [
        'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'
      ];
      return `${months[dt.getMonth()]}/${dt.getFullYear()}`;
    };
    return `
         <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif; color: #000; margin:0; font-size:14px; font-weight:400; }
            /* Ensure most text inherits the body font and weight */
            .value, .small, .label, .box, p, div { font-family: inherit; font-weight: inherit; }
            .sheet { width: 100%; box-sizing: border-box; padding: 0.4cm 0.6cm; }

            /* Header */
            .header { display:flex; align-items:stretch; gap:14px; border-bottom:2px solid #000; padding-bottom:12px; }
            .logo { width:140px; }
            .company { flex:1; display:flex; flex-direction:column; justify-content:center; }
            .company-name { font-size:20px; font-weight:400; letter-spacing:0.6px; }
            .company-meta { font-size:12px; color:#222; margin-top:6px; }
            .cert-number { width:202px; text-align:right; font-weight:400; font-size:14px; }

            /* Title */
            .title { text-align:center; font-size:16px; font-weight:700; margin:10px 0 6px 0; }
            .header-title { font-size:18px; font-weight:700; text-align:center; letter-spacing:0.4px; }

            /* Product info block (three columns with boxed layout) */
            .header-block { display:flex; gap:8px; margin-bottom:4px; align-items:flex-start; }
            .header-block .box { border:1.2px solid #c3c7cc; padding:6px 6px; box-sizing:border-box; background:#fff; display:flex; flex-direction:column; }
            .box.big-left { flex:1.5; min-height:auto; max-height:84px; }
            .box.big-center { flex:1.1; min-height:auto; max-height:84px; display:flex; flex-direction:column; justify-content:flex-start; }
            .box.right-col { flex:0 0 180px; display:flex; flex-direction:column; gap:6px; align-items:stretch; }
            .box .label { font-size:11px; color:#6b7176; font-weight:400; margin-bottom:6px; text-transform:uppercase; }
            .box .value { font-size:14px; color:#0b2235; font-weight:400; margin-top:4px; }
            /* right column compact boxes */
            .right-col .small-box { padding:4px; min-height:30px; display:flex; flex-direction:column; justify-content:center; }
            .right-col .row { display:flex; gap:6px; }
            .right-col .small-box .value { font-size:15px; font-weight:400; }
            .right-col .small-box.small-qty { min-height:40px; }
              max-height:44px;
              overflow:hidden;
              display:block;
              line-height:1.1;
              word-break:break-word;
            }
            /* show ellipsis when content overflows (multiline clamp) */
            .box.big-left .value, .box.big-center .value {
              display:-webkit-box;
              -webkit-line-clamp:2;
              -webkit-box-orient:vertical;
              overflow:hidden;
            }
            /* Specific: keep small-box/right values bold, but cliente/referencia normal */
            .right-col .small-box .value { font-size:18px; font-weight:400; }
            .box.big-left .value, .box.big-center .value { font-size:14px; font-weight:400; }
            .right-col .small-box { border:1px solid #c3c7cc; padding:8px; background:#fff; }
            .right-col .row { display:flex; gap:8px; }
            .right-small { text-align:right; }
            .lot { background:transparent; padding:2px 6px; display:inline-block; font-weight:400; }
            .right-col .small-box .value { font-size:18px; }

            /* Info grid */
            .info-grid { width:100%; display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px; }
            .info-item { display:flex; }
            .info-label { width:142px; font-weight:400; font-size:13px; }
            .info-value { flex:1; border-bottom:1px solid #ddd; padding-bottom:6px; font-size:13px; }

            /* General box styling for consistent bordered look */
            .box { border:1.2px solid #c3c7cc; padding:10px; box-sizing:border-box; background:#fff; }
            .box.full-row { margin-top:8px; }
            .label { font-size:11px; color:#6b7176; font-weight:400; margin-bottom:6px; text-transform:uppercase; }
            .small { font-size:14px; color:#0b2235; font-weight:400; }
            .meta-row { display:flex; justify-content:space-between; align-items:center; }
            .meta-item { display:flex; flex-direction:column; }
            .meta-item .label { margin-bottom:4px; }

            /* Measurements table */
            table.carac { width:100%; border-collapse:collapse; font-size:13px; margin-top:8px; }
            table.carac thead th { text-align:center; font-weight:400; padding:10px 8px; border-bottom:1px solid #000; }
            table.carac tbody td { padding:10px 8px; border-bottom:1px solid #e0e0e0; }
            table.carac tbody tr:nth-child(even) td { background:#f7f7f7; }
            .carac-name { text-align:left; padding-left:10px; }
            .carac-unidad { width:82px; text-align:center; }
            .carac-val { width:92px; text-align:center; }

            .observaciones { margin-top:14px; font-size:13px; }
            .obs-box { border:1px solid #000; padding:10px; min-height:50px; }

            /* Section title for table */
            .section-title { text-align:center; font-size:14px; font-weight:700; margin:18px 0 8px 0; text-transform:uppercase; }

            /* Table box styling to match reference */
            .carac-wrap { border:1.2px solid #c3c7cc; padding:6px; background:#fff; }
            table.carac { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; margin-top:8px; }
            table.carac thead th { text-align:center; font-weight:400; padding:10px 8px; border:1px solid #cfd6db; background:#f8f9fa; font-size:12px; }
            table.carac tbody td { padding:10px 8px; border:1px solid #e6e9ec; vertical-align:middle; }
            table.carac tbody tr:nth-child(even) td { background: #fff; }
            .carac-name { text-align:left; padding-left:10px; font-weight:400; }
            .carac-unidad { width:82px; text-align:center; }
            .carac-val { width:92px; text-align:center; font-weight:400; }

            .signatures { display:flex; gap:14px; margin-top:20px; }
            .sign-block { flex:1; border-top:1px solid #000; padding-top:10px; text-align:left; font-size:13px; }
            .sign-label { font-weight:400; font-size:13px; margin-bottom:8px; }

            /* New signature boxes layout */
            .signs { margin-top:14px; }
            .sign-title { font-size:12px; color:#222; margin-bottom:6px; font-weight:400; }
            .sign-row { display:flex; gap:8px; }
            .sign-box { flex:1; border:1.2px solid #c3c7cc; padding:10px; box-sizing:border-box; background:#fff; min-height:56px; display:flex; flex-direction:column; justify-content:flex-start; }
            .sign-box .label { font-size:11px; color:#6b7176; font-weight:400; margin-bottom:6px; text-transform:uppercase; }
            .sign-box .value { font-size:13px; color:#0b2235; font-weight:400; }

            .footer { position:fixed; bottom:10px; left:0; right:0; text-align:center; font-size:12px; color:#444; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div class="logo">${logoBase64 ? `<img src="${logoBase64}" style="max-width:140px; height:auto;"/>` : ""}</div>
              <div style="flex:1; display:flex; align-items:center; justify-content:center;">
                <div class="header-title">CERTIFICADO DE ANÁLISIS DE CALIDAD</div>
              </div>
              <div class="cert-number">
                ${certificado.numero_certificado ? `N° ${certificado.numero_certificado}` : ""}
                <div style="font-size:12px; color:#222; margin-top:8px; font-weight:400">Fecha emisión: ${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString("es-EC") : ""}</div>
                <div style="font-size:12px; color:#222; margin-top:6px; font-weight:400">ORDEN DE COMPRA: ${certificado.orden_compra || ""}</div>
              </div>
            </div>


            <div class="title">INFORMACIÓN DEL PRODUCTO</div>

            <div class="header-block">
              <div class="left-col" style="display:flex; flex-direction:column; gap:8px; flex:1.5;">
                <div class="box big-left">
                  <div class="label">CLIENTE</div>
                  <div class="value">${certificado.cliente_nombre || ""}</div>
                </div>

                <div style="display:flex; gap:8px;">
                  <div class="box" style="flex:1;">
                    <div class="label">LOTE</div>
                    <div class="small">${certificado.lote || ""}</div>
                  </div>
                  <div class="box" style="flex:1;">
                    <div class="label">LOTE DE DESPACHO</div>
                    <div class="small right-small">${certificado.lote_despacho || ""}</div>
                  </div>
                </div>

                <div class="box" style="flex:1;">
                  <div class="label">MATERIAL</div>
                  <div class="small">${certificado.material || ""}</div>
                </div>

                <div class="box big-left">
                  <div class="label">TIPO DE TERMINADO</div>
                  <div class="small">${certificado.descripcion || certificado.recubrimiento || ""}</div>
                </div>
              </div>

              <div class="box big-center">
                <div class="label">REFERENCIA</div>
                  <div class="value">${referenciaHtml}</div>
              </div>

              

              <div class="box right-col">
                <div class="small-box">
                  <div class="label">CÓDIGO</div>
                  <div class="value right-small">${certificado.codigo || ""}</div>
                </div>
                <div class="row">
                  <div class="small-box" style="flex:1;">
                    <div class="label">CANTIDAD</div>
                    <div class="value right-small">${certificado.cantidad || ""}</div>
                  </div>
                  <div class="small-box" style="flex:1;">
                    <div class="label">CANTIDAD DESPACHADA</div>
                    <div class="value right-small">${certificado.cantidad_despachada || ""}</div>
                  </div>
                </div>
                <div class="small-box" style="margin-top:6px;">
                  

                   <div class="label">TAMAÑO cm.</div>
                  <div class="value center">${certificado.tamano_cm || ""}</div>
                </div>
              </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:8px;">
              <div style="flex:1;">
               
               
                <div style="display:flex; gap:8px; margin-top:8px;">
                  <div style="flex:1;" class="box">
                      <div class="label">FECHA DE ELABORACIÓN</div>
                      <div class="small">${formatMesAno(certificado.fecha_elaboracion)}</div>
                  </div>
                    <div style="flex:1;" class="box">
                      <div class="label">FECHA DE CADUCIDAD</div>
                      <div class="small">${formatMesAno(certificado.fecha_caducidad)}</div>
                    </div>
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
                  ${(() => {
                      // Ensure ESPESOR (mm) and ESPESOR (micras) are present or shown from certificado fields
                      const rows = Array.isArray(caracteristicas) ? [...caracteristicas] : [];
                      const hasEspMm = rows.some((r:any) => String(r.nombre || '').toLowerCase().includes('espesor') && String((r.unidad||'')).toLowerCase().includes('mm'));
                      const hasEspMic = rows.some((r:any) => String(r.nombre || '').toLowerCase().includes('espesor') && String((r.unidad||'')).toLowerCase().includes('mic'));
                      if (!hasEspMm && (certificado.espesor_mm !== undefined && certificado.espesor_mm !== null && certificado.espesor_mm !== '')) {
                        rows.push({ nombre: 'ESPESOR (mm)', unidad: 'mm', minimo: '', nominal: certificado.espesor_mm, maximo: '' });
                      }
                      if (!hasEspMic && (certificado.espesor_micras4 !== undefined && certificado.espesor_micras4 !== null && certificado.espesor_micras4 !== '')) {
                        rows.push({ nombre: 'ESPESOR (micras)', unidad: 'micras', minimo: '', nominal: certificado.espesor_micras4, maximo: '' });
                      }
                      if (rows && rows.length > 0) {
                        return rows
                          .map((c: any) => `
                      <tr>
                        <td>${c.nombre || ""}</td>
                        <td class="small">${c.unidad || ""}</td>
                        <td class="center">${c.minimo || ""}</td>
                        <td class="center">${c.nominal || ""}</td>
                        <td class="center">${c.maximo || ""}</td>
                      </tr>
                    `)
                          .join("");
                      }
                      return `
                      <tr><td>LARGO (mm)</td><td></td><td></td><td></td><td></td></tr>
                      <tr><td>ANCHO (mm)</td><td></td><td></td><td></td><td></td></tr>
                      <tr><td>ESPESOR (mm)</td><td></td><td></td><td></td><td></td></tr>
                      <tr><td>ESPESOR (micras)</td><td></td><td></td><td></td><td></td></tr>
                    `;
                    })()}
                </tbody>
              </table>
            </div>

            <div class="obs">
              <div class="label">OBSERVACIONES:</div>
              <div class="box">${certificado.observaciones || "MUNDOGRAFIC certifica que el 100% del producto se encuentra revisado y aprobado por el control de calidad."}</div>
            </div>

            <div class="signs">
              <div class="sign-title">CORPORACIÓN MUNDOGRAFIC</div>
              <div class="sign-row">
                <div class="sign-box">
                  <div class="label">APROBADO POR:</div>
                  <div class="value">${certificado.inspeccionado_por || ""}</div>
                </div>
                <div class="sign-box">
                  <div class="label">ÁREA / DEPARTAMENTO</div>
                  <div class="value">${certificado.aprobado_area || ""}</div>
                </div>
                <div class="sign-box">
                  <div class="label">FIRMA</div>
                  <div class="value">________________________</div>
                </div>
              </div>

              <div style="height:10px"></div>

              <div class="sign-title">RECEPCIÓN DE PRODUCTO</div>
              <div class="sign-row">
                <div class="sign-box">
                  <div class="label">CLIENTE</div>
                  <div class="value">${certificado.cliente_nombre || ""}</div>
                </div>
                <div class="sign-box">
                  <div class="label">ÁREA / DEPARTAMENTO</div>
                  <div class="value">${certificado.recepcion_area || ""}</div>
                </div>
                <div class="sign-box">
                  <div class="label">FIRMA</div>
                  <div class="value">________________________</div>
                </div>
              </div>
            </div>

          </div>
        </body>
        </html>
      `;
  }

  // Listar certificados
  router.get(
    "/",
    authRequired(),
    checkPermission(client, "certificados", "leer"),
    async (req, res) => {
      try {
        const result = await client.query(
          "SELECT * FROM certificado_calidad ORDER BY created_at DESC",
        );
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error al listar certificados:", error);
        res.status(500).json({ error: "Error al listar certificados" });
      }
    },
  );

  // Obtener siguiente número de certificado (sugerido) sin consumir la secuencia
  router.get(
    "/next-number",
    authRequired(),
    checkPermission(client, "certificados", "leer"),
    async (req, res) => {
      try {
        const seqRes = await client.query(
          "SELECT COALESCE(MAX(numero_secuencia), 0) + 1 AS next_seq FROM certificado_calidad",
        );
        const nextSeq = seqRes.rows[0]?.next_seq || 1;
        const yearRes = await client.query("SELECT to_char(now(),'YYYY') AS y");
        const year = yearRes.rows[0]?.y || new Date().getFullYear();
        const numero_certificado = `CERT-${year}-${String(nextSeq).padStart(6, "0")}`;
        res.json({ next_seq: nextSeq, numero_certificado });
      } catch (error: any) {
        console.error("Error al obtener next-number certificados:", error);
        res
          .status(500)
          .json({ error: "Error al calcular número de certificado" });
      }
    },
  );

  // Catalogo de caracteristicas (para el formulario)
  router.get(
    "/caracteristicas",
    authRequired(),
    checkPermission(client, "certificados", "leer"),
    async (req, res) => {
      try {
        const result = await client.query(
          "SELECT id, nombre, unidad FROM caracteristica ORDER BY nombre",
        );
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error al obtener catalogo de caracteristicas:", error);
        res.status(500).json({ error: "Error al obtener catalogo" });
      }
    },
  );

  // Obtener un certificado por id (incluye características)
  router.get(
    "/:id",
    authRequired(),
    checkPermission(client, "certificados", "leer"),
    async (req, res) => {
      const { id } = req.params;
      try {
        const certRes = await client.query(
          "SELECT * FROM certificado_calidad WHERE id = $1",
          [id],
        );
        if (certRes.rows.length === 0)
          return res.status(404).json({ error: "Certificado no encontrado" });
        const certificado = certRes.rows[0];
        const carRes = await client.query(
          `SELECT cm.id, cm.certificado_id, cm.caracteristica_id, cm.minimo, cm.nominal, cm.maximo, cm.orden, c.nombre, c.unidad
        FROM certificado_medicion cm
        LEFT JOIN caracteristica c ON cm.caracteristica_id = c.id
        WHERE cm.certificado_id = $1
        ORDER BY cm.orden ASC`,
          [id],
        );
        certificado.caracteristicas = carRes.rows;
        res.json(certificado);
      } catch (error: any) {
        console.error("Error al obtener certificado:", error);
        res.status(500).json({ error: "Error al obtener certificado" });
      }
    },
  );

  // Generar PDF del certificado
  router.get(
    "/:id/pdf",
    authRequired(),
    checkPermission(client, "certificados", "leer"),
    async (req: any, res: any) => {
      const { id } = req.params;
      try {
        const certRes = await client.query(
          "SELECT * FROM certificado_calidad WHERE id = $1",
          [id],
        );
        if (certRes.rows.length === 0)
          return res.status(404).json({ error: "Certificado no encontrado" });
        const certificado = certRes.rows[0];
        const carRes = await client.query(
          `SELECT cm.id, cm.certificado_id, cm.caracteristica_id, cm.minimo, cm.nominal, cm.maximo, cm.orden, c.nombre, c.unidad
        FROM certificado_medicion cm
        LEFT JOIN caracteristica c ON cm.caracteristica_id = c.id
        WHERE cm.certificado_id = $1
        ORDER BY cm.orden ASC`,
          [id],
        );
        const caracteristicas = carRes.rows;

        // Leer logo si existe (intenta logo.png primero, luego logo-mundografic.png)
        const fs = require("fs/promises");
        const path = require("path");
        let logoBase64 = "";
        try {
          const candidates = [
            path.join(__dirname, "../../public/images/logo.png"),
            path.join(__dirname, "../../public/images/logo-mundografic.png"),
          ];
          for (const p of candidates) {
            try {
              const b = await fs.readFile(p);
              logoBase64 = `data:image/png;base64,${b.toString("base64")}`;
              break;
            } catch (err) {
              // seguir al siguiente candidato
            }
          }
        } catch (e) {
          logoBase64 = "";
        }

        const html = generateHtml(certificado, caracteristicas, logoBase64);

        // Generar PDF
        const puppeteer = require("puppeteer");
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
        });
        await browser.close();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="certificado_${certificado.numero_certificado || id}.pdf"`,
        );
        res.send(pdfBuffer);
      } catch (error: any) {
        console.error("Error generando PDF certificado:", error);
        res.status(500).json({ error: "Error generando PDF" });
      }
    },
  );

  // Endpoint de preview: generar PDF y devolver base64 para vista previa en frontend
  router.get(
    "/:id/preview",
    authRequired(),
    checkPermission(client, "certificados", "leer"),
    async (req: any, res: any) => {
      const { id } = req.params;
      try {
        const certRes = await client.query(
          "SELECT * FROM certificado_calidad WHERE id = $1",
          [id],
        );
        if (certRes.rows.length === 0)
          return res
            .status(404)
            .json({ success: false, error: "Certificado no encontrado" });
        const certificado = certRes.rows[0];
        const carRes = await client.query(
          `SELECT cm.id, cm.certificado_id, cm.caracteristica_id, cm.minimo, cm.nominal, cm.maximo, cm.orden, c.nombre, c.unidad
        FROM certificado_medicion cm
        LEFT JOIN caracteristica c ON cm.caracteristica_id = c.id
        WHERE cm.certificado_id = $1
        ORDER BY cm.orden ASC`,
          [id],
        );
        const caracteristicas = carRes.rows;

        const fs = require("fs/promises");
        const path = require("path");
        let logoBase64 = "";
        try {
          const candidates = [
            path.join(__dirname, "../../public/images/logo.png"),
            path.join(__dirname, "../../public/images/logo-mundografic.png"),
          ];
          for (const p of candidates) {
            try {
              const b = await fs.readFile(p);
              logoBase64 = `data:image/png;base64,${b.toString("base64")}`;
              break;
            } catch (err) {
              // seguir
            }
          }
        } catch (e) {
          logoBase64 = "";
        }

        const html = generateHtml(certificado, caracteristicas, logoBase64);

        const puppeteer = require("puppeteer");
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
        });
        await browser.close();

        const pdfBase64 = pdfBuffer.toString("base64");
        const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
        res.json({ success: true, pdf: dataUrl });
      } catch (error: any) {
        console.error("Error generando preview PDF certificado:", error);
        res
          .status(500)
          .json({ success: false, error: "Error generando preview" });
      }
    },
  );

  // Crear certificado (y mediciones)
  router.post(
    "/",
    authRequired(),
    checkPermission(client, "certificados", "crear"),
    async (req: any, res) => {
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
        caracteristicas,
      } = req.body;

      const userId = req.user?.id || null;

      try {
        await client.query("BEGIN");
        // Insertar en certificado_calidad
        const insertQuery = `INSERT INTO certificado_calidad (
        numero_certificado, fecha_creacion, fecha_elaboracion, fecha_caducidad, cliente_nombre,
        referencia, material, descripcion, cantidad, codigo, lote,
        cantidad_despachada, lote_despacho, tamano_cm, orden_compra,
        inspeccionado_por, observaciones, aprobado_area, recepcion_area, created_by, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, now()) RETURNING id, numero_certificado`;

        // Mapear referencia/material/descripcion desde body o desde los campos producto_ para mayor compatibilidad
        const referenciaVal =
          req.body.referencia ||
          producto_cod_mg ||
          req.body.producto_cod_mg ||
          null;
        const materialVal =
          req.body.material ||
          producto_descripcion ||
          req.body.producto_descripcion ||
          null;
        const descripcionVal =
          req.body.descripcion ||
          producto_descripcion ||
          req.body.producto_descripcion ||
          null;
        const codigoVal =
          req.body.codigo ||
          codigo_producto ||
          req.body.codigo_producto ||
          null;

        const result = await client.query(insertQuery, [
          req.body.numero_certificado || null,
          req.body.fecha_creacion || null,
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
          req.body.aprobado_area || null,
          req.body.recepcion_area || null,
          userId,
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
              const catRes = await client.query(
                "SELECT id, nombre, unidad FROM caracteristica WHERE id = $1 LIMIT 1",
                [caracteristicaId],
              );
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
              const catRes = await client.query(
                "SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre) = lower($1)",
                [nombre],
              );
              if (catRes.rows.length > 0) {
                // Si el payload trajo unidad, preferimos la entrada que tenga la misma unidad (p.ej. 'mm')
                if (unidadResolved) {
                  const match = catRes.rows.find((r: any) => String((r.unidad || '')).toLowerCase() === String(unidadResolved).toLowerCase());
                  if (match) {
                    caracteristicaId = match.id;
                    nombre = match.nombre || nombre;
                    unidadResolved = unidadResolved || match.unidad;
                  } else {
                    caracteristicaId = catRes.rows[0].id;
                    nombre = catRes.rows[0].nombre || nombre;
                    unidadResolved = unidadResolved || catRes.rows[0].unidad;
                  }
                } else {
                  caracteristicaId = catRes.rows[0].id;
                  nombre = catRes.rows[0].nombre || nombre;
                  if (!unidadResolved && catRes.rows[0].unidad) unidadResolved = catRes.rows[0].unidad;
                }
              }
            }

            await client.query(
              `INSERT INTO certificado_medicion (
            certificado_id, caracteristica_id, minimo, nominal, maximo, orden
          ) VALUES ($1,$2,$3,$4,$5,$6)`,
              [
                certificadoId,
                caracteristicaId,
                c.minimo || null,
                c.nominal || null,
                c.maximo || null,
                c.orden || i,
              ],
            );
          }
        }
        // Persistir espesor_mm y espesor_micras4 si vienen en el payload o en las caracteristicas
        try {
          let espesorMmVal: any = null;
          if (req.body.espesor_mm !== undefined && req.body.espesor_mm !== null && req.body.espesor_mm !== '') {
            espesorMmVal = req.body.espesor_mm;
          } else if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
            // Preferir caracteristica con unidad 'mm'
            const espMm = caracteristicas.find((c:any) => String(c.nombre || c.name || '').toLowerCase().includes('espesor') && String((c.unidad || '')).toLowerCase().includes('mm'));
            if (espMm && espMm.nominal !== undefined && espMm.nominal !== null && espMm.nominal !== '') espesorMmVal = espMm.nominal;
            // Fallback: cualquier campo que parezca espesor
            if ((espesorMmVal === null || espesorMmVal === '') && caracteristicas.length > 0) {
              const espAny = caracteristicas.find((c:any) => String(c.nombre || c.name || '').toLowerCase().includes('espesor') && (c.nominal !== undefined && c.nominal !== null && c.nominal !== ''));
              if (espAny) espesorMmVal = espAny.nominal;
            }
          }
          let espesorMicVal: any = null;
          if (espesorMmVal !== null && espesorMmVal !== undefined && espesorMmVal !== '') {
            const num = parseFloat(String(espesorMmVal).replace(',', '.'));
            if (!isNaN(num)) {
              espesorMicVal = String(Number((num * 1000)).toFixed(4));
            }
            await client.query(
              "UPDATE certificado_calidad SET espesor_mm=$1, espesor_micras4=$2 WHERE id=$3",
              [espesorMmVal || null, espesorMicVal || null, certificadoId],
            );
          }
        } catch (e) {
          // no bloquear creación por error en este paso
          console.error('Error al persistir espesor en certificado:', e);
        }

        await client.query("COMMIT");
        res.status(201).json({
          id: certificadoId,
          numero_certificado: result.rows[0].numero_certificado,
        });
      } catch (error: any) {
        await client.query("ROLLBACK");
        console.error("Error al crear certificado:", error);
        res.status(500).json({ error: "Error al crear certificado" });
      }
    },
  );

  // Actualizar certificado
  router.put(
    "/:id",
    authRequired(),
    checkPermission(client, "certificados", "editar"),
    async (req: any, res) => {
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
        caracteristicas,
      } = req.body;

      const userId = req.user?.id || null;

      try {
        await client.query("BEGIN");
        const referenciaValUp =
          req.body.referencia ||
          producto_cod_mg ||
          req.body.producto_cod_mg ||
          null;
        const materialValUp =
          req.body.material ||
          producto_descripcion ||
          req.body.producto_descripcion ||
          null;
        const descripcionValUp =
          req.body.descripcion ||
          producto_descripcion ||
          req.body.producto_descripcion ||
          null;
        const codigoValUp =
          req.body.codigo ||
          codigo_producto ||
          req.body.codigo_producto ||
          null;

        await client.query(
          `UPDATE certificado_calidad SET
        fecha_creacion=$1, fecha_elaboracion=$2, fecha_caducidad=$3, cliente_nombre=$4,
        referencia=$5, material=$6, descripcion=$7, cantidad=$8, codigo=$9, lote=$10,
        cantidad_despachada=$11, lote_despacho=$12, tamano_cm=$13, orden_compra=$14,
        inspeccionado_por=$15, observaciones=$16, aprobado_area=$17, recepcion_area=$18, updated_by=$19, updated_at=now()
        WHERE id=$20`,
          [
            req.body.fecha_creacion || null,
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
            req.body.aprobado_area || null,
            req.body.recepcion_area || null,
            userId,
            id,
          ],
        );

        // Reemplazar mediciones: eliminar existentes y reinsertar
        await client.query(
          "DELETE FROM certificado_medicion WHERE certificado_id = $1",
          [id],
        );
        if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
          for (let i = 0; i < caracteristicas.length; i++) {
            const c = caracteristicas[i];
            let nombre = c.nombre || c.name || null;
            let caracteristicaId: number | null = c.caracteristica_id || null;
            let unidadResolved: string | null = c.unidad || null;

            if (caracteristicaId) {
              const catRes = await client.query(
                "SELECT id, nombre, unidad FROM caracteristica WHERE id = $1 LIMIT 1",
                [caracteristicaId],
              );
              if (catRes.rows.length > 0) {
                const cat = catRes.rows[0];
                nombre = nombre || cat.nombre || nombre;
                if (!unidadResolved && cat.unidad) unidadResolved = cat.unidad;
              } else {
                caracteristicaId = null;
              }
            }

            if (!caracteristicaId && nombre) {
              const catRes = await client.query(
                "SELECT id, nombre, unidad FROM caracteristica WHERE lower(nombre) = lower($1)",
                [nombre],
              );
              if (catRes.rows.length > 0) {
                if (unidadResolved) {
                  const match = catRes.rows.find((r: any) => String((r.unidad || '')).toLowerCase() === String(unidadResolved).toLowerCase());
                  if (match) {
                    caracteristicaId = match.id;
                    nombre = match.nombre || nombre;
                    unidadResolved = unidadResolved || match.unidad;
                  } else {
                    caracteristicaId = catRes.rows[0].id;
                    nombre = catRes.rows[0].nombre || nombre;
                    unidadResolved = unidadResolved || catRes.rows[0].unidad;
                  }
                } else {
                  caracteristicaId = catRes.rows[0].id;
                  nombre = catRes.rows[0].nombre || nombre;
                  if (!unidadResolved && catRes.rows[0].unidad) unidadResolved = catRes.rows[0].unidad;
                }
              }
            }

            await client.query(
              `INSERT INTO certificado_medicion (
            certificado_id, caracteristica_id, minimo, nominal, maximo, orden
          ) VALUES ($1,$2,$3,$4,$5,$6)`,
              [
                id,
                caracteristicaId,
                c.minimo || null,
                c.nominal || null,
                c.maximo || null,
                c.orden || i,
              ],
            );
          }
        }

        // Persistir espesor_mm y espesor_micras4 si vienen en el payload o en las caracteristicas
        try {
          let espesorMmVal: any = null;
          if (req.body.espesor_mm !== undefined && req.body.espesor_mm !== null && req.body.espesor_mm !== '') {
            espesorMmVal = req.body.espesor_mm;
          } else if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
            const espMm = caracteristicas.find((c:any) => String(c.nombre || c.name || '').toLowerCase().includes('espesor') && String((c.unidad || '')).toLowerCase().includes('mm'));
            if (espMm && espMm.nominal !== undefined && espMm.nominal !== null && espMm.nominal !== '') espesorMmVal = espMm.nominal;
            if ((espesorMmVal === null || espesorMmVal === '') && caracteristicas.length > 0) {
              const espAny = caracteristicas.find((c:any) => String(c.nombre || c.name || '').toLowerCase().includes('espesor') && (c.nominal !== undefined && c.nominal !== null && c.nominal !== ''));
              if (espAny) espesorMmVal = espAny.nominal;
            }
          }
          let espesorMicVal: any = null;
          if (espesorMmVal !== null && espesorMmVal !== undefined && espesorMmVal !== '') {
            const num = parseFloat(String(espesorMmVal).replace(',', '.'));
            if (!isNaN(num)) {
              espesorMicVal = String(Number((num * 1000)).toFixed(4));
            }
            await client.query(
              "UPDATE certificado_calidad SET espesor_mm=$1, espesor_micras4=$2 WHERE id=$3",
              [espesorMmVal || null, espesorMicVal || null, id],
            );
          }
        } catch (e) {
          console.error('Error al persistir espesor en certificado (update):', e);
        }

        await client.query("COMMIT");
        res.json({ success: true });
      } catch (error: any) {
        await client.query("ROLLBACK");
        console.error("Error al actualizar certificado:", error);
        res.status(500).json({ error: "Error al actualizar certificado" });
      }
    },
  );

  // Eliminar certificado
  router.delete(
    "/:id",
    authRequired(),
    checkPermission(client, "certificados", "eliminar"),
    async (req, res) => {
      const { id } = req.params;
      try {
        await client.query("DELETE FROM certificado_calidad WHERE id = $1", [
          id,
        ]);
        res.json({ success: true });
      } catch (error: any) {
        console.error("Error al eliminar certificado:", error);
        res.status(500).json({ error: "Error al eliminar certificado" });
      }
    },
  );

  return router;
};
