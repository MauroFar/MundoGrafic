import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClipboardCheck } from 'react-icons/fa';

const QA_STORAGE_KEY = 'mg.qa.gates.v1';
const QA_QUEUE_KEY = 'mg.qa.queue.v1';

const defaultQaData = () => ({
  estado_etapa: 'pendiente',
  resultado_control: 'pendiente',
  motivo_no_conformidad: '',
  accion_correctiva: '',
  turno: '',
  maquina_equipo: '',
  unidad_medida: '',
  lote_version_arte: '',
  cierre_qa_responsable: '',
  cierre_qa_fecha: '',
  cierre_qa_hora: '',
  observaciones: '',
});

const GestionCalidadKanban = () => {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const ESTADOS_ETAPA_OPTIONS = ['pendiente', 'en_proceso', 'finalizado', 'rechazado'];
  const RESULTADO_CONTROL_OPTIONS = ['pendiente', 'aprobado', 'condicionado', 'rechazado'];
  const TURNOS_OPTIONS = ['Manana', 'Tarde', 'Noche'];

  const cargar = () => {
    try {
      const raw = localStorage.getItem(QA_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      const normalized = (Array.isArray(queue) ? queue : []).map((item) => ({
        ...item,
        qa: { ...defaultQaData(), ...(item.qa || {}) },
      }));
      setItems(normalized);
      if (normalized.length > 0 && !selectedId) setSelectedId(normalized[0].id);
    } catch (err) {
      console.error('Error cargando cola QA', err);
      setItems([]);
    }
  };

  useEffect(() => {
    cargar();
    const onUpdate = () => cargar();
    window.addEventListener('qa-queue-updated', onUpdate);
    return () => window.removeEventListener('qa-queue-updated', onUpdate);
  }, []);

  const pendientes = useMemo(() => items.filter((i) => i.estado === 'pendiente'), [items]);
  const selected = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);

  const guardarGate = (item, estado) => {
    try {
      const raw = localStorage.getItem(QA_STORAGE_KEY);
      const gates = raw ? JSON.parse(raw) : {};
      const key = `${item.ordenId}:${item.etapaId}`;
      gates[key] = {
        estado,
        observacion: item?.qa?.observaciones || '',
        qa: item?.qa || defaultQaData(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(gates));
      window.dispatchEvent(new Event('qa-gates-updated'));
    } catch (err) {
      console.error('Error guardando gate QA', err);
    }
  };

  const resolver = (item, estado) => {
    const updated = items.map((it) =>
      it.id === item.id
        ? {
            ...it,
            estado,
            qa: {
              ...defaultQaData(),
              ...(it.qa || {}),
              resultado_control: estado === 'aprobado' ? 'aprobado' : 'rechazado',
              estado_etapa: estado === 'aprobado' ? 'finalizado' : 'rechazado',
            },
            updatedAt: new Date().toISOString(),
          }
        : it,
    );
    setItems(updated);
    localStorage.setItem(QA_QUEUE_KEY, JSON.stringify(updated));
    const resolvedItem = updated.find((it) => it.id === item.id) || item;
    guardarGate(resolvedItem, estado);
    window.dispatchEvent(new Event('qa-queue-updated'));
  };

  const updateQaField = (itemId, field, value) => {
    const updated = items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            qa: {
              ...defaultQaData(),
              ...(it.qa || {}),
              [field]: value,
            },
            updatedAt: new Date().toISOString(),
          }
        : it,
    );
    setItems(updated);
    localStorage.setItem(QA_QUEUE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('qa-queue-updated'));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaClipboardCheck className="text-indigo-600" />
          Gestion de Calidad (Prototipo)
        </h1>
        <button
          onClick={cargar}
          className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Actualizar
        </button>
      </div>

      <div className="mb-4 rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
        Aqui llegan las ordenes enviadas desde Kanban con "Enviar a calidad".
      </div>

      <div className="mb-4 text-sm text-gray-700">
        Pendientes: <span className="font-semibold">{pendientes.length}</span> | Total cola: <span className="font-semibold">{items.length}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded overflow-hidden lg:col-span-1">
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
                  key={item.id}
                  className={`border-t cursor-pointer ${selectedId === item.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <td className="px-3 py-2 font-medium">{item.numeroOrden}</td>
                  <td className="px-3 py-2">{item.etapaTitulo || item.etapaId}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.estado === 'aprobado'
                          ? 'bg-green-100 text-green-700'
                          : item.estado === 'rechazado'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-gray-500" colSpan={3}>
                    No hay ordenes en cola de calidad.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4 lg:col-span-2">
          {!selected ? (
            <div className="text-gray-500">Selecciona una orden para registrar calidad y auditoria.</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Orden:</span> {selected.numeroOrden} | <span className="font-semibold">Cliente:</span> {selected.cliente || '-'} | <span className="font-semibold">Etapa:</span> {selected.etapaTitulo || selected.etapaId}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado de Etapa</label>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={selected.qa?.estado_etapa || 'pendiente'}
                    onChange={(e) => updateQaField(selected.id, 'estado_etapa', e.target.value)}
                  >
                    {ESTADOS_ETAPA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Resultado de Control</label>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={selected.qa?.resultado_control || 'pendiente'}
                    onChange={(e) => updateQaField(selected.id, 'resultado_control', e.target.value)}
                  >
                    {RESULTADO_CONTROL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Turno</label>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={selected.qa?.turno || ''}
                    onChange={(e) => updateQaField(selected.id, 'turno', e.target.value)}
                  >
                    <option value="">-- Seleccione --</option>
                    {TURNOS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Maquina/Equipo</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={selected.qa?.maquina_equipo || ''} onChange={(e) => updateQaField(selected.id, 'maquina_equipo', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unidad de Medida</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={selected.qa?.unidad_medida || ''} onChange={(e) => updateQaField(selected.id, 'unidad_medida', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Lote/Version de Arte</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={selected.qa?.lote_version_arte || ''} onChange={(e) => updateQaField(selected.id, 'lote_version_arte', e.target.value)} />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de No Conformidad</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={selected.qa?.motivo_no_conformidad || ''} onChange={(e) => updateQaField(selected.id, 'motivo_no_conformidad', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Accion Correctiva</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={selected.qa?.accion_correctiva || ''} onChange={(e) => updateQaField(selected.id, 'accion_correctiva', e.target.value)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={selected.qa?.observaciones || ''} onChange={(e) => updateQaField(selected.id, 'observaciones', e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cierre QA Responsable</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="text" value={selected.qa?.cierre_qa_responsable || ''} onChange={(e) => updateQaField(selected.id, 'cierre_qa_responsable', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cierre QA Fecha</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="date" value={selected.qa?.cierre_qa_fecha || ''} onChange={(e) => updateQaField(selected.id, 'cierre_qa_fecha', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cierre QA Hora</label>
                  <input className="w-full border rounded px-2 py-1 text-sm" type="time" value={selected.qa?.cierre_qa_hora || ''} onChange={(e) => updateQaField(selected.id, 'cierre_qa_hora', e.target.value)} />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => resolver(selected, 'aprobado')}
                  className="px-3 py-2 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-2"
                >
                  <FaCheckCircle /> Aprobar
                </button>
                <button
                  onClick={() => resolver(selected, 'rechazado')}
                  className="px-3 py-2 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2"
                >
                  <FaTimesCircle /> Rechazar
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
