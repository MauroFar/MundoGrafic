import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaCheckCircle, FaSearch, FaEye,
  FaSync, FaBoxes, FaClipboardList, FaShippingFast
} from 'react-icons/fa';
import OrdenDetalleModal from '../../components/OrdenDetalleModal';

// Solo órdenes con estado 'liberado' en la tabla estado_orden_digital
const ESTADOS_TERMINADO = ['liberado'];

const ETAPA_TIMESTAMPS_KEY = 'mg.etapa.timestamps.v1';

const ETAPA_LIBERADO = { id: 'liberado', titulo: 'Producto Liberado' };
const ETAPA_ENTREGADO = { id: 'entregado', titulo: 'Producto Entregado' };

const normalizeKey = (s) => {
  if (!s) return '';
  return s.toString().toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '_');
};

const badgeStyle = (key) => {
  if (key === 'liberado') return 'bg-green-100 text-green-800 border border-green-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

const badgeLabel = (key, titulo) => {
  if (titulo) return titulo;
  if (key === 'liberado') return 'Producto Liberado';
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

const ModalConfirmacionProceso = ({ datos, onConfirmar, onCancelar }) => {
  if (!datos) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Confirmar envío a proceso</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            OT <span className="font-semibold text-gray-700">#{datos.orden?.numero_orden}</span>
            {datos.orden?.nombre_cliente && <span> · {datos.orden.nombre_cliente}</span>}
          </p>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Proceso destino</label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold text-blue-800">
              {datos.etapaTitulo}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de inicio</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono">
                {datos.fecha}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hora de inicio</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 font-mono">
                {datos.hora}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(datos.fecha, datos.hora)}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductosTerminados = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [confirmacionProceso, setConfirmacionProceso] = useState(null);
  const [etapasDestino, setEtapasDestino] = useState([ETAPA_ENTREGADO]);

  // Modal detalle
  const [showModal, setShowModal] = useState(false);
  const [ordenDetalle, setOrdenDetalle] = useState(null);

  const getAllTimestamps = () => {
    try { return JSON.parse(localStorage.getItem(ETAPA_TIMESTAMPS_KEY) || '{}'); }
    catch { return {}; }
  };

  const saveTimestamp = (ordenId, etapaId, tipo, fecha, hora) => {
    const all = getAllTimestamps();
    const key = `${ordenId}:${etapaId}`;
    all[key] = { ...all[key], [`${tipo}_fecha`]: fecha, [`${tipo}_hora`]: hora };
    localStorage.setItem(ETAPA_TIMESTAMPS_KEY, JSON.stringify(all));
  };

  const cargarWorkflowDigital = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/workflow?tipo=digital`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const workflow = Array.isArray(data?.workflow) ? data.workflow : [];
      const idxLiberado = workflow.findIndex((e) => normalizeKey(e.id) === ETAPA_LIBERADO.id);
      const siguientes = idxLiberado >= 0
        ? workflow.slice(idxLiberado + 1)
        : workflow.filter((e) => normalizeKey(e.id) !== ETAPA_LIBERADO.id);

      const opciones = (siguientes || [])
        .map((e) => ({ id: e.id, titulo: e.titulo || e.id }))
        .filter((e) => Boolean(e.id));

      if (opciones.length > 0) {
        setEtapasDestino(opciones);
        return;
      }
      setEtapasDestino([ETAPA_ENTREGADO]);
    } catch (err) {
      console.error('No se pudo cargar workflow digital', err);
      setEtapasDestino([ETAPA_ENTREGADO]);
    }
  };

  const cargarOrdenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('limite', '1000');
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
          ESTADOS_TERMINADO.includes(o.estado_digital_key)
      );
      setOrdenes(filtrados);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al cargar los productos terminados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
    cargarWorkflowDigital();
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

  const abrirConfirmacionProceso = (orden, etapaDestino) => {
    const now = new Date();
    setConfirmacionProceso({
      orden,
      etapaDestinoId: etapaDestino.id,
      etapaTitulo: etapaDestino.titulo,
      fecha: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
    });
  };

  const confirmarEnvioAProceso = async (fecha, hora) => {
    if (!confirmacionProceso?.orden) return;
    const orden = confirmacionProceso.orden;
    const etapaDestinoId = confirmacionProceso.etapaDestinoId;
    const etapaDestinoTitulo = confirmacionProceso.etapaTitulo;

    try {
      saveTimestamp(orden.id, etapaDestinoId, 'inicio', fecha, hora);
      saveTimestamp(orden.id, ETAPA_LIBERADO.id, 'fin', fecha, hora);

      const token = localStorage.getItem('token');

      await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${orden.id}/ejecucion/${ETAPA_LIBERADO.id}/fin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha_fin: fecha, hora_fin: hora }),
      });

      const resEstado = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${orden.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: etapaDestinoId })
      });
      if (!resEstado.ok) throw new Error('Error al actualizar estado');

      setConfirmacionProceso(null);
      toast.success(`Orden ${orden.numero_orden} enviada a ${etapaDestinoTitulo}`);
      await cargarOrdenes();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'No se pudo enviar la orden a proceso');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">

      <div className="mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white bg-opacity-20 rounded-xl">
              <FaCheckCircle className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Productos Liberados</h1>
              <p className="text-green-100 text-sm mt-0.5">Órdenes digitales con estado Producto Liberado</p>
            </div>
          </div>
          <button
            onClick={async () => { await cargarOrdenes(); await cargarWorkflowDigital(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl backdrop-blur-sm transition-all font-medium"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={FaBoxes}
          label="Total liberados"
          value={ordenesFiltradas.length}
          colorBorder="border-green-500"
          colorIcon="text-green-600"
          colorBg="bg-green-100"
        />
        <StatCard
          icon={FaShippingFast}
          label="Pendientes de entregar"
          value={ordenesFiltradas.length}
          colorBorder="border-emerald-500"
          colorIcon="text-emerald-600"
          colorBg="bg-emerald-100"
        />
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
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={cargarOrdenes}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
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
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
              <span className="text-sm">Cargando órdenes…</span>
            </div>
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaCheckCircle className="text-5xl mb-3 text-green-200" />
            <p className="text-base font-medium">No hay productos liberados</p>
            <p className="text-sm mt-1">No se encontraron órdenes digitales con estado Producto Liberado</p>
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
                  const etapaElegida = etapasDestino[0] || ETAPA_ENTREGADO;
                  return (
                    <tr
                      key={o.id}
                      className={`hover:bg-green-50 cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyle(o.estado_digital_key)}`}>
                          {badgeLabel(o.estado_digital_key, o.estado_digital_titulo)}
                        </span>
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

                          <button
                            onClick={() => abrirConfirmacionProceso(o, etapaElegida)}
                            className="px-2 py-1 rounded-lg text-[11px] transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            Enviar a proceso
                          </button>

                          <button onClick={() => abrirDetalle(o.id)} title="Ver detalle" className="px-2 py-1 rounded-lg text-[11px] bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"><FaEye /> Ver detalle</button>
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

      <ModalConfirmacionProceso
        datos={confirmacionProceso}
        onConfirmar={confirmarEnvioAProceso}
        onCancelar={() => setConfirmacionProceso(null)}
      />
    </div>
  );
};

export default ProductosTerminados;
