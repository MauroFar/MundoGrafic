import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClipboardCheck, FaSync } from 'react-icons/fa';

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
  turno: '',
  maquina_equipo: '',
  unidad_medida: '',
  lote_version_arte: '',
  motivo_no_conformidad: '',
  accion_correctiva: '',
  observaciones: '',
  cierre_qa_responsable: '',
  cierre_qa_fecha: '',
  cierre_qa_hora: '',
});

const GestionCalidadKanban = () => {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm());

  const cargar = async () => {
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
      if (rows.length > 0 && !selectedId) setSelectedId(rows[0].qa_gate_id);
    } catch (err) {
      console.error('Error cargando cola QA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line
  }, []);

  // Cuando cambia la selección, pre-rellenar el form con los datos que ya tenga el gate
  useEffect(() => {
    if (!selected) return;
    setForm({
      resultado_control:    selected.resultado_control    || 'pendiente',
      inspector:            selected.inspector            || '',
      turno:                selected.turno                || '',
      maquina_equipo:       selected.maquina_equipo       || '',
      unidad_medida:        selected.unidad_medida        || '',
      lote_version_arte:    selected.lote_version_arte    || '',
      motivo_no_conformidad: selected.motivo_no_conformidad || '',
      accion_correctiva:    selected.accion_correctiva    || '',
      observaciones:        selected.observaciones        || '',
      cierre_qa_responsable: selected.cierre_qa_responsable || '',
      cierre_qa_fecha:      selected.cierre_qa_fecha      || '',
      cierre_qa_hora:       selected.cierre_qa_hora       || '',
    });
  // eslint-disable-next-line
  }, [selectedId]);

  const pendientes = useMemo(() => items.filter((i) => i.estado_qa === 'pendiente'), [items]);
  const selected   = useMemo(() => items.find((i) => i.qa_gate_id === selectedId) || null, [items, selectedId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Sincronizar el estado del gate en localStorage para que el Kanban lo refleje
  const syncLocalGate = (ordenId, etapaId, estado) => {
    try {
      const raw   = localStorage.getItem(QA_STORAGE_KEY);
      const gates = raw ? JSON.parse(raw) : {};
      gates[`${ordenId}:${etapaId}`] = { estado, updatedAt: new Date().toISOString() };
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(gates));
      window.dispatchEvent(new Event('qa-gates-updated'));
    } catch (e) {
      console.error('Error sincronizando gate local', e);
    }
  };

  const resolver = async (estado) => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const body  = {
        ...form,
        estado,
        resultado_control: estado === 'aprobado' ? 'aprobado' : 'rechazado',
      };
      const res = await fetch(
        `${apiUrl}/api/ordenTrabajo/produccion/${selected.orden_trabajo_id}/qa/${selected.qa_gate_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error('Error actualizando gate');
      syncLocalGate(selected.orden_trabajo_id, selected.etapa_id, estado);
      await cargar();
    } catch (err) {
      console.error('Error resolviendo gate QA:', err);
      alert('No se pudo guardar la decisión. Verifica la conexión.');
    } finally {
      setSaving(false);
    }
  };

  const guardarBorrador = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${apiUrl}/api/ordenTrabajo/produccion/${selected.orden_trabajo_id}/qa/${selected.qa_gate_id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        },
      );
      if (!res.ok) throw new Error('Error guardando borrador');
      await cargar();
    } catch (err) {
      console.error('Error guardando borrador QA:', err);
      alert('No se pudo guardar. Verifica la conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaClipboardCheck className="text-indigo-600" />
          Control de Calidad
        </h1>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Pendientes: <span className="font-semibold text-yellow-700">{pendientes.length}</span>
        &nbsp;·&nbsp; Total cola: <span className="font-semibold">{items.length}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden lg:col-span-1">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Orden</th>
                  <th className="px-3 py-2 text-left">Etapa</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.qa_gate_id}
                    className={`border-t cursor-pointer ${selectedId === item.qa_gate_id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelectedId(item.qa_gate_id)}
                  >
                    <td className="px-3 py-2 font-medium">{item.numero_orden}</td>
                    <td className="px-3 py-2">{item.etapa_titulo || item.etapa_id}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.estado_qa === 'aprobado'   ? 'bg-green-100 text-green-700' :
                        item.estado_qa === 'rechazado'  ? 'bg-red-100 text-red-700'    :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.estado_qa}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-center text-gray-500" colSpan={3}>
                      No hay órdenes en cola de calidad.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel de revisión */}
        <div className="bg-white border border-gray-200 rounded p-4 lg:col-span-2">
          {!selected ? (
            <div className="text-gray-500 text-sm">Selecciona una orden para revisar.</div>
          ) : (
            <>
              {/* Encabezado */}
              <div className="mb-4 text-sm text-gray-700">
                <span className="font-semibold">Orden:</span> {selected.numero_orden}
                &nbsp;·&nbsp;<span className="font-semibold">Cliente:</span> {selected.nombre_cliente || '-'}
                &nbsp;·&nbsp;<span className="font-semibold">Etapa:</span> {selected.etapa_titulo || selected.etapa_id}
                {selected.intento > 1 && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs">
                    Reintento #{selected.intento}
                  </span>
                )}
              </div>

              {/* Registro del operario */}
              {selected.operario ? (
                <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                    Registro del operario
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                    {/* Campos comunes */}
                    {[
                      ['operario',     selected.operario],
                      ['fecha_inicio', selected.fecha_inicio],
                      ['hora_inicio',  selected.hora_inicio],
                      ['fecha_fin',    selected.fecha_fin],
                      ['hora_fin',     selected.hora_fin],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="text-gray-500">{etiquetasCampos[k] || k}: </span>
                        <span className="font-medium text-gray-800">{String(v)}</span>
                      </div>
                    ))}
                    {/* Campos específicos de la etapa */}
                    {selected.datos_etapa && Object.entries(selected.datos_etapa)
                      .filter(([, v]) => v !== '' && v !== false && v !== null)
                      .map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="text-gray-500">{etiquetasCampos[k] || k}: </span>
                          <span className="font-medium text-gray-800">
                            {typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v)}
                          </span>
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
                <div className="mb-4 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  El operario aún no registró datos de ejecución para esta etapa.
                </div>
              )}

              {/* Formulario QA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Resultado de control</label>
                  <select className="w-full border rounded px-2 py-1 text-sm" value={form.resultado_control} onChange={(e) => setField('resultado_control', e.target.value)}>
                    {RESULTADO_CONTROL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Inspector</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={form.inspector} onChange={(e) => setField('inspector', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Turno</label>
                  <select className="w-full border rounded px-2 py-1 text-sm" value={form.turno} onChange={(e) => setField('turno', e.target.value)}>
                    <option value="">-- Seleccione --</option>
                    {TURNOS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Máquina / Equipo</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={form.maquina_equipo} onChange={(e) => setField('maquina_equipo', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unidad de medida</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={form.unidad_medida} onChange={(e) => setField('unidad_medida', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lote / versión de arte</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={form.lote_version_arte} onChange={(e) => setField('lote_version_arte', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de no conformidad</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={form.motivo_no_conformidad} onChange={(e) => setField('motivo_no_conformidad', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Acción correctiva</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={form.accion_correctiva} onChange={(e) => setField('accion_correctiva', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea rows={2} className="w-full border rounded px-2 py-1 text-sm resize-none" value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Responsable cierre QA</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={form.cierre_qa_responsable} onChange={(e) => setField('cierre_qa_responsable', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha cierre QA</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="date" value={form.cierre_qa_fecha} onChange={(e) => setField('cierre_qa_fecha', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hora cierre QA</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="time" value={form.cierre_qa_hora} onChange={(e) => setField('cierre_qa_hora', e.target.value)} />
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => resolver('aprobado')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                >
                  <FaCheckCircle /> Aprobar
                </button>
                <button
                  onClick={() => resolver('rechazado')}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  <FaTimesCircle /> Rechazar
                </button>
                <button
                  onClick={guardarBorrador}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar borrador'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionCalidadKanban;
