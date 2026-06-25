import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OFFSET_STATES = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_preprensa', label: 'En Preprensa' },
  { key: 'en_prensa', label: 'En Prensa' },
  { key: 'terminados', label: 'Terminados' },
];

const normalizeEstado = (value) =>
  (value || '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '_');

const WorkstationPreprensa = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [notificacion, setNotificacion] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setNotificacion(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/ordenes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo cargar órdenes');
      const json = await res.json();
      const rows = Array.isArray(json.ordenes) ? json.ordenes : [];

      const offset = rows.filter((o) => {
        const tipoOrdenRaw = (o.tipo_orden || '').toString().toLowerCase().trim();
        const esDigital =
          tipoOrdenRaw === 'digital' ||
          Boolean(o.estado_digital_key) ||
          Boolean(o.estado_orden_digital_id);
        return !esDigital;
      });

      setOrdenes(offset);
    } catch (err) {
      console.error('Error cargando órdenes OFFSET:', err);
      setNotificacion({ type: 'error', message: 'No se pudieron cargar las órdenes. Revisa la conexión con el backend.' });
    } finally {
      setLoading(false);
    }
  };

  const visibleOrdenes = useMemo(() => {
    if (filtroEstado === 'todos') return ordenes;
    return ordenes.filter((orden) => {
      const estado = normalizeEstado(orden.estado_offset_key || orden.estado || orden.estado_offset_titulo);
      return estado === filtroEstado;
    });
  }, [filtroEstado, ordenes]);

  const getOrdenEstado = (orden) =>
    normalizeEstado(orden.estado_offset_key || orden.estado || orden.estado_offset_titulo || 'pendiente');

  const getEstadoLabel = (orden) => {
    const estado = getOrdenEstado(orden);
    const estadoItem = OFFSET_STATES.find((item) => item.key === estado);
    return estadoItem ? estadoItem.label : orden.estado_offset_titulo || orden.estado || 'Pendiente';
  };

  const mostrarAccion = (orden) => {
    const estado = getOrdenEstado(orden);
    if (estado === 'pendiente') return 'en_preprensa';
    if (estado === 'en_preprensa') return 'en_prensa';
    if (estado === 'en_prensa') return 'terminados';
    return null;
  };

  const getAccionLabel = (orden) => {
    const next = mostrarAccion(orden);
    if (next === 'en_preprensa') return 'Iniciar Preprensa';
    if (next === 'en_prensa') return 'Enviar a Prensa';
    if (next === 'terminados') return 'Marcar Terminados';
    return 'Sin acción disponible';
  };

  const actualizarEstado = async (orden, nuevoEstado) => {
    const token = localStorage.getItem('token');
    const payload = {
      estado: nuevoEstado,
    };

    if (nuevoEstado === 'en_preprensa') {
      payload.preprensa = 'Estación Offset';
    }
    if (nuevoEstado === 'en_prensa') {
      payload.prensa = 'Prensa General';
    }
    if (nuevoEstado === 'terminados') {
      payload.terminados = 'Equipo de Terminados';
    }

    try {
      const res = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${orden.id}/estado`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const message = data?.error || 'Error al actualizar estado';
        throw new Error(message);
      }

      setOrdenes((prev) =>
        prev.map((o) => (o.id === orden.id ? { ...o, ...data.orden } : o)),
      );
      setNotificacion({ type: 'success', message: `Orden ${orden.numero_orden} actualizada a ${getEstadoLabel({ estado_offset_key: nuevoEstado })}` });
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setNotificacion({ type: 'error', message: err.message || 'No se pudo cambiar el estado.' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Módulo Offset / Preprensa</h1>
          <p className="text-gray-600">Lista general de órdenes OFFSET con acciones de inicio y cambio de etapa.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos los estados</option>
            {OFFSET_STATES.map((estado) => (
              <option key={estado.key} value={estado.key}>{estado.label}</option>
            ))}
          </select>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Actualizar lista'}
          </button>
          <button
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            onClick={() => navigate('/produccion/kanban')}
          >
            Ir al Kanban
          </button>
        </div>
      </div>

      {notificacion && (
        <div className={`mb-4 rounded-md px-4 py-3 ${notificacion.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {notificacion.message}
        </div>
      )}

      <div className="grid gap-4">
        {visibleOrdenes.length === 0 && !loading && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
            No se encontraron órdenes OFFSET con el filtro seleccionado.
          </div>
        )}

        {visibleOrdenes.map((orden) => {
          const accion = mostrarAccion(orden);
          return (
            <div key={orden.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm text-gray-500">OT #{orden.numero_orden} · {orden.nombre_cliente || 'Sin cliente'}</div>
                  <h2 className="text-xl font-semibold text-gray-900">{orden.concepto || orden.tipo_orden || 'Sin concepto'}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{getEstadoLabel(orden)}</span>
                    <span className="text-gray-500">Cantidad: {orden.cantidad || orden.cantidad_total || '-'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                    onClick={() => navigate(`/produccion/seguimiento/${orden.id}`)}
                  >
                    Ver seguimiento
                  </button>
                  {accion && (
                    <button
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      onClick={() => actualizarEstado(orden, accion)}
                    >
                      {getAccionLabel(orden)}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <p className="text-sm text-gray-600"><strong>Cliente:</strong> {orden.nombre_cliente || 'No informado'}</p>
                <p className="text-sm text-gray-600"><strong>Tipo de orden:</strong> {orden.tipo_orden || 'OFFSET'}</p>
                <p className="text-sm text-gray-600"><strong>Responsable actual:</strong> {orden.preprensa || orden.prensa || orden.terminados || 'Sin asignar'}</p>
                <p className="text-sm text-gray-600"><strong>Última actualización:</strong> {orden.updated_at ? new Date(orden.updated_at).toLocaleString() : 'No disponible'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkstationPreprensa;
