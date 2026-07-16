/**
 * OrdenPdfService
 * Genera PDFs de órdenes de trabajo (offset y digital) usando Puppeteer.
 * Extraído del legacy ordenTrabajo.ts.
 */
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import { Client } from 'pg';

export class OrdenPdfService {
  constructor(private readonly client: Client) {}

  // ─── OBTENER DATOS ────────────────────────────────────────────────────────

  async getOrdenConDetalle(id: number): Promise<{ orden: any; detalle: any } | null> {
    const result = await this.client.query(
      `SELECT ot.*, c.codigo_cotizacion AS numero_cotizacion
       FROM orden_trabajo ot
       LEFT JOIN cotizaciones c ON ot.id_cotizacion = c.id
       WHERE ot.id = $1`,
      [id],
    );
    if (!result.rows.length) return null;

    const orden = result.rows[0];
    const tipoOrden = orden.tipo_orden || 'offset';
    let detalle: any = {};

    if (tipoOrden === 'digital') {
      const dr = await this.client.query(
        `SELECT * FROM detalle_orden_trabajo_digital WHERE orden_trabajo_id = $1`, [id],
      );
      detalle = dr.rows[0] || {};
      const pr = await this.client.query(
        `SELECT * FROM productos_orden_digital WHERE orden_trabajo_id = $1 ORDER BY orden ASC`, [id],
      );
      detalle.productos_digital = pr.rows;
    } else {
      const dr = await this.client.query(
        `SELECT * FROM detalle_orden_trabajo_offset WHERE orden_trabajo_id = $1`, [id],
      );
      detalle = dr.rows[0] || {};
      const pr = await this.client.query(
        `SELECT * FROM productos_orden_offset WHERE orden_trabajo_id = $1 ORDER BY orden ASC`, [id],
      );
      detalle.productos_offset = pr.rows;
    }
    return { orden, detalle };
  }

  // ─── LEER ASSETS ─────────────────────────────────────────────────────────

  private async readAssetBase64(relativePath: string): Promise<string> {
    try {
      const fullPath = path.join(process.cwd(), 'public', relativePath);
      const buffer = await fs.readFile(fullPath);
      const ext = path.extname(relativePath).replace('.', '');
      return `data:image/${ext};base64,${buffer.toString('base64')}`;
    } catch {
      return '';
    }
  }

  // ─── GENERAR PDF ──────────────────────────────────────────────────────────

  async generatePdf(id: number): Promise<Buffer | null> {
    const data = await this.getOrdenConDetalle(id);
    if (!data) return null;

    const [logoBase64, salidaBase64] = await Promise.all([
      this.readAssetBase64('images/logo-mundografic.png'),
      this.readAssetBase64('img/salidas.png'),
    ]);

    const tipoOrden = data.orden.tipo_orden || 'offset';
    const html = tipoOrden === 'digital'
      ? this.buildHtmlDigital(data.orden, data.detalle, logoBase64, salidaBase64)
      : this.buildHtmlOffset(data.orden, data.detalle, logoBase64, salidaBase64);

    const browser = await puppeteer.launch({
      headless: 'new' as any,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
      scale: 0.95,
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  // ─── HELPERS TRAZABILIDAD ────────────────────────────────────────────────

  private parseTrazabilidad(raw: any): any {
    const base: Record<string, any> = {};
    const keys = ['preprensa','impresion','laminado','barnizado','troquelado_flexible',
      'troquelado_plano','rebobinado','refilado_termoencogible','sellado_termoencogible',
      'corte_termoencogible','terminado','liberacion_producto'];
    const empty = { fecha_inicio:'', hora_inicio:'', fecha_fin:'', hora_fin:'',
      cantidad:'', observaciones:'', firma:'' };
    keys.forEach(k => { base[k] = { ...empty }; });
    if (!raw) return { ...base, procesos_seleccionados: [...keys], mostrar_total_metros: false };
    let parsed = raw;
    if (typeof raw === 'string') { try { parsed = JSON.parse(raw); } catch { parsed = {}; } }
    const result: any = {};
    keys.forEach(k => { result[k] = { ...empty, ...(parsed[k] || {}) }; });
    result.troquelado = { ...empty, ...(parsed.troquelado_flexible || parsed.troquelado || {}) };
    result.terminados = { ...empty, ...(parsed.terminado || parsed.terminados || {}) };
    result.procesos_seleccionados = Array.isArray(parsed.procesos_seleccionados)
      ? parsed.procesos_seleccionados.filter((k: any) => keys.includes(k)) : [...keys];
    result.mostrar_total_metros = parsed.mostrar_total_metros === true || parsed.mostrar_total_metros === 'true';
    return result;
  }

  private buildTrazabilidadRows(detalle: any, procesos: any[]): string {
    const traza = this.parseTrazabilidad(detalle?.trazabilidad_proceso);
    const selected = Array.isArray(traza.procesos_seleccionados) ? new Set(traza.procesos_seleccionados) : null;
    return procesos
      .filter((p: any) => !selected || selected.has(p.key))
      .map((p: any) => {
        const t = traza[p.key] || {};
        return `<tr>
          <td class="tc tp">${p.titulo}</td><td class="tc">${p.responsable||''}</td>
          <td class="tc">${t.fecha_inicio||''}</td><td class="tc">${t.hora_inicio||''}</td>
          <td class="tc">${t.fecha_fin||''}</td><td class="tc">${t.hora_fin||''}</td>
          <td class="tc">${t.cantidad||p.cantidadFinal||''}</td>
          <td class="tc to">${t.observaciones||''}</td><td class="tc tf"></td></tr>`;
      }).join('');
  }


  // ─── HTML OFFSET ─────────────────────────────────────────────────────────

  private buildHtmlOffset(orden: any, detalle: any, logo: string, _salida: string): string {
    const traza = this.parseTrazabilidad(detalle?.trazabilidad_proceso);
    const lib = traza.liberacion_producto || {};
    const filas = this.buildTrazabilidadRows(detalle, [
      { key:'preprensa', titulo:'PREPRENSA', responsable: detalle.preprensa, cantidadFinal: detalle.preprensa_cantidad_final },
      { key:'impresion', titulo:'IMPRESION', responsable: detalle.prensa,    cantidadFinal: detalle.prensa_cantidad_final },
      { key:'terminados',titulo:'TERMINADOS',responsable: detalle.terminados,cantidadFinal: detalle.terminados_cantidad_final },
    ]);
    const productos = (detalle.productos_offset || []).map((p: any) =>
      `${p.concepto||''} (${p.cantidad||''})`.trim().replace(/\(\)$/,'')).join(' | ');
    const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:12px;font-size:9px;color:#333}
.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:6px;margin-bottom:8px}
.hdr img{height:35px}.hdr-r{text-align:right;font-size:8px}.hdr-n{font-size:14px;font-weight:bold}
.tit{text-align:center;font-size:13px;font-weight:bold;margin-bottom:8px}
.sec{margin-bottom:6px;border:1px solid #ddd}.sec-t{background:#f0f0f0;padding:3px 6px;font-weight:bold;font-size:9px;border-bottom:1px solid #ddd}
.sec-c{padding:5px}.fila{display:flex;gap:6px;margin-bottom:3px}.campo{flex:1}
.lbl{font-size:7px;color:#666;margin-bottom:1px;font-weight:bold}.val{border:1px solid #ddd;padding:3px 5px;font-size:8px;background:white;min-height:20px}
.pb{page-break-before:always;break-before:page}.trz{width:100%;border-collapse:collapse}
.tc{border:1px solid #d7d7d7;padding:4px;font-size:8px;vertical-align:top}.th{background:#f3f4f6;font-weight:bold;text-align:center}
.tp{font-weight:bold;white-space:nowrap}.to{min-width:150px}.tf{min-width:60px;height:30px}`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
<div class="hdr"><div>${logo ? `<img src="${logo}">` : '<strong>MUNDOGRAFIC</strong>'}</div>
<div class="hdr-r"><div class="hdr-n">Orden de Trabajo OFFSET</div>
<div>Orden Nº: <strong>${orden.numero_orden||''}</strong></div>
<div>Orden de Compra: ${orden.orden_compra||''}</div><div>Cotización Nº: ${orden.numero_cotizacion||''}</div></div></div>
<div class="tit">ORDEN DE TRABAJO - OFFSET</div>
<div class="sec"><div class="sec-t">Información del Cliente</div><div class="sec-c">
<div class="fila">
<div class="campo" style="flex:2"><div class="lbl">CLIENTE</div><div class="val">${orden.nombre_cliente||''}</div></div>
<div class="campo"><div class="lbl">CONTACTO</div><div class="val">${orden.contacto||''}</div></div>
<div class="campo"><div class="lbl">TELÉFONO</div><div class="val">${orden.telefono||''}</div></div>
<div class="campo" style="flex:1.5"><div class="lbl">EMAIL</div><div class="val">${orden.email||''}</div></div>
</div></div></div>
<div class="sec"><div class="sec-t">Información del Trabajo</div><div class="sec-c">
<div class="fila">
<div class="campo" style="flex:2"><div class="lbl">CONCEPTO</div><div class="val">${productos}</div></div>
<div class="campo"><div class="lbl">FECHA CREACIÓN</div><div class="val">${orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString('es-EC') : ''}</div></div>
<div class="campo"><div class="lbl">FECHA ENTREGA</div><div class="val">${orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-EC') : ''}</div></div>
</div></div></div>
<div class="sec"><div class="sec-t">Material y Pliegos</div><div class="sec-c"><div class="fila">
<div class="campo" style="flex:2"><div class="lbl">MATERIAL</div><div class="val">${detalle.material||''}</div></div>
<div class="campo"><div class="lbl">CORTE MATERIAL</div><div class="val">${detalle.corte_material||''}</div></div>
<div class="campo"><div class="lbl">PLIEGOS COMPRA</div><div class="val">${detalle.cantidad_pliegos_compra||''}</div></div>
<div class="campo"><div class="lbl">EXCESO</div><div class="val">${detalle.exceso||''}</div></div>
<div class="campo"><div class="lbl">TOTAL</div><div class="val">${detalle.total_pliegos||''}</div></div>
</div></div></div>
<div class="sec"><div class="sec-t">Impresión y Acabados</div><div class="sec-c"><div class="fila">
<div class="campo"><div class="lbl">IMPRESIÓN</div><div class="val">${detalle.impresion||''}</div></div>
<div class="campo" style="flex:2"><div class="lbl">INSTRUCCIONES IMPRESIÓN</div><div class="val">${detalle.instrucciones_impresion||''}</div></div>
</div><div class="fila">
<div class="campo"><div class="lbl">INSTRUCCIONES ACABADOS</div><div class="val">${detalle.instrucciones_acabados||''}</div></div>
<div class="campo"><div class="lbl">INSTRUCCIONES EMPACADO</div><div class="val">${detalle.instrucciones_empacado||''}</div></div>
</div></div></div>
<div class="sec pb"><div class="sec-t">Responsables del Proceso</div><div class="sec-c">
<div class="fila" style="margin-bottom:6px"><div class="campo"><div class="lbl">VENDEDOR</div><div class="val">${detalle.vendedor||''}</div></div></div>
<table class="trz"><thead><tr>
<th class="tc th">Proceso</th><th class="tc th">Responsable</th><th class="tc th">F. Inicio</th>
<th class="tc th">H. Inicio</th><th class="tc th">F. Fin</th><th class="tc th">H. Fin</th>
<th class="tc th">Cantidad</th><th class="tc th">Observaciones</th><th class="tc th">Firma</th>
</tr></thead><tbody>${filas}</tbody></table></div></div>
<div class="sec"><div class="sec-t">Liberación Producto</div><div class="sec-c">
<table class="trz"><thead><tr>
<th class="tc th">Responsable</th><th class="tc th">Fecha</th><th class="tc th">Hora</th>
<th class="tc th">Cantidad</th><th class="tc th">Observaciones</th><th class="tc th">Firma</th>
</tr></thead><tbody><tr>
<td class="tc">${detalle.liberacion_producto||''}</td>
<td class="tc">${lib.fecha_inicio||''}</td><td class="tc">${lib.hora_inicio||''}</td>
<td class="tc">${lib.cantidad||detalle.liberacion_producto_cantidad_final||''}</td>
<td class="tc to">${lib.observaciones||''}</td><td class="tc tf"></td>
</tr></tbody></table></div></div>
</body></html>`;
  }


  // ─── HTML DIGITAL ────────────────────────────────────────────────────────

  private buildHtmlDigital(orden: any, detalle: any, logo: string, salida: string): string {
    const traza = this.parseTrazabilidad(detalle?.trazabilidad_proceso);
    const lib = traza.liberacion_producto || {};
    let productos: any[] = [];
    try {
      productos = Array.isArray(detalle.productos_digital) ? detalle.productos_digital
        : (typeof detalle.productos_digital === 'string' ? JSON.parse(detalle.productos_digital) : []);
    } catch { productos = []; }

    const mostrarTotal = traza.mostrar_total_metros === true || traza.mostrar_total_metros === 'true';
    const totalMetros = productos.reduce((acc: number, p: any) => {
      const v = parseFloat(String(p?.metros_impresos||'').replace(',','.').trim());
      return acc + (isFinite(v) ? v : 0);
    }, 0);
    const totalDisplay = Number.isInteger(totalMetros) ? String(totalMetros) : totalMetros.toFixed(2);

    const filasProductos = productos.map((p: any, i: number) =>
      `<tr><td class="tc">${i+1}</td><td class="tc">${p.cantidad||''}</td><td class="tc">${p.cod_mg||''}</td>
       <td class="tc">${p.cod_cliente||''}</td><td class="tc">${p.producto||''}</td>
       <td class="tc">${p.gap_horizontal||''}</td><td class="tc">${p.medida_ancho||''}</td>
       <td class="tc">${p.gap_vertical||''}</td><td class="tc">${p.medida_alto||''}</td>
       <td class="tc">${p.cavidad||''}</td><td class="tc">${p.metros_impresos||''}</td>
       <td class="tc" style="font-weight:bold">${p.numero_salida||''}</td></tr>`
    ).join('');

    const filas = this.buildTrazabilidadRows(detalle, [
      { key:'preprensa',               titulo:'PRE-PRENSA',              responsable: detalle.preprensa_responsable||detalle.preprensa,             cantidadFinal: detalle.preprensa_cantidad_final },
      { key:'impresion',               titulo:'IMPRESION',               responsable: detalle.impresion_responsable||detalle.prensa,                cantidadFinal: detalle.prensa_cantidad_final },
      { key:'laminado',                titulo:'LAMINADO',                responsable: detalle.laminado_responsable||detalle.laminado_barnizado,     cantidadFinal: detalle.laminado_barnizado_cantidad_final },
      { key:'barnizado',               titulo:'BARNIZADO',               responsable: detalle.barnizado_responsable,                                cantidadFinal: '' },
      { key:'troquelado_flexible',     titulo:'TROQUELADO FLEXIBLE',     responsable: detalle.troquelado_flexible_responsable||detalle.troquelado, cantidadFinal: detalle.troquelado_cantidad_final },
      { key:'troquelado_plano',        titulo:'TROQUELADO PLANO',        responsable: detalle.troquelado_plano_responsable,                        cantidadFinal: '' },
      { key:'rebobinado',              titulo:'REBOBINADO',              responsable: detalle.rebobinado_responsable,                               cantidadFinal: '' },
      { key:'refilado_termoencogible', titulo:'REFILADO TERMOENCOGIBLE', responsable: detalle.refilado_termoencogible_responsable,                 cantidadFinal: '' },
      { key:'sellado_termoencogible',  titulo:'SELLADO TERMOENCOGIBLE',  responsable: detalle.sellado_termoencogible_responsable,                  cantidadFinal: '' },
      { key:'corte_termoencogible',    titulo:'CORTE TERMOENCOGIBLE',    responsable: detalle.corte_termoencogible_responsable,                    cantidadFinal: '' },
      { key:'terminado',               titulo:'TERMINADO',               responsable: detalle.terminado_responsable||detalle.terminados,           cantidadFinal: detalle.terminados_cantidad_final },
    ]);

    const mostrarLib = !Array.isArray(traza.procesos_seleccionados) || traza.procesos_seleccionados.length === 0 || traza.procesos_seleccionados.includes('liberacion_producto');

    const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:20px;font-size:11px;color:#333}
.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:15px}
.hdr img{height:45px}.hdr-r{text-align:right;font-size:10px}.hdr-n{font-size:18px;font-weight:bold}
.tit{text-align:center;font-size:16px;font-weight:bold;margin-bottom:12px}
.sec{margin-bottom:12px;border:1px solid #ddd}.sec-t{background:#f0f0f0;padding:6px 10px;font-weight:bold;font-size:11px;border-bottom:1px solid #ddd}
.sec-c{padding:10px}.fila{display:flex;gap:10px;margin-bottom:6px}.campo{flex:1}
.lbl{font-size:9px;color:#666;margin-bottom:3px;font-weight:bold}.val{border:1px solid #ddd;padding:5px 8px;font-size:10px;background:white;min-height:28px}
.tp-tbl{width:100%;border-collapse:collapse;margin-top:8px}.th{background:#f5f5f5;font-size:9px;font-weight:bold;text-align:center}
.tc{border:1px solid #ddd;padding:4px 6px;font-size:9px;text-align:center}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pb{page-break-before:always;break-before:page}.trz{width:100%;border-collapse:collapse;margin-top:8px}
.tp{font-weight:bold;white-space:nowrap}.to{min-width:160px}.tf{min-width:60px;height:30px}`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${css}</style></head><body>
<div class="hdr"><div>${logo ? `<img src="${logo}">` : '<strong>MUNDOGRAFIC</strong>'}</div>
<div class="hdr-r"><div class="hdr-n">Orden de Trabajo DIGITAL</div>
<div>Orden Nº: <strong>${orden.numero_orden||''}</strong></div>
<div>Orden de Compra: ${orden.orden_compra||''}</div><div>Cotización Nº: ${orden.numero_cotizacion||''}</div></div></div>
<div class="tit">ORDEN DE TRABAJO - DIGITAL</div>
<div class="sec"><div class="sec-t">Información del Cliente</div><div class="sec-c">
<div class="fila">
<div class="campo"><div class="lbl">CLIENTE</div><div class="val">${orden.nombre_cliente||''}</div></div>
<div class="campo"><div class="lbl">CONTACTO</div><div class="val">${orden.contacto||''}</div></div>
</div><div class="fila">
<div class="campo"><div class="lbl">TELÉFONO</div><div class="val">${orden.telefono||''}</div></div>
<div class="campo"><div class="lbl">EMAIL</div><div class="val">${orden.email||''}</div></div>
</div><div class="fila">
<div class="campo"><div class="lbl">FECHA CREACIÓN</div><div class="val">${orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString('es-EC') : ''}</div></div>
<div class="campo"><div class="lbl">FECHA ENTREGA</div><div class="val">${orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString('es-EC') : ''}</div></div>
</div></div></div>
<div class="sec"><div class="sec-t">Productos ${salida ? `<img src="${salida}" style="height:30px;float:right">` : ''}</div><div class="sec-c">
<table class="tp-tbl"><thead><tr class="th">
<th class="tc">#</th><th class="tc">Cantidad</th><th class="tc">Cod MG</th><th class="tc">Cod Cliente</th>
<th class="tc">Producto</th><th class="tc">Gap H</th><th class="tc">Ancho</th><th class="tc">Gap V</th>
<th class="tc">Alto</th><th class="tc">Cabida</th><th class="tc">Metros Imp.</th><th class="tc">Nº Salida</th>
</tr></thead><tbody>${filasProductos||'<tr><td colspan="12" class="tc">Sin productos</td></tr>'}</tbody>
${mostrarTotal ? `<tfoot><tr><td colspan="10"></td><td class="tc" style="font-weight:bold">Total: ${totalDisplay}</td><td></td></tr></tfoot>` : ''}
</table></div></div>
<div class="sec"><div class="sec-t">Información Técnica</div><div class="sec-c"><div class="grid3">
<div class="campo"><div class="lbl">ADHERENCIA</div><div class="val">${detalle.adherencia||''}</div></div>
<div class="campo"><div class="lbl">MATERIAL</div><div class="val">${detalle.material||''}</div></div>
<div class="campo"><div class="lbl">PROVEEDOR MATERIAL</div><div class="val">${detalle.proveedor_material||''}</div></div>
<div class="campo"><div class="lbl">ESPESOR (Micras)</div><div class="val">${detalle.espesor||''}</div></div>
<div class="campo"><div class="lbl">LOTE MATERIAL</div><div class="val">${detalle.lote_material||''}</div></div>
<div class="campo"><div class="lbl">LOTE PRODUCCIÓN</div><div class="val">${detalle.lote_produccion||''}</div></div>
<div class="campo"><div class="lbl">IMPRESIÓN</div><div class="val">${detalle.impresion||''}</div></div>
<div class="campo"><div class="lbl">TIPO IMPRESIÓN</div><div class="val">${detalle.tipo_impresion||''}</div></div>
<div class="campo"><div class="lbl">TROQUEL</div><div class="val">${detalle.troquel||''}</div></div>
<div class="campo"><div class="lbl">CÓDIGO TROQUEL</div><div class="val">${detalle.codigo_troquel||''}</div></div>
<div class="campo"><div class="lbl">TERMINADO ETIQUETA</div><div class="val">${detalle.terminado_etiqueta||''}</div></div>
<div class="campo"><div class="lbl">TERMINADOS ESPECIALES</div><div class="val">${detalle.terminados_especiales||''}</div></div>
</div><div class="fila" style="margin-top:10px">
<div class="campo"><div class="lbl">OBSERVACIONES</div><div class="val">${detalle.observaciones||orden.notas_observaciones||''}</div></div>
</div></div></div>
<div class="sec pb"><div class="sec-t">Responsables del Proceso</div><div class="sec-c">
<div class="fila" style="margin-bottom:6px"><div class="campo"><div class="lbl">VENDEDOR</div><div class="val">${detalle.vendedor||''}</div></div></div>
<table class="trz"><thead><tr>
<th class="tc th">Proceso</th><th class="tc th">Responsable</th><th class="tc th">F. Inicio</th><th class="tc th">H. Inicio</th>
<th class="tc th">F. Fin</th><th class="tc th">H. Fin</th><th class="tc th">Cantidad</th><th class="tc th">Observaciones</th><th class="tc th">Firma</th>
</tr></thead><tbody>${filas}</tbody></table></div></div>
${mostrarLib ? `<div class="sec"><div class="sec-t">Liberación Producto</div><div class="sec-c">
<table class="trz"><thead><tr>
<th class="tc th">Responsable</th><th class="tc th">Fecha</th><th class="tc th">Hora</th>
<th class="tc th">Cantidad</th><th class="tc th">Observaciones</th><th class="tc th">Firma</th>
</tr></thead><tbody><tr>
<td class="tc">${detalle.liberacion_producto||''}</td>
<td class="tc">${lib.fecha_inicio||''}</td><td class="tc">${lib.hora_inicio||''}</td>
<td class="tc">${lib.cantidad||detalle.liberacion_producto_cantidad_final||''}</td>
<td class="tc to">${lib.observaciones||''}</td><td class="tc tf"></td>
</tr></tbody></table></div></div>` : ''}
</body></html>`;
  }
}
