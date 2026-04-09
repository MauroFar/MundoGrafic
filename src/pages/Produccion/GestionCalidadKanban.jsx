import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaCheckCircle, FaTimesCircle, FaClipboardCheck, FaSync,
  FaHistory, FaListAlt, FaExclamationTriangle, FaFilter,
  FaTimes, FaChevronLeft, FaChevronRight, FaClock,
} from 'react-icons/fa';

const apiUrl = import.meta.env.VITE_API_URL;
// Clave local para sincronizar el estado de gates con el Kanban
const QA_STORAGE_KEY = 'mg.qa.gates.v1';

const RESULTADO_CONTROL_OPTIONS = ['pendiente', 'aprobado', 'condicionado', 'rechazado'];
const TURNOS_OPTIONS = ['Manana', 'Tarde', 'Noche'];

const etiquetasCampos = {
  operario: 'Operario', fecha_inicio: 'Inicio', hora_inicio: 'Hora inicio',
  fecha_fin: 'Fin', hora_fin: 'Hora fin', archivo_arte: 'Archivo arte',
  resolucion: 'Resolución', prueba_color: 'Prueba color aprobada',
  aprobado_por: 'Aprobado por', maquina: 'Máquina',
  tiraje_programado: 'Tiraje prog.', tiraje_real: 'Tiraje real',
  tipo_tinta: 'Tipo tinta', sustrato: 'Sustrato', gramaje: 'Gramaje',
  tipo_laminado: 'Tipo laminado', temperatura: 'Temperatura',
  velocidad: 'Velocidad', troquel_ref: 'Troquel ref.',
  muestra_aprobada: 'Muestra aprobada', tipo_acabado: 'Tipo acabado',
  cantidad_procesada: 'Cantidad', tipo_empaque: 'Empaque',
  reproceso: 'Reproceso', motivo_reproceso: 'Motivo reproceso',
  observaciones: 'Observaciones operario',
};

const defaultForm = () => ({
  resultado_control: 'pendiente',
  inspector: '',
  unidad_medida: '',
  motivo_no_conformidad: '',
  accion_correctiva: '',
  observaciones: '',
  cierre_qa_responsable: '',
  cierre_qa_fecha: '',
  cierre_qa_hora: '',
});

const defaultHistorialFiltros = () => ({
  desde: '',
  hasta: '',
  estado: '',
  inspector: '',
  etapa_id: '',
  numero_orden: '',
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const estadoBadge = (estado) => {
  const map = {
    aprobado:    'bg-green-100 text-green-700 border border-green-200',
    rechazado:   'bg-red-100 text-red-700 border border-red-200',
    condicionado:'bg-orange-100 text-orange-700 border border-orange-200',
    pendiente:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  };
  return map[estado] || 'bg-gray-100 text-gray-600';
};

const fmtMinutos = (min) => {
  if (min == null || isNaN(min)) return '-';
  const m = Math.round(Number(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
};

const fmtFecha = (ts) => {
  if (!ts) return '-';
  try { return new Date(ts).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return ts; }
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, sub, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    green:  'text-green-700 bg-green-50 border-green-200',
    red:    'text-red-700 bg-red-50 border-red-200',
    orange: 'text-orange-700 bg-orange-50 border-orange-200',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  };
  return (
    <div className={`rounded-lg border p-3 flex flex-col gap-1 ${colorMap[color]}`}>
      <span className="text-xs font-medium opacity-70">{label}</span>
      <span className="text-2xl font-bold">{value ?? '-'}</span>
      {sub && <span className="text-xs opacity-60">{sub}</span>}
    </div>
  );
};

// ── Panel detalle historial ───────────────────────────────────────────────────

const DetalleHistorialModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Orden #{item.numero_orden}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${estadoBadge(item.estado_qa)}`}>
                {item.estado_qa}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Etapa: {item.etapa_titulo || item.etapa_id}
              {item.intento > 1 && (
                <span className="ml-2 text-orange-600">· Reintento #{item.intento}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <FaTimes />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Información de la orden</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {[
                ['Cliente', item.nombre_cliente],
                ['Tipo',    item.tipo_orden],
                ['Ingreso a QA', fmtFecha(item.ingreso_qa)],
                ['Resolución', fmtFecha(item.resolucion_qa)],
                ['Tiempo resolución', fmtMinutos(item.minutos_resolucion)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-800">{v || '-'}</dd>
                </div>
              ))}
            </dl>
          </section>
          {item.operario && (
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Registro del operario</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {[
                  ['Operario', item.operario],
                  ['Fecha inicio', item.fecha_inicio],
                  ['Hora inicio', item.hora_inicio],
                  ['Fecha fin', item.fecha_fin],
                  ['Hora fin', item.hora_fin],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-blue-900">{v}</dd>
                  </div>
                ))}
                {item.datos_etapa && Object.entries(item.datos_etapa)
                  .filter(([, v]) => v !== '' && v !== false && v !== null)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-gray-500">{etiquetasCampos[k] || k}</dt>
                      <dd className="font-medium text-blue-900">
                        {typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v)}
                      </dd>
                    </div>
                  ))}
                {item.reproceso && (
                  <div className="col-span-2">
                    <dt className="text-red-600 font-medium">Reproceso</dt>
                    <dd className="text-gray-800">{item.motivo_reproceso || item.obs_operario || '-'}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
          <section className={`rounded-lg border p-3 ${
            item.estado_qa === 'aprobado'    ? 'border-green-200 bg-green-50'  :
            item.estado_qa === 'rechazado'   ? 'border-red-200 bg-red-50'      :
            'border-orange-200 bg-orange-50'
          }`}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Dictamen del inspector</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {[
                ['Inspector', item.inspector],
                ['Turno', item.turno],
                ['Resultado', item.resultado_control],
                ['Máquina/Equipo', item.maquina_equipo],
                ['Unidad medida', item.unidad_medida],
                ['Lote/Arte', item.lote_version_arte],
                ['Responsable cierre', item.cierre_qa_responsable],
                ['Fecha cierre', item.cierre_qa_fecha],
                ['Hora cierre', item.cierre_qa_hora],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-900">{v}</dd>
                </div>
              ))}
              {item.motivo_no_conformidad && (
                <div className="col-span-2">
                  <dt className="text-red-600 font-medium">No conformidad</dt>
                  <dd className="text-gray-800">{item.motivo_no_conformidad}</dd>
                </div>
              )}
              {item.accion_correctiva && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Acción correctiva</dt>
                  <dd className="text-gray-800">{item.accion_correctiva}</dd>
                </div>
              )}
              {item.observaciones && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Observaciones QA</dt>
                  <dd className="text-gray-800">{item.observaciones}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};


const GestionCalidadKanban = () => {
  // ── Cola pendiente ──
  const [items,      setItems]      = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(defaultForm());
  const [pendingDecision, setPendingDecision] = useState(null); // 'aprobado' | 'rechazado' | 'condicionado' | null

  // ── Historial ──
  const [vista,            setVista]            = useState('cola');
  const [historial,        setHistorial]        = useState([]);
  const [historialKpis,    setHistorialKpis]    = useState({});
  const [historialTotal,   setHistorialTotal]   = useState(0);
  const [historialPage,    setHistorialPage]    = useState(1);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [filtros,          setFiltros]          = useState(defaultHistorialFiltros());
  const [filtrosAplicados, setFiltrosAplicados] = useState(defaultHistorialFiltros());
  const [detalleItem,      setDetalleItem]      = useState(null);
  const [expandedOrdenes,  setExpandedOrdenes]  = useState(new Set());

  const HIST_LIMIT = 20;
  const timerRef   = useRef(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/qa/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error cargando cola QA');
      const data = await res.json();
      const rows = data.pendientes || [];
      setItems(rows);
      if (rows.length > 0) setSelectedId((prev) => prev ?? rows[0].qa_gate_id);
    } catch (err) {
      console.error('Error cargando cola QA:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarHistorial = useCallback(async (filtrosActivos, page = 1) => {
    setHistorialLoading(true);
    try {
      const token  = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(HIST_LIMIT) });
      if (filtrosActivos.desde)         params.set('desde',         filtrosActivos.desde);
      if (filtrosActivos.hasta)         params.set('hasta',         filtrosActivos.hasta);
      if (filtrosActivos.estado)        params.set('estado',        filtrosActivos.estado);
      if (filtrosActivos.inspector)     params.set('inspector',     filtrosActivos.inspector);
      if (filtrosActivos.etapa_id)      params.set('etapa_id',      filtrosActivos.etapa_id);
      if (filtrosActivos.numero_orden)  params.set('numero_orden',  filtrosActivos.numero_orden);
      const res = await fetch(
        `${apiUrl}/api/ordenTrabajo/produccion/qa/historial?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Error cargando historial QA');
      const data = await res.json();
      setHistorial(data.historial || []);
      setHistorialTotal(data.total || 0);
      setHistorialKpis(data.kpis  || {});
      setHistorialPage(page);
    } catch (err) {
      console.error('Error cargando historial QA:', err);
    } finally {
      setHistorialLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    timerRef.current = setInterval(cargar, 30_000);
    return () => clearInterval(timerRef.current);
  }, [cargar]);

  useEffect(() => {
    if (vista === 'historial') cargarHistorial(filtrosAplicados, 1);
    // eslint-disable-next-line
  }, [vista]);

  const selected = useMemo(
    () => items.find((i) => i.qa_gate_id === selectedId) || null,
    [items, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setForm({
      resultado_control:     selected.resultado_control     || 'pendiente',
      inspector:             selected.inspector             || '',
      unidad_medida:         selected.unidad_medida         || '',
      lote_version_arte:     '',
      turno:                 '',
      maquina_equipo:        '',
      motivo_no_conformidad: selected.motivo_no_conformidad || '',
      accion_correctiva:     selected.accion_correctiva     || '',
      observaciones:         selected.observaciones         || '',
      cierre_qa_responsable: selected.cierre_qa_responsable || '',
      cierre_qa_fecha:       selected.cierre_qa_fecha       || '',
      cierre_qa_hora:        selected.cierre_qa_hora        || '',
    });
    // eslint-disable-next-line
  }, [selectedId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const syncLocalGate = (ordenId, etapaId, estado) => {
    try {
      const raw   = localStorage.getItem(QA_STORAGE_KEY);
      const gates = raw ? JSON.parse(raw) : {};
      gates[`${ordenId}:${etapaId}`] = { estado, updatedAt: new Date().toISOString() };
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(gates));
      window.dispatchEvent(new Event('qa-gates-updated'));
    } catch (e) { console.error('Error sincronizando gate local', e); }
  };

  const resolver = async (estado) => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body  = {
        ...form,
        estado,
        resultado_control: estado === 'aprobado' ? 'aprobado' : estado === 'rechazado' ? 'rechazado' : form.resultado_control,
      };
      const res = await fetch(
        `${apiUrl}/api/ordenTrabajo/produccion/${selected.orden_trabajo_id}/qa/${selected.qa_gate_id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) },
      );
      if (!res.ok) throw new Error('Error actualizando gate');
      syncLocalGate(selected.orden_trabajo_id, selected.etapa_id, estado);
      setSelectedId(null);
      await cargar();
    } catch (err) {
      console.error('Error resolviendo gate QA:', err);
      alert('No se pudo guardar la decisión. Verifica la conexión.');
    } finally { setSaving(false); }
  };

  const guardarBorrador = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${apiUrl}/api/ordenTrabajo/produccion/${selected.orden_trabajo_id}/qa/${selected.qa_gate_id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) },
      );
      if (!res.ok) throw new Error('Error guardando borrador');
      await cargar();
    } catch (err) {
      console.error('Error guardando borrador QA:', err);
      alert('No se pudo guardar. Verifica la conexión.');
    } finally { setSaving(false); }
  };

  const aplicarFiltros  = () => { setFiltrosAplicados({ ...filtros }); cargarHistorial(filtros, 1); };
  const limpiarFiltros  = () => { const v = defaultHistorialFiltros(); setFiltros(v); setFiltrosAplicados(v); cargarHistorial(v, 1); };
  const cambiarPagina   = (p) => cargarHistorial(filtrosAplicados, p);
  const totalPaginas    = Math.max(1, Math.ceil(historialTotal / HIST_LIMIT));
  const pendientes      = useMemo(() => items.filter((i) => i.estado_qa === 'pendiente'), [items]);

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* Encabezado + Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaClipboardCheck className="text-indigo-600" /> Control de Calidad
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button onClick={() => setVista('cola')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${vista === 'cola' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <FaListAlt /> Cola pendiente
              {pendientes.length > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold ${vista === 'cola' ? 'bg-white text-indigo-600' : 'bg-yellow-400 text-yellow-900'}`}>
                  {pendientes.length}
                </span>
              )}
            </button>
            <button onClick={() => setVista('historial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors ${vista === 'historial' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <FaHistory /> Historial
            </button>
          </div>
          <button onClick={() => vista === 'cola' ? cargar() : cargarHistorial(filtrosAplicados, historialPage)}
            disabled={loading || historialLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 text-sm">
            <FaSync className={(loading || historialLoading) ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ═══════════════ COLA PENDIENTE ═══════════════ */}
      {vista === 'cola' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Pendientes"    value={pendientes.length}                         sub="en cola ahora"             color="yellow" />
            <KpiCard label="Total en cola" value={items.length}                              sub="incluyendo en revisión"    color="indigo" />
            <KpiCard label="Con reintento" value={items.filter((i) => i.intento > 1).length} sub="segunda vuelta o más"      color="orange" />
            <KpiCard label="Con reproceso" value={items.filter((i) => i.reproceso).length}   sub="operario indicó reproceso" color="red"    />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Lista */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden lg:col-span-1 shadow-sm">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Órdenes pendientes
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                  {items.map((item) => (
                    <button key={item.qa_gate_id}
                      className={`w-full text-left px-3 py-3 transition-colors ${selectedId === item.qa_gate_id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                      onClick={() => setSelectedId(item.qa_gate_id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-800">#{item.numero_orden}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(item.estado_qa)}`}>{item.estado_qa}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{item.nombre_cliente || '—'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <FaClock className="opacity-50" /> {item.etapa_titulo || item.etapa_id}
                        {item.intento > 1 && <span className="text-orange-500 font-medium">· Reintento #{item.intento}</span>}
                      </div>
                    </button>
                  ))}
                  {items.length === 0 && (
                    <div className="px-3 py-10 text-center text-gray-400 text-sm">No hay órdenes en la cola de calidad.</div>
                  )}
                </div>
              )}
            </div>

            {/* Panel de revisión */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2 shadow-sm">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                  <FaClipboardCheck className="text-4xl opacity-30" />
                  <span className="text-sm">Selecciona una orden para revisar.</span>
                </div>
              ) : (
                <>
                  <div className="mb-4 pb-3 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-gray-800">Orden #{selected.numero_orden}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoBadge(selected.estado_qa)}`}>{selected.estado_qa}</span>
                      {selected.intento > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                          <FaExclamationTriangle className="inline mr-1" /> Reintento #{selected.intento}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Cliente:</span> {selected.nombre_cliente || '-'}
                      <span className="mx-2">·</span>
                      <span className="font-medium">Etapa:</span> {selected.etapa_titulo || selected.etapa_id}
                    </p>
                  </div>

                  {selected.operario ? (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Registro del operario</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                        {[['operario', selected.operario], ['fecha_inicio', selected.fecha_inicio], ['hora_inicio', selected.hora_inicio],
                          ['fecha_fin', selected.fecha_fin], ['hora_fin', selected.hora_fin]].filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} className="text-xs">
                            <span className="text-gray-500">{etiquetasCampos[k] || k}: </span>
                            <span className="font-medium text-gray-800">{String(v)}</span>
                          </div>
                        ))}
                        {selected.datos_etapa && Object.entries(selected.datos_etapa).filter(([, v]) => v !== '' && v !== false && v !== null).map(([k, v]) => (
                          <div key={k} className="text-xs">
                            <span className="text-gray-500">{etiquetasCampos[k] || k}: </span>
                            <span className="font-medium text-gray-800">{typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v)}</span>
                          </div>
                        ))}
                        {selected.reproceso && (
                          <div className="text-xs col-span-full">
                            <span className="text-red-600 font-medium">Reproceso: </span>
                            <span className="text-gray-800">{selected.obs_operario || 'Sin motivo'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      El operario aún no registró datos de ejecución para esta etapa.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Inspector</label>
                      <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="text" value={form.inspector} onChange={(e) => setField('inspector', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Metros revisados</label>
                      <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="text" value={form.unidad_medida} onChange={(e) => setField('unidad_medida', e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de no conformidad</label>
                      <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="text" value={form.motivo_no_conformidad} onChange={(e) => setField('motivo_no_conformidad', e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Acción correctiva</label>
                      <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="text" value={form.accion_correctiva} onChange={(e) => setField('accion_correctiva', e.target.value)} />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm resize-none" value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Responsable cierre QA</label>
                      <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="text" value={form.cierre_qa_responsable} onChange={(e) => setField('cierre_qa_responsable', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fecha cierre QA</label>
                      <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="date" value={form.cierre_qa_fecha} onChange={(e) => setField('cierre_qa_fecha', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Hora cierre QA</label>
                      <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" type="time" value={form.cierre_qa_hora} onChange={(e) => setField('cierre_qa_hora', e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <button onClick={() => setPendingDecision('aprobado')} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm">
                      <FaCheckCircle /> Aprobar
                    </button>
                    <button onClick={() => setPendingDecision('rechazado')} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium shadow-sm">
                      <FaTimesCircle /> Rechazar
                    </button>
                    <button onClick={() => setPendingDecision('condicionado')} disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50 font-medium border border-orange-200">
                      <FaExclamationTriangle /> Condicionar
                    </button>
                    <button onClick={guardarBorrador} disabled={saving}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                      {saving ? 'Guardando...' : 'Guardar borrador'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════ HISTORIAL ═══════════════ */}
      {vista === 'historial' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Pendientes"            value={historialKpis.pendientes    ?? 0} color="yellow" />
            <KpiCard label="Aprobados"             value={historialKpis.aprobados     ?? 0} color="green"  />
            <KpiCard label="Rechazados"            value={historialKpis.rechazados    ?? 0} color="red"    />
            <KpiCard label="Condicionados"         value={historialKpis.condicionados ?? 0} color="orange" />
            <KpiCard label="Tasa de aprobación"
              value={historialKpis.tasa_aprobacion != null ? `${historialKpis.tasa_aprobacion}%` : '-'}
              sub="del período" color="green" />
            <KpiCard label="Tiempo medio resolución"
              value={fmtMinutos(historialKpis.avg_minutos_resolucion)}
              sub="por gate" color="indigo" />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className="text-gray-400 text-xs" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Filtros</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">N° Orden</label>
                <input type="text" placeholder="Ej: 42" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  value={filtros.numero_orden} onChange={(e) => setFiltros((p) => ({ ...p, numero_orden: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Desde</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  value={filtros.desde} onChange={(e) => setFiltros((p) => ({ ...p, desde: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  value={filtros.hasta} onChange={(e) => setFiltros((p) => ({ ...p, hasta: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado</label>
                <select className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  value={filtros.estado} onChange={(e) => setFiltros((p) => ({ ...p, estado: e.target.value }))}>
                  <option value="">Todos</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="condicionado">Condicionado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Inspector</label>
                <input type="text" placeholder="Nombre..." className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  value={filtros.inspector} onChange={(e) => setFiltros((p) => ({ ...p, inspector: e.target.value }))} />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={aplicarFiltros}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                  Buscar
                </button>
                <button onClick={limpiarFiltros} title="Limpiar filtros"
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{historialTotal} registros encontrados</span>
              {totalPaginas > 1 && <span className="text-xs text-gray-500">Página {historialPage} de {totalPaginas}</span>}
            </div>

            {historialLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Cargando historial...</div>
            ) : historial.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No hay registros con los filtros aplicados.</div>
            ) : (() => {
              // Agrupar por número de orden
              const grupos = historial.reduce((acc, item) => {
                const key = item.numero_orden;
                if (!acc[key]) acc[key] = { numero_orden: item.numero_orden, nombre_cliente: item.nombre_cliente, gates: [] };
                acc[key].gates.push(item);
                return acc;
              }, {});
              const ordenesAgrupadas = Object.values(grupos);

              return (
                <div className="divide-y divide-gray-100">
                  {ordenesAgrupadas.map((grupo) => {
                    const abierto = expandedOrdenes.has(grupo.numero_orden);
                    const toggleOrden = () => setExpandedOrdenes((prev) => {
                      const next = new Set(prev);
                      abierto ? next.delete(grupo.numero_orden) : next.add(grupo.numero_orden);
                      return next;
                    });
                    const estados = grupo.gates.map(g => g.estado_qa);
                    const tieneRechazado = estados.includes('rechazado');
                    const tieneCondicionado = estados.includes('condicionado');
                    const todosAprobados = estados.every(e => e === 'aprobado');
                    const resumenColor = tieneRechazado ? 'bg-red-100 text-red-700' : tieneCondicionado ? 'bg-orange-100 text-orange-700' : todosAprobados ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
                    const resumenTexto = tieneRechazado ? 'Con rechazos' : tieneCondicionado ? 'Condicionado' : todosAprobados ? 'Aprobado' : 'Pendiente';

                    return (
                      <div key={grupo.numero_orden}>
                        {/* Fila de la orden — clic para expandir */}
                        <button
                          onClick={toggleOrden}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                          <span className={`text-gray-400 text-xs transition-transform ${abierto ? 'rotate-90' : ''}`}>▶</span>
                          <span className="font-semibold text-gray-800 text-sm">#{grupo.numero_orden}</span>
                          <span className="text-gray-500 text-sm flex-1">{grupo.nombre_cliente || '-'}</span>
                          <span className="text-xs text-gray-400">{grupo.gates.length} etapa{grupo.gates.length !== 1 ? 's' : ''}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${resumenColor}`}>{resumenTexto}</span>
                        </button>

                        {/* Detalle expandido */}
                        {abierto && (
                          <div className="bg-gray-50 border-t border-gray-100 px-4 pb-3">
                            <table className="min-w-full text-sm mt-2">
                              <thead>
                                <tr className="text-xs text-gray-500 uppercase tracking-wide">
                                  <th className="py-2 pr-4 text-left">Etapa</th>
                                  <th className="py-2 pr-4 text-left">Estado</th>
                                  <th className="py-2 pr-4 text-left">Inspector</th>
                                  <th className="py-2 pr-4 text-left">Turno</th>
                                  <th className="py-2 pr-4 text-left">Tiempo</th>
                                  <th className="py-2 pr-4 text-left">Resuelto</th>
                                  <th className="py-2 text-left">Detalle</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {grupo.gates.map((item) => (
                                  <tr key={item.qa_gate_id} className="hover:bg-white transition-colors">
                                    <td className="py-2 pr-4 text-gray-700">
                                      {item.etapa_titulo || item.etapa_id}
                                      {item.intento > 1 && <span className="ml-1 text-orange-500 text-xs">×{item.intento}</span>}
                                    </td>
                                    <td className="py-2 pr-4">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${estadoBadge(item.estado_qa)}`}>{item.estado_qa}</span>
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600">{item.inspector || '-'}</td>
                                    <td className="py-2 pr-4 text-gray-600">{item.turno || '-'}</td>
                                    <td className="py-2 pr-4 text-gray-500 text-xs">{fmtMinutos(item.minutos_resolucion)}</td>
                                    <td className="py-2 pr-4 text-gray-500 text-xs whitespace-nowrap">{fmtFecha(item.resolucion_qa)}</td>
                                    <td className="py-2">
                                      <button onClick={() => setDetalleItem(item)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                                        Ver
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {totalPaginas > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button onClick={() => cambiarPagina(historialPage - 1)} disabled={historialPage <= 1 || historialLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                  <FaChevronLeft className="text-xs" /> Anterior
                </button>
                <span className="text-xs text-gray-500">
                  {(historialPage - 1) * HIST_LIMIT + 1}–{Math.min(historialPage * HIST_LIMIT, historialTotal)} de {historialTotal}
                </span>
                <button onClick={() => cambiarPagina(historialPage + 1)} disabled={historialPage >= totalPaginas || historialLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed">
                  Siguiente <FaChevronRight className="text-xs" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {detalleItem && <DetalleHistorialModal item={detalleItem} onClose={() => setDetalleItem(null)} />}

      {/* Modal de confirmación de decisión QA */}
      {pendingDecision && selected && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className={`px-6 py-4 border-b rounded-t-xl ${
              pendingDecision === 'aprobado'    ? 'bg-green-50 border-green-200' :
              pendingDecision === 'rechazado'   ? 'bg-red-50 border-red-200'    :
              'bg-orange-50 border-orange-200'
            }`}>
              <h3 className={`text-base font-semibold ${
                pendingDecision === 'aprobado'    ? 'text-green-800' :
                pendingDecision === 'rechazado'   ? 'text-red-800'   :
                'text-orange-800'
              }`}>
                {pendingDecision === 'aprobado'    ? '✓ Confirmar aprobación' :
                 pendingDecision === 'rechazado'   ? '✗ Confirmar rechazo'    :
                 '⚠ Confirmar condicionado'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                OT <span className="font-semibold text-gray-700">#{selected.numero_orden}</span>
                {' · '}{selected.etapa_titulo}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-700">
                {pendingDecision === 'aprobado'
                  ? 'La etapa quedará aprobada y el operario podrá avanzar al siguiente proceso.'
                  : pendingDecision === 'rechazado'
                  ? 'La etapa quedará rechazada y el operario deberá reiniciar el proceso.'
                  : 'La etapa quedará condicionada con observaciones para continuar.'}
              </p>
              {pendingDecision !== 'aprobado' && !form.motivo_no_conformidad && (
                <p className="mt-2 text-xs text-orange-600 italic">
                  Considera completar el motivo de no conformidad antes de continuar.
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setPendingDecision(null)}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setPendingDecision(null); resolver(pendingDecision); }}
                disabled={saving}
                className={`flex-1 px-4 py-2 text-sm rounded-lg font-semibold text-white transition-colors disabled:opacity-50 ${
                  pendingDecision === 'aprobado'    ? 'bg-green-600 hover:bg-green-700' :
                  pendingDecision === 'rechazado'   ? 'bg-red-600 hover:bg-red-700'    :
                  'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCalidadKanban;
