import path from "path";
import fs from "fs/promises";
import puppeteer from "puppeteer";
import { Certificado, CertificadoMedicion } from "../../domain/entities/certificados/Certificado";

export class CertificadoPdfService {
  // ── HTML Template ───────────────────────────────────────────────────────────

  generateHtml(certificado: Certificado, caracteristicas: CertificadoMedicion[], logoBase64: string): string {
    const referenciaRaw = (certificado.referencia ?? certificado.descripcion ?? "") as string;
    const referenciaHtml = referenciaRaw.replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");

    const formatMesAno = (d: any): string => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      const months = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre",
      ];
      return `${months[dt.getMonth()]}/${dt.getFullYear()}`;
    };

    const caracteristicasHtml = (() => {
      const rows = Array.isArray(caracteristicas) ? [...caracteristicas] : [];

      const hasEspMm = rows.some(
        (r) => String(r.nombre ?? "").toLowerCase().includes("espesor") &&
               String(r.unidad ?? "").toLowerCase().includes("mm"),
      );
      const hasEspMic = rows.some(
        (r) => String(r.nombre ?? "").toLowerCase().includes("espesor") &&
               String(r.unidad ?? "").toLowerCase().includes("mic"),
      );

      if (!hasEspMm && certificado.espesor_mm != null && certificado.espesor_mm !== "") {
        rows.push({ caracteristica_id: null, nombre: "ESPESOR (mm)",    unidad: "mm",     minimo: "", nominal: certificado.espesor_mm,     maximo: "", orden: rows.length });
      }
      if (!hasEspMic && certificado.espesor_micras4 != null && certificado.espesor_micras4 !== "") {
        rows.push({ caracteristica_id: null, nombre: "ESPESOR (micras)", unidad: "micras", minimo: "", nominal: certificado.espesor_micras4, maximo: "", orden: rows.length });
      }

      if (rows.length > 0) {
        return rows.map((c) => `
          <tr>
            <td>${c.nombre ?? ""}</td>
            <td class="small">${c.unidad ?? ""}</td>
            <td class="center">${c.minimo ?? ""}</td>
            <td class="center">${c.nominal ?? ""}</td>
            <td class="center">${c.maximo ?? ""}</td>
          </tr>`).join("");
      }

      return `
        <tr><td>LARGO (mm)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>ANCHO (mm)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>ESPESOR (mm)</td><td></td><td></td><td></td><td></td></tr>
        <tr><td>ESPESOR (micras)</td><td></td><td></td><td></td><td></td></tr>`;
    })();

    return `<html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 1cm; }
          body { font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif; color: #000; margin:0; font-size:14px; font-weight:400; }
          .value, .small, .label, .box, p, div { font-family: inherit; font-weight: inherit; }
          .sheet { width: 100%; box-sizing: border-box; padding: 0.4cm 0.6cm; }
          .header { display:flex; align-items:stretch; gap:14px; border-bottom:2px solid #000; padding-bottom:12px; }
          .logo { width:140px; }
          .header-title { font-size:18px; font-weight:700; text-align:center; letter-spacing:0.4px; }
          .cert-number { width:202px; text-align:right; font-weight:400; font-size:14px; }
          .title { text-align:center; font-size:16px; font-weight:700; margin:10px 0 6px 0; }
          .header-block { display:flex; gap:8px; margin-bottom:4px; align-items:flex-start; }
          .header-block .box { border:1.2px solid #c3c7cc; padding:6px; box-sizing:border-box; background:#fff; display:flex; flex-direction:column; }
          .box.big-left { flex:1.5; }
          .box.big-center { flex:1.1; display:flex; flex-direction:column; justify-content:flex-start; }
          .box.right-col { flex:0 0 180px; display:flex; flex-direction:column; gap:6px; align-items:stretch; }
          .box { border:1.2px solid #c3c7cc; padding:10px; box-sizing:border-box; background:#fff; }
          .label { font-size:11px; color:#6b7176; font-weight:400; margin-bottom:6px; text-transform:uppercase; }
          .label-lower { text-transform: none; }
          .value { font-size:14px; color:#0b2235; font-weight:400; margin-top:4px; }
          .small { font-size:14px; color:#0b2235; font-weight:400; }
          .right-small { text-align:right; }
          .right-col .small-box { border:1px solid #c3c7cc; padding:8px; background:#fff; display:flex; flex-direction:column; justify-content:center; }
          .right-col .row { display:flex; gap:8px; }
          .right-col .small-box .value { font-size:18px; font-weight:400; }
          .section-title { text-align:center; font-size:14px; font-weight:700; margin:18px 0 8px 0; text-transform:uppercase; }
          .carac-wrap { border:1.2px solid #c3c7cc; padding:6px; background:#fff; }
          table.carac { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; margin-top:8px; }
          table.carac thead th { text-align:center; font-weight:400; padding:10px 8px; border:1px solid #cfd6db; background:#f8f9fa; font-size:12px; }
          table.carac tbody td { padding:10px 8px; border:1px solid #e6e9ec; vertical-align:middle; }
          .carac-name { text-align:left; padding-left:10px; font-weight:400; }
          .carac-unidad { width:82px; text-align:center; }
          .carac-val { width:92px; text-align:center; font-weight:400; }
          .obs { margin-top:12px; }
          .obs .label { margin-bottom:4px; }
          .signs { margin-top:14px; }
          .sign-title { font-size:12px; color:#222; margin-bottom:6px; font-weight:400; }
          .sign-row { display:flex; gap:8px; }
          .sign-box { flex:1; border:1.2px solid #c3c7cc; padding:10px; box-sizing:border-box; background:#fff; min-height:56px; display:flex; flex-direction:column; }
          .sign-box .label { font-size:11px; color:#6b7176; font-weight:400; margin-bottom:6px; text-transform:uppercase; }
          .sign-box .value { font-size:13px; color:#0b2235; font-weight:400; }
          .center { text-align:center; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div class="logo">${logoBase64 ? `<img src="${logoBase64}" style="max-width:140px;height:auto;"/>` : ""}</div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;">
              <div class="header-title">CERTIFICADO DE ANÁLISIS DE CALIDAD</div>
            </div>
            <div class="cert-number">
              ${certificado.numero_certificado ? `N° ${certificado.numero_certificado}` : ""}
              <div style="font-size:12px;color:#222;margin-top:8px;font-weight:400">
                Fecha emisión: ${certificado.fecha_creacion ? new Date(certificado.fecha_creacion).toLocaleDateString("es-EC") : ""}
              </div>
              <div style="font-size:12px;color:#222;margin-top:6px;font-weight:400">
                ORDEN DE COMPRA: ${certificado.orden_compra ?? ""}
              </div>
            </div>
          </div>

          <div class="title">INFORMACIÓN DEL PRODUCTO</div>

          <div class="header-block">
            <div class="left-col" style="display:flex;flex-direction:column;gap:8px;flex:1.5;">
              <div class="box big-left">
                <div class="label">CLIENTE</div>
                <div class="value">${certificado.cliente_nombre ?? ""}</div>
              </div>
              <div style="display:flex;gap:8px;">
                <div class="box" style="flex:1;">
                  <div class="label">LOTE</div>
                  <div class="small">${certificado.lote ?? ""}</div>
                </div>
                <div class="box" style="flex:1;">
                  <div class="label">NÚMERO DE DESPACHO</div>
                  <div class="small right-small">${certificado.lote_despacho ?? ""}</div>
                </div>
              </div>
              <div class="box" style="flex:1;">
                <div class="label">MATERIAL</div>
                <div class="small">${certificado.material ?? ""}</div>
              </div>
              <div class="box big-left">
                <div class="label">TIPO DE TERMINADO</div>
                <div class="small">${certificado.descripcion ?? certificado.referencia ?? ""}</div>
              </div>
            </div>

            <div class="box big-center">
              <div class="label">REFERENCIA</div>
              <div class="value">${referenciaHtml}</div>
            </div>

            <div class="box right-col">
              <div class="small-box">
                <div class="label">CÓDIGO</div>
                <div class="value right-small">${certificado.codigo ?? ""}</div>
              </div>
              <div class="row">
                <div class="small-box" style="flex:1;">
                  <div class="label">CANTIDAD</div>
                  <div class="value right-small">${certificado.cantidad ?? ""}</div>
                </div>
                <div class="small-box" style="flex:1;">
                  <div class="label">CANTIDAD DESPACHADA</div>
                  <div class="value right-small">${certificado.cantidad_despachada ?? ""}</div>
                </div>
              </div>
              <div class="small-box" style="margin-top:6px;">
                <div class="label">TAMAÑO <span class="label-lower">cm.</span></div>
                <div class="value center">${certificado.tamano_cm ?? ""}</div>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:8px;margin-top:8px;">
            <div style="flex:1;">
              <div style="display:flex;gap:8px;margin-top:8px;">
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
              <tbody>${caracteristicasHtml}</tbody>
            </table>
          </div>

          <div class="obs">
            <div class="label">OBSERVACIONES:</div>
            <div class="box">${certificado.observaciones ?? "MUNDOGRAFIC certifica que el 100% del producto se encuentra revisado y aprobado por el control de calidad."}</div>
          </div>

          <div class="signs">
            <div class="sign-title">CORPORACIÓN MUNDOGRAFIC</div>
            <div class="sign-row">
              <div class="sign-box"><div class="label">APROBADO POR:</div><div class="value">${certificado.inspeccionado_por ?? ""}</div></div>
              <div class="sign-box"><div class="label">ÁREA / DEPARTAMENTO</div><div class="value">${certificado.aprobado_area ?? ""}</div></div>
              <div class="sign-box"><div class="label">FIRMA</div><div class="value">________________________</div></div>
            </div>
            <div style="height:10px"></div>
            <div class="sign-title">RECEPCIÓN DE PRODUCTO</div>
            <div class="sign-row">
              <div class="sign-box"><div class="label">CLIENTE</div><div class="value">${certificado.cliente_nombre ?? ""}</div></div>
              <div class="sign-box"><div class="label">ÁREA / DEPARTAMENTO</div><div class="value">${certificado.recepcion_area ?? ""}</div></div>
              <div class="sign-box"><div class="label">FIRMA</div><div class="value">________________________</div></div>
            </div>
          </div>
        </div>
      </body>
    </html>`;
  }

  // ── Logo ────────────────────────────────────────────────────────────────────

  async loadLogo(): Promise<string> {
    const candidates = [
      path.join(__dirname, "../../../public/images/logo.png"),
      path.join(__dirname, "../../../public/images/logo-mundografic.png"),
    ];
    for (const p of candidates) {
      try {
        const buf = await fs.readFile(p);
        return `data:image/png;base64,${buf.toString("base64")}`;
      } catch {
        // try next
      }
    }
    return "";
  }

  // ── Puppeteer ───────────────────────────────────────────────────────────────

  async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: true as any, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
