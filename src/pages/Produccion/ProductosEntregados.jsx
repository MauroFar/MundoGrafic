import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaBoxOpen, FaSearch, FaEye, FaEdit, FaSync,
  FaTruck, FaFileInvoiceDollar, FaCheckDouble, FaClipboardList
} from 'react-icons/fa';
import OrdenDetalleModal from '../../components/OrdenDetalleModal';
import ModalRegistroEjecucion from './ModalRegistroEjecucion';

const ESTADOS_ENTREGADO = ['entregado', 'facturado', 'completado'];

const QA_STORAGE_KEY = 'mg.qa.gates.v1';
const QA_QUEUE_KEY = 'mg.qa.queue.v1';
const ETAPA_ENTREGADO = { id: 'entregado', titulo: 'Producto Entregado' };

const normalizeKey = (s) => {
  if (!s) return '';
  return s.toString().toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_');
};

const badgeStyle = (key) => {
  if (key === 'entregado') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

const badgeLabel = (key, titulo) => {
  if (titulo) return titulo;
  if (key === 'entregado') return 'Producto Entregado';
  return key || '-';
};

const StatCard = ({ icon: Icon, label, value, colorBorder, colorIcon, colorBg }) => (
  <div className={`bg-white rounded-xl shadow-sm border-l-4 ${colorBorder} p-4 flex items-center gap-4`}>
    <div className={`p-3 rounded-full ${colorBg}`}>
      <Icon className={`text-xl ${colorIcon}`} />
    </div>
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const formatDate = (d) => {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};

const ProductosEntregados = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [qaGates, setQaGates] = useState({});
  const [registroEjecucion, setRegistroEjecucion] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState(null);

  const gateKey = (ordenId, etapaId) => `${ordenId}:${etapaId}`;

  const loadQaFromBackend = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/qa/estados`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const json = await res.json();
      const gates = {};
      (json.gates || []).forEach((g) => {
        gates[`${g.orden_trabajo_id}:${g.etapa_id}`] = { estado: g.estado, updatedAt: g.updated_at };
      });
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(gates));
      setQaGates(gates);
    } catch (err) {
      console.error('No se pudieron cargar estados de QA', err);
      try {
        const raw = localStorage.getItem(QA_STORAGE_KEY);
        setQaGates(raw ? JSON.parse(raw) : {});
      } catch {
        setQaGates({});
      }
    }
  };

  const getQaState = (ordenId, etapaId) => qaGates[gateKey(ordenId, etapaId)] || null;

  const saveQaState = (ordenId, etapaId, estado, observacion = '') => {
    setQaGates((prev) => {
      const updated = {
        ...prev,
        [gateKey(ordenId, etapaId)]: { estado, observacion, updatedAt: new Date().toISOString() },
      };
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const upsertQaQueue = async (orden, etapa) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${orden.id}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ etapa_id: etapa.id, etapa_titulo: etapa.titulo }),
      });
    } catch (err) {
      console.error('No se pudo crear QA gate en backend', err);
    }

    try {
      const raw = localStorage.getItem(QA_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      const itemId = `${orden.id}:${etapa.id}`;
      const nextItem = {
        id: itemId,
        ordenId: orden.id,
        numeroOrden: orden.numero_orden,
        cliente: orden.nombre_cliente,
        producto: orden.concepto || '',
        cantidad: orden.cantidad || '',
        etapaId: etapa.id,
        etapaTitulo: etapa.titulo,
        estado: 'pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const idx = queue.findIndex((q) => q.id === itemId);
      if (idx >= 0) queue[idx] = { ...queue[idx], ...nextItem };
      else queue.unshift(nextItem);
      localStorage.setItem(QA_QUEUE_KEY, JSON.stringify(queue));
      window.dispatchEvent(new Event('qa-queue-updated'));
    } catch (err) {
      console.error('Error actualizando caché QA', err);
    }
  };

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('limite', '1000');
      if (busqueda) params.append('busqueda', busqueda);
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);

      const res = await fetch(`${apiUrl}/api/ordenTrabajo/listar?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar las órdenes');
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

      const filtrados = arr.filter(
        (o) =>
          normalizeKey(o.tipo_orden) === 'digital' &&
          ESTADOS_ENTREGADO.includes(o.estado_digital_key)
      );
      setOrdenes(filtrados);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al cargar los productos entregados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
    loadQaFromBackend();
  }, []);

  useEffect(() => {
    const refreshQa = () => { loadQaFromBackend(); };
    window.addEventListener('qa-gates-updated', refreshQa);
    return () => window.removeEventListener('qa-gates-updated', refreshQa);
  }, []);

  const abrirDetalle = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/ordenTrabajo/orden/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar detalle');
      const data = await res.json();
      setOrdenDetalle(data);
      setShowModal(true);
    } catch (err) {
      toast.error(err.message || 'Error al abrir detalle');
    }
  };

  const ordenesFiltradas = ordenes.filter((o) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      (o.numero_orden || '').toLowerCase().includes(q) ||
      (o.nombre_cliente || '').toLowerCase().includes(q) ||
      (o.concepto || '').toLowerCase().includes(q)
    );
  });

  const totalEntregado = ordenesFiltradas.filter(o => o.estado_digital_key === 'entregado').length;
  const totalFacturado = 0;
  const totalCompletado = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 p-6">

      <div className="mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-700 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white bg-opacity-20 rounded-xl">
              <FaBoxOpen className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Productos Entregados</h1>
              <p className="text-teal-100 text-sm mt-0.5">Órdenes digitales — Entregado / Completado / Facturado</p>
            </div>
          </div>
          <button
            onClick={async () => { await cargarOrdenes(); await loadQaFromBackend(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl backdrop-blur-sm transition-all font-medium"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FaBoxOpen} label="Total registros" value={ordenesFiltradas.length} colorBorder="border-teal-500" colorIcon="text-teal-600" colorBg="bg-teal-100" />
        <StatCard icon={FaTruck} label="Entregados" value={totalEntregado} colorBorder="border-emerald-500" colorIcon="text-emerald-600" colorBg="bg-emerald-100" />
        <StatCard icon={FaCheckDouble} label="Completados" value={totalCompletado} colorBorder="border-green-500" colorIcon="text-green-600" colorBg="bg-green-100" />
        <StatCard icon={FaFileInvoiceDollar} label="Facturados" value={totalFacturado} colorBorder="border-blue-500" colorIcon="text-blue-600" colorBg="bg-blue-100" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por N° orden, cliente o concepto…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={async () => { await cargarOrdenes(); await loadQaFromBackend(); }} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors">
            Aplicar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-sm font-semibold text-gray-600">
            {loading ? 'Cargando…' : `${ordenesFiltradas.length} registro${ordenesFiltradas.length !== 1 ? 's' : ''}`}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <FaClipboardList /> Solo órdenes digitales
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
              <span className="text-sm">Cargando órdenes…</span>
            </div>
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaBoxOpen className="text-5xl mb-3 text-teal-200" />
            <p className="text-base font-medium">No hay productos entregados</p>
            <p className="text-sm mt-1">No se encontraron órdenes digitales entregadas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Concepto / Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">F. Entrega</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">F. Creación</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ordenesFiltradas.map((o, i) => {
                  const gate = getQaState(o.id, ETAPA_ENTREGADO.id);
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-teal-50 cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                      onClick={() => abrirDetalle(o.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{o.numero_orden || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          o.tipo_orden === 'digital' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {o.tipo_orden === 'digital' ? 'Digital' : 'Offset'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{o.nombre_cliente || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs"><span className="block truncate">{o.concepto || '-'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyle(o.estado_digital_key)}`}>
                            {badgeLabel(o.estado_digital_key, o.estado_digital_titulo)}
                          </span>
                          {gate && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              gate.estado === 'aprobado' ? 'bg-green-100 text-green-700' :
                              gate.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                              gate.estado === 'condicionado' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {gate.estado === 'aprobado' ? 'Calidad aprobada' :
                               gate.estado === 'rechazado' ? 'Calidad rechazada' :
                               gate.estado === 'condicionado' ? 'Calidad condicionada' :
                               'Enviado a calidad'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(o.fecha_entrega)}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(o.fecha_creacion || o.created_at)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-stretch justify-center gap-1 min-w-[165px]">
                          <button
                            onClick={() => navigate(`/produccion/seguimiento/${o.id}`)}
                            className="px-2 py-1 rounded-lg text-[11px] bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          >
                            Ver trazabilidad
                          </button>

                          {!gate && (
                            <button
                              onClick={() => setRegistroEjecucion({ orden: o, etapa: ETAPA_ENTREGADO })}
                              className="px-2 py-1 rounded-lg text-[11px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                            >
                              Enviar a calidad
                            </button>
                          )}

                          {(gate?.estado === 'rechazado' || gate?.estado === 'condicionado') && (
                            <button
                              onClick={() => setRegistroEjecucion({ orden: o, etapa: ETAPA_ENTREGADO })}
                              className="px-2 py-1 rounded-lg text-[11px] bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors"
                            >
                              Reenviar a calidad
                            </button>
                          )}

                          {gate?.estado === 'pendiente' && (
                            <div className="px-2 py-1 rounded-lg text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 text-center leading-snug">
                              Esperando aprobación de calidad
                            </div>
                          )}

                          <button
                            disabled={true}
                            className="px-2 py-1 rounded-lg text-[11px] bg-gray-100 text-gray-400 cursor-not-allowed"
                            title="La etapa Entregado no tiene proceso posterior"
                          >
                            Enviar a proceso
                          </button>

                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => abrirDetalle(o.id)} title="Ver detalle" className="p-2 rounded-lg text-teal-600 hover:bg-teal-100 transition-colors"><FaEye /></button>
                            <button onClick={() => navigate(`/ordendeTrabajo/editar/${o.id}`)} title="Editar" className="p-2 rounded-lg text-yellow-600 hover:bg-yellow-100 transition-colors"><FaEdit /></button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <OrdenDetalleModal
          ordenDetalle={ordenDetalle}
          onClose={() => { setShowModal(false); setOrdenDetalle(null); }}
          onEdit={(id) => { setShowModal(false); navigate(`/ordendeTrabajo/editar/${id}`); }}
          onViewPDF={(id) => window.open(`${apiUrl}/api/ordenTrabajo/${id}/preview`, '_blank')}
          canEdit={true}
        />
      )}

      {registroEjecucion && (
        <ModalRegistroEjecucion
          orden={registroEjecucion.orden}
          etapa={registroEjecucion.etapa}
          onConfirmar={async () => {
            saveQaState(registroEjecucion.orden.id, ETAPA_ENTREGADO.id, 'pendiente');
            await upsertQaQueue(registroEjecucion.orden, ETAPA_ENTREGADO);
            setRegistroEjecucion(null);
          }}
          onCancelar={() => setRegistroEjecucion(null)}
        />
      )}
    </div>
  );
};

export default ProductosEntregados;
