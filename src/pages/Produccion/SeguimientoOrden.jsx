import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExclamationCircle,
  FaClock, FaUser, FaCalendarAlt, FaTools, FaClipboardCheck,
  FaRedo, FaInfoCircle,
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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-3"
        >
          <FaArrowLeft className="w-3 h-3" /> Volver al Kanban
        </button>

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
    </div>
  );
}
