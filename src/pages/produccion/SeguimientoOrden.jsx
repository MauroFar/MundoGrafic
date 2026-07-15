import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExclamationCircle,
  FaClock, FaUser, FaCalendarAlt, FaTools, FaClipboardCheck,
  FaRedo, FaInfoCircle, FaFilePdf,
} from 'react-icons/fa';

const apiUrl = import.meta.env.VITE_API_URL;

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtFecha = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return v; }
};

const fmtDatetime = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return v; }
};

const estadoGateColor = (estado) => {
  switch (estado) {
    case 'aprobado':    return { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  dot: 'bg-green-500'  };
    case 'rechazado':   return { bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300',    dot: 'bg-red-500'    };
    case 'condicionado':return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' };
    default:            return { bg: 'bg-yellow-50',  text: 'text-yellow-800', border: 'border-yellow-300', dot: 'bg-yellow-400' };
  }
};

const estadoGateLabel = (estado) => {
  switch (estado) {
    case 'aprobado':    return '✓ Aprobado';
    case 'rechazado':   return '✗ Rechazado';
    case 'condicionado':return '⚠ Condicionado';
    default:            return '⏳ Pendiente';
  }
};

const etapaColorLine = (qaGates) => {
  if (!qaGates || qaGates.length === 0) return 'bg-gray-300';
  const last = qaGates[qaGates.length - 1];
  switch (last.estado) {
    case 'aprobado':    return 'bg-green-400';
    case 'rechazado':   return 'bg-red-400';
    case 'condicionado':return 'bg-orange-400';
    default:            return 'bg-yellow-400';
  }
};

const campos_etapa_labels = {
  archivo_arte: 'Archivo arte', resolucion: 'Resolución', prueba_color: 'Prueba color',
  aprobado_por: 'Aprobado por', maquina: 'Máquina', tiraje_programado: 'Tiraje prog.',
  tiraje_real: 'Tiraje real', tipo_tinta: 'Tipo tinta', sustrato: 'Sustrato',
  gramaje: 'Gramaje', tipo_laminado: 'Tipo laminado', temperatura: 'Temperatura',
  velocidad: 'Velocidad', troquel_ref: 'Troquel ref.', muestra_aprobada: 'Muestra aprobada',
  tipo_acabado: 'Tipo acabado', cantidad_procesada: 'Cantidad', tipo_empaque: 'Empaque',
};

function DatosEtapaGrid({ datos }) {
  if (!datos || typeof datos !== 'object') return null;
  const entries = Object.entries(datos).filter(([, v]) => v !== null && v !== '' && v !== undefined);
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="text-xs">
          <span className="text-gray-500">{campos_etapa_labels[k] || k}: </span>
          <span className="text-gray-800 font-medium">{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function GateBadge({ gate }) {
  const c = estadoGateColor(gate.estado);
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold ${c.text}`}>
          Intento {gate.intento} · {estadoGateLabel(gate.estado)}
        </span>
        <span className="text-gray-500">{fmtDatetime(gate.updated_at)}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
        {gate.inspector && <div><span className="text-gray-500">Inspector: </span><span className="font-medium">{gate.inspector}</span></div>}
        {gate.turno     && <div><span className="text-gray-500">Turno: </span><span className="font-medium">{gate.turno}</span></div>}
        {gate.maquina_equipo    && <div><span className="text-gray-500">Máquina: </span><span className="font-medium">{gate.maquina_equipo}</span></div>}
        {gate.lote_version_arte && <div><span className="text-gray-500">Lote/Arte: </span><span className="font-medium">{gate.lote_version_arte}</span></div>}
        {gate.unidad_medida     && <div><span className="text-gray-500">Unidad: </span><span className="font-medium">{gate.unidad_medida}</span></div>}
        {gate.cierre_qa_responsable && <div><span className="text-gray-500">Resp. cierre: </span><span className="font-medium">{gate.cierre_qa_responsable}</span></div>}
        {gate.cierre_qa_fecha && <div><span className="text-gray-500">Fecha cierre: </span><span className="font-medium">{fmtFecha(gate.cierre_qa_fecha)} {gate.cierre_qa_hora || ''}</span></div>}
      </div>
      {gate.motivo_no_conformidad && (
        <div className="mt-1"><span className="text-gray-500">No conformidad: </span><span className="font-medium text-red-700">{gate.motivo_no_conformidad}</span></div>
      )}
      {gate.accion_correctiva && (
        <div className="mt-0.5"><span className="text-gray-500">Acción correctiva: </span><span className="font-medium">{gate.accion_correctiva}</span></div>
      )}
      {gate.observaciones && (
        <div className="mt-0.5"><span className="text-gray-500">Obs.: </span><span className="italic">{gate.observaciones}</span></div>
      )}
    </div>
  );
}

function EtapaCard({ etapa, isLast }) {
  const { ejecucion, qa_gates } = etapa;
  const [expanded, setExpanded] = useState(true);
  const lastGate = qa_gates && qa_gates.length > 0 ? qa_gates[qa_gates.length - 1] : null;
  const lineColor = etapaColorLine(qa_gates);
  const hasReproceso = qa_gates && qa_gates.length > 1;

  return (
    <div className="relative flex gap-4">
      {/* Línea de tiempo */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${lastGate ? estadoGateColor(lastGate.estado).dot : 'bg-gray-400'}`} />
        {!isLast && <div className={`w-0.5 flex-1 mt-1 ${lineColor}`} style={{ minHeight: 40 }} />}
      </div>

      {/* Contenido */}
      <div className="flex-1 pb-6">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">{etapa.etapa_titulo || etapa.etapa_id}</span>
              {hasReproceso && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
                  <FaRedo className="w-2.5 h-2.5" /> {qa_gates.length} intentos
                </span>
              )}
              {lastGate && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${estadoGateColor(lastGate.estado).bg} ${estadoGateColor(lastGate.estado).text}`}>
                  {estadoGateLabel(lastGate.estado)}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{expanded ? '▲' : '▼'}</span>
          </div>
          {ejecucion && (
            <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1"><FaUser className="w-3 h-3" />{ejecucion.operario}</span>
              {ejecucion.fecha_inicio && <span className="flex items-center gap-1"><FaCalendarAlt className="w-3 h-3" />{fmtFecha(ejecucion.fecha_inicio)}{ejecucion.hora_inicio ? ` ${ejecucion.hora_inicio}` : ''}</span>}
              {ejecucion.fecha_fin && <span>→ {fmtFecha(ejecucion.fecha_fin)}{ejecucion.hora_fin ? ` ${ejecucion.hora_fin}` : ''}</span>}
            </div>
          )}
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            {/* Registro de ejecución del operario */}
            {ejecucion ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-1 font-semibold text-blue-800 mb-1">
                  <FaTools className="w-3 h-3" /> Registro del operario
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <div><span className="text-gray-500">Operario: </span><span className="font-medium">{ejecucion.operario}</span></div>
                  {ejecucion.fecha_inicio && <div><span className="text-gray-500">Inicio: </span><span className="font-medium">{fmtFecha(ejecucion.fecha_inicio)} {ejecucion.hora_inicio || ''}</span></div>}
                  {ejecucion.fecha_fin    && <div><span className="text-gray-500">Fin: </span><span className="font-medium">{fmtFecha(ejecucion.fecha_fin)} {ejecucion.hora_fin || ''}</span></div>}
                  {ejecucion.created_by  && <div><span className="text-gray-500">Registrado por: </span><span className="font-medium">{ejecucion.created_by}</span></div>}
                </div>
                <DatosEtapaGrid datos={ejecucion.datos_etapa} />
                {ejecucion.reproceso && (
                  <div className="mt-1 text-orange-700"><FaRedo className="inline w-3 h-3 mr-1" />Reproceso{ejecucion.motivo_reproceso ? ': ' + ejecucion.motivo_reproceso : ''}</div>
                )}
                {ejecucion.observaciones && (
                  <div className="mt-1 text-gray-600 italic">"{ejecucion.observaciones}"</div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                <FaInfoCircle className="w-3 h-3" /> Sin registro de ejecución del operario
              </div>
            )}

            {/* Gates de calidad */}
            {qa_gates && qa_gates.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                  <FaClipboardCheck className="w-3 h-3" /> Control de calidad ({qa_gates.length} {qa_gates.length === 1 ? 'revisión' : 'revisiones'})
                </div>
                {qa_gates.map(g => <GateBadge key={g.id} gate={g} />)}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                <FaInfoCircle className="w-3 h-3" /> Sin revisión de calidad registrada
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function SeguimientoOrden() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const cargarLogoDataUrl = async () => {
    try {
      const response = await fetch(`${apiUrl}/images/logo-mundografic.png`);
      if (!response.ok) return '';
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return typeof dataUrl === 'string' ? dataUrl : '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch(`${apiUrl}/api/ordenTrabajo/produccion/${id}/trazabilidad`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <FaClock className="animate-spin mr-2" /> Cargando trazabilidad…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600 gap-3">
        <FaTimesCircle className="w-8 h-8" />
        <p className="font-semibold">No se pudo cargar la trazabilidad</p>
        <p className="text-sm text-gray-500">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm underline text-blue-600">Volver</button>
      </div>
    );
  }

  const { orden, etapas } = data;
  const estadoKey    = orden.estado_digital_key   || orden.estado_offset_key   || '—';
  const estadoTitulo = orden.estado_digital_titulo || orden.estado_offset_titulo || '—';
  const etapasConDatos = etapas.filter(e => e.ejecucion || (e.qa_gates && e.qa_gates.length > 0));

    const construirPDFTrazabilidad = async () => {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 12;
      const contentW = pageW - (margin * 2);
      let y = 14;
      const logoDataUrl = await cargarLogoDataUrl();

      const writeText = (text, x, yPos, opts = {}) => {
        const {
          size = 10,
          style = 'normal',
          color = [30, 41, 59],
          align = 'left',
          maxWidth,
        } = opts;
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        if (maxWidth) {
          const lines = doc.splitTextToSize(text || '—', maxWidth);
          doc.text(lines, x, yPos, { align });
          return lines.length * (size * 0.38);
        }
        doc.text(text || '—', x, yPos, { align });
        return size * 0.38;
      };

      const ensureSpace = (needed = 12) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const kv = (label, value, _xLabel, _xValue, yPos) => {
        // Columnas fijas para mantener alineacion vertical uniforme
        const labelColX = margin + 2;
        const labelColW = 42;
        const valueColX = labelColX + labelColW + 4;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`${label}:`, labelColX, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const lines = doc.splitTextToSize(value || '—', contentW - (valueColX - margin));
        doc.text(lines, valueColX, yPos);

        return Math.max(4.2, lines.length * 3.9);
      };

      const estadoLabelAuditoria = (estado) => {
        if (estado === 'aprobado') return 'APROBADO';
        if (estado === 'rechazado') return 'RECHAZADO';
        if (estado === 'condicionado') return 'CONDICIONADO';
        return 'PENDIENTE';
      };

      // Encabezado de documento (blanco y negro, sin fondo)
      doc.setDrawColor(31, 41, 55);
      doc.roundedRect(margin, y, contentW, 18, 2, 2, 'S');
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin + 2, y + 2, 23, 11);
      }
      const headerX = logoDataUrl ? margin + 28 : margin + 4;
      writeText('REPORTE DE TRAZABILIDAD DE PRODUCCION', headerX, y + 7, { size: 12, style: 'bold', color: [0, 0, 0] });
      writeText('Formato de control para auditoria interna y calidad', headerX, y + 13, { size: 8.5, color: [55, 65, 81] });
      writeText(`Emitido: ${new Date().toLocaleString('es-GT')}`, pageW - margin - 2, y + 13, { size: 8.5, color: [55, 65, 81], align: 'right' });
      y += 24;

      // Identificacion de la orden
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentW, 30, 2, 2, 'S');
      y += 5;
      y += kv('Orden', orden.numero_orden || `#${orden.id}`, margin + 2, margin + 34, y);
      y += kv('Cliente', orden.nombre_cliente || '—', margin + 2, margin + 34, y);
      y += kv('Tipo de orden', orden.tipo_orden || '—', margin + 2, margin + 34, y);
      y += kv('Estado actual', `${estadoTitulo} (${estadoKey})`, margin + 2, margin + 34, y);
      if (orden.fecha_entrega) y += kv('Fecha de entrega', fmtFecha(orden.fecha_entrega), margin + 2, margin + 34, y);
      y += 4;

      // Resumen de auditoria
      const totalEtapas = etapasConDatos.length;
      const aprobadas = etapasConDatos.filter(e => e.qa_gates?.some(g => g.estado === 'aprobado')).length;
      const rechazadas = etapasConDatos.filter(e => e.qa_gates?.some(g => g.estado === 'rechazado')).length;
      const conReproceso = etapasConDatos.filter(e => e.qa_gates?.length > 1).length;
      const colaboradores = [...new Set(etapasConDatos.map(e => e.ejecucion?.operario).filter(Boolean))];

      ensureSpace(28);
      doc.setDrawColor(156, 163, 175);
      doc.roundedRect(margin, y, contentW, 22, 2, 2, 'S');
      writeText('Resumen de cumplimiento', margin + 3, y + 5, { size: 10, style: 'bold', color: [0, 0, 0] });
      writeText(`Etapas registradas: ${totalEtapas}`, margin + 3, y + 11, { size: 8.5 });
      writeText(`Etapas con aprobacion QA: ${aprobadas}`, margin + 52, y + 11, { size: 8.5 });
      writeText(`Etapas con rechazo: ${rechazadas}`, margin + 108, y + 11, { size: 8.5 });
      writeText(`Reprocesos detectados: ${conReproceso}`, margin + 150, y + 11, { size: 8.5 });
      writeText(`Colaboradores: ${colaboradores.length ? colaboradores.join(', ') : '—'}`, margin + 3, y + 17, { size: 8.5, maxWidth: contentW - 6 });
      y += 28;

      // Secciones por etapa
      etapasConDatos.forEach((etapa, index) => {
        ensureSpace(20);

        doc.setDrawColor(55, 65, 81);
        doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, 'S');
        writeText(`${index + 1}. ${etapa.etapa_titulo || etapa.etapa_id}`, margin + 3, y + 5.4, { size: 9.5, style: 'bold', color: [0, 0, 0] });
        y += 11;

        if (etapa.ejecucion) {
          ensureSpace(18);
          writeText('Registro de ejecucion operativa', margin, y, { size: 9, style: 'bold', color: [15, 23, 42] });
          y += 5;
          y += kv('Operario', etapa.ejecucion.operario || '—', margin, margin + 26, y);
          y += kv('Inicio', `${fmtFecha(etapa.ejecucion.fecha_inicio)} ${etapa.ejecucion.hora_inicio || ''}`.trim(), margin, margin + 26, y);
          y += kv('Fin', `${fmtFecha(etapa.ejecucion.fecha_fin)} ${etapa.ejecucion.hora_fin || ''}`.trim(), margin, margin + 26, y);
          y += kv('Registro creado por', etapa.ejecucion.created_by || '—', margin, margin + 42, y);

          const datosEtapa = etapa.ejecucion.datos_etapa || {};
          const datosEntries = Object.entries(datosEtapa).filter(([, v]) => v !== null && v !== '' && v !== undefined);
          if (datosEntries.length) {
            ensureSpace(12);
            writeText('Detalle tecnico de etapa', margin, y, { size: 8.8, style: 'bold', color: [51, 65, 85] });
            y += 4.5;
            datosEntries.forEach(([k, v]) => {
              ensureSpace(6);
              const label = campos_etapa_labels[k] || k;
              y += kv(label, String(v), margin + 2, margin + 36, y);
            });
          }

          if (etapa.ejecucion.reproceso || etapa.ejecucion.motivo_reproceso || etapa.ejecucion.observaciones) {
            ensureSpace(12);
            writeText('Observaciones operativas', margin, y, { size: 8.8, style: 'bold', color: [51, 65, 85] });
            y += 4.5;
            y += kv('Reproceso', etapa.ejecucion.reproceso ? 'SI' : 'NO', margin + 2, margin + 28, y);
            if (etapa.ejecucion.motivo_reproceso) {
              y += kv('Motivo reproceso', etapa.ejecucion.motivo_reproceso, margin + 2, margin + 28, y);
            }
            if (etapa.ejecucion.observaciones) {
              y += kv('Observaciones', etapa.ejecucion.observaciones, margin + 2, margin + 28, y);
            }
          }
        } else {
          ensureSpace(8);
          writeText('Sin registro de ejecucion del operario en esta etapa.', margin, y, { size: 8.5, color: [100, 116, 139] });
          y += 5;
        }

        ensureSpace(10);
        writeText('Control de calidad (QA)', margin, y, { size: 9, style: 'bold', color: [15, 23, 42] });
        y += 5;

        if (etapa.qa_gates && etapa.qa_gates.length) {
          etapa.qa_gates.forEach((gate) => {
            ensureSpace(24);
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, pageW - margin, y);
            y += 4;
            writeText(`Revision QA - Intento ${gate.intento || '—'}`, margin, y, { size: 8.8, style: 'bold', color: [30, 41, 59] });
            y += 4;
            y += kv('Intento', String(gate.intento || '—'), margin + 2, margin + 24, y);
            y += kv('Resultado', estadoLabelAuditoria(gate.estado), margin + 2, margin + 24, y);
            y += kv('Fecha revision', fmtDatetime(gate.updated_at), margin + 2, margin + 24, y);
            y += kv('Inspector', gate.inspector || '—', margin + 2, margin + 24, y);
            y += kv('Turno', gate.turno || '—', margin + 2, margin + 24, y);
            y += kv('Maquina/equipo', gate.maquina_equipo || '—', margin + 2, margin + 36, y);
            y += kv('Lote/arte', gate.lote_version_arte || '—', margin + 2, margin + 24, y);
            y += kv('Unidad', gate.unidad_medida || '—', margin + 2, margin + 24, y);
            if (gate.motivo_no_conformidad) y += kv('No conformidad', gate.motivo_no_conformidad, margin + 2, margin + 35, y);
            if (gate.accion_correctiva) y += kv('Accion correctiva', gate.accion_correctiva, margin + 2, margin + 35, y);
            if (gate.observaciones) y += kv('Observaciones QA', gate.observaciones, margin + 2, margin + 35, y);
            if (gate.cierre_qa_responsable || gate.cierre_qa_fecha || gate.cierre_qa_hora) {
              y += kv('Cierre QA', `${gate.cierre_qa_responsable || '—'} · ${fmtFecha(gate.cierre_qa_fecha)} ${gate.cierre_qa_hora || ''}`.trim(), margin + 2, margin + 24, y);
            }
            y += 2;
          });
        } else {
          writeText('Sin revisiones QA registradas para esta etapa.', margin, y, { size: 8.5, color: [100, 116, 139] });
          y += 6;
        }

        y += 2;
      });

      // Pie de firma de auditoria
      ensureSpace(20);
      doc.setDrawColor(203, 213, 225);
      doc.line(margin + 5, pageH - 20, margin + 65, pageH - 20);
      doc.line(pageW - margin - 65, pageH - 20, pageW - margin - 5, pageH - 20);
      writeText('Responsable de produccion', margin + 10, pageH - 16, { size: 8, color: [71, 85, 105] });
      writeText('Responsable de calidad', pageW - margin - 60, pageH - 16, { size: 8, color: [71, 85, 105] });

      return doc;
  };

  const handleVerPDFImprimir = async () => {
    try {
      setPreviewLoading(true);
      const doc = await construirPDFTrazabilidad();
      const dataUri = doc.output('datauristring');
      setPreviewUrl(dataUri || '');
      setShowPreview(true);
    } catch (e) {
      console.error('Error generando vista previa PDF de trazabilidad:', e);
      alert('No se pudo generar la vista previa del PDF.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const cerrarPreview = () => {
    setShowPreview(false);
    setPreviewUrl('');
  };

  // KPIs rápidos
  const totalEtapas    = etapasConDatos.length;
  const aprobadas      = etapasConDatos.filter(e => e.qa_gates?.some(g => g.estado === 'aprobado')).length;
  const rechazadas     = etapasConDatos.filter(e => e.qa_gates?.some(g => g.estado === 'rechazado')).length;
  const conReproceso   = etapasConDatos.filter(e => e.qa_gates?.length > 1).length;
  const colaboradores  = [...new Set(etapasConDatos.map(e => e.ejecucion?.operario).filter(Boolean))];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="w-3 h-3" /> Volver al Kanban
          </button>
          <button
            onClick={handleVerPDFImprimir}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
            title="Ver PDF e imprimir"
          >
            <FaFilePdf className="w-4 h-4" /> Ver PDF/Imprimir
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {orden.numero_orden || `Orden #${orden.id}`}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">{orden.nombre_cliente}</p>
              {orden.notas_observaciones && <p className="text-xs text-gray-500 mt-0.5">{orden.notas_observaciones}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-3 py-1 capitalize">
                {orden.tipo_orden}
              </span>
              <span className="text-xs text-gray-500">
                Estado: <span className="font-semibold text-gray-700">{estadoTitulo}</span>
              </span>
              {orden.fecha_entrega && (
                <span className="text-xs text-gray-500">
                  Entrega: <span className="font-medium">{fmtFecha(orden.fecha_entrega)}</span>
                </span>
              )}
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-gray-800">{totalEtapas}</p>
              <p className="text-[11px] text-gray-500">Etapas registradas</p>
            </div>
            <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-green-700">{aprobadas}</p>
              <p className="text-[11px] text-gray-500">Aprobadas por QA</p>
            </div>
            <div className="bg-red-50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-red-600">{rechazadas}</p>
              <p className="text-[11px] text-gray-500">Con rechazo</p>
            </div>
            <div className="bg-orange-50 rounded-lg px-3 py-2 text-center">
              <p className="text-lg font-bold text-orange-600">{conReproceso}</p>
              <p className="text-[11px] text-gray-500">Reprocesos</p>
            </div>
          </div>

          {/* Colaboradores */}
          {colaboradores.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <FaUser className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">Colaboradores:</span>
              {colaboradores.map(c => (
                <span key={c} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 font-medium">{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Línea de tiempo */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FaClipboardCheck className="w-4 h-4 text-indigo-500" />
        Trazabilidad por etapa
      </h2>

      {etapasConDatos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-gray-500">
          <FaInfoCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">Sin datos de trazabilidad aún</p>
          <p className="text-sm mt-1">Los operarios aún no han registrado ejecuciones para esta orden.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5">
          {etapasConDatos.map((etapa, i) => (
            <EtapaCard
              key={etapa.etapa_id}
              etapa={etapa}
              isLast={i === etapasConDatos.length - 1}
            />
          ))}
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vista Previa del PDF</h2>
              <button
                onClick={cerrarPreview}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Generando vista previa...</p>
                  </div>
                </div>
              ) : (
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <p>No se puede mostrar el PDF. Por favor, intente nuevamente.</p>
                </object>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
