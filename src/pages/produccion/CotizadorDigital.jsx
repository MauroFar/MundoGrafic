import React, { useEffect, useMemo, useState } from 'react';
import {
  obtenerMaterialesDigitales,
  obtenerProcesosDigitales,
  obtenerCostosOperativosDigitales,
  obtenerConfiguracionComercialDigital,
  obtenerTiposProductoDigitales,
} from '../../services/digitalCostosService';

const formatMoney = (value) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const toNumber = (value) => Number(value || 0);

const getTipoCobroLabel = (tipo) => {
  switch ((tipo || '').toLowerCase()) {
    case 'metro':
      return 'Por Metro';
    case 'fijo':
      return 'Costo Fijo';
    case 'millar':
      return 'Por Millar';
    default:
      return 'Por Metro';
  }
};

const calcularValorItem = (item, metros) => {
  const tipo = (item?.tipo_cobro || 'metro').toLowerCase();
  const valorBase =
    toNumber(item?.costo_unitario ?? item?.precio ?? item?.costo_fijo ?? 0);

  if (tipo === 'fijo') return valorBase;
  if (tipo === 'millar') return valorBase * (toNumber(metros) / 1000);
  return valorBase * toNumber(metros);
};

const redondearDecimalAEntero = (valor) => {
  const numero = Number(valor || 0);
  if (!Number.isFinite(numero)) return 0;
  const parteDecimal = Math.abs(numero) - Math.floor(Math.abs(numero));
  if (parteDecimal >= 0.5) {
    return Math.ceil(numero);
  }
  return Math.floor(numero);
};

const CotizadorDigital = () => {
  const [tiposProducto, setTiposProducto] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [operativos, setOperativos] = useState([]);
  const [configuracion, setConfiguracion] = useState({ margenes: [], plazos: [] });
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [cabidaInputs, setCabidaInputs] = useState({
    anchoEtiqueta: '',
    altoEtiqueta: '',
    anchoImpresion: 31.5,
    largoMaterial: 100,
    separacionAncho: 0.3,
    separacionAvance: 0.5,
  });
  const [metrosExcedenteManual, setMetrosExcedenteManual] = useState('50');
  const [selecciones, setSelecciones] = useState({ materiales: {}, procesos: {}, operativos: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [tiposProductoData, materialesData, procesosData, operativosData, configData] = await Promise.all([
          obtenerTiposProductoDigitales(),
          obtenerMaterialesDigitales(),
          obtenerProcesosDigitales(),
          obtenerCostosOperativosDigitales(),
          obtenerConfiguracionComercialDigital(),
        ]);

        const tiposActivos = (tiposProductoData || []).filter((item) => item.activo !== false);
        setTiposProducto(tiposActivos);
        setMateriales((materialesData || []).filter((item) => item.estado === 'Activo'));
        setProcesos((procesosData || []).filter((item) => item.estado === 'Activo'));
        setOperativos((operativosData || []).filter((item) => item.estado === 'Activo'));
        setConfiguracion(configData || { margenes: [], plazos: [] });

        if (tiposActivos.length > 0) {
          setProductoSeleccionado(String(tiposActivos[0].id));
        }
      } catch (error) {
        console.error('Error cargando cotizador digital:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const margenActivo = useMemo(() => {
    const margenEnUso = (configuracion?.margenes || []).find((item) => item.activo) || (configuracion?.margenes || [])[0];
    return Number(margenEnUso?.porcentaje || 0);
  }, [configuracion]);

  const productoIdSeleccionado = Number(productoSeleccionado || 0);

  const materialesDelProducto = useMemo(() => {
    if (!productoIdSeleccionado) return [];
    return materiales.filter((item) => (item.tipo_producto_ids || []).includes(productoIdSeleccionado));
  }, [materiales, productoIdSeleccionado]);

  const procesosDelProducto = useMemo(() => {
    if (!productoIdSeleccionado) return [];
    return procesos.filter((item) => (item.tipo_producto_ids || []).includes(productoIdSeleccionado));
  }, [procesos, productoIdSeleccionado]);

  const operativosDelProducto = useMemo(() => {
    if (!productoIdSeleccionado) return [];
    return operativos.filter((item) => (item.tipo_producto_ids || []).includes(productoIdSeleccionado));
  }, [operativos, productoIdSeleccionado]);

  useEffect(() => {
    if (!productoIdSeleccionado) return;

    setSelecciones((prev) => {
      const next = { materiales: { ...(prev.materiales || {}) }, procesos: { ...(prev.procesos || {}) }, operativos: { ...(prev.operativos || {}) } };

      materialesDelProducto.forEach((item) => {
        if (next.materiales[item.id] === undefined) next.materiales[item.id] = true;
      });
      procesosDelProducto.forEach((item) => {
        if (next.procesos[item.id] === undefined) next.procesos[item.id] = true;
      });
      operativosDelProducto.forEach((item) => {
        if (next.operativos[item.id] === undefined) next.operativos[item.id] = true;
      });

      return next;
    });
  }, [productoIdSeleccionado, materialesDelProducto, procesosDelProducto, operativosDelProducto]);

  const toggleSeleccion = (tipo, id) => {
    setSelecciones((prev) => ({
      ...prev,
      [tipo]: {
        ...(prev[tipo] || {}),
        [id]: !Boolean(prev[tipo]?.[id]),
      },
    }));
  };

  const materialesIncluidos = useMemo(
    () => materialesDelProducto.filter((item) => selecciones.materiales[item.id] !== false),
    [materialesDelProducto, selecciones.materiales],
  );

  const procesosIncluidos = useMemo(
    () => procesosDelProducto.filter((item) => selecciones.procesos[item.id] !== false),
    [procesosDelProducto, selecciones.procesos],
  );

  const operativosIncluidos = useMemo(
    () => operativosDelProducto.filter((item) => selecciones.operativos[item.id] !== false),
    [operativosDelProducto, selecciones.operativos],
  );

  const cabidaCalculada = useMemo(() => {
    const anchoEtiqueta = Number(cabidaInputs.anchoEtiqueta || 0);
    const altoEtiqueta = Number(cabidaInputs.altoEtiqueta || 0);
    const anchoImpresion = Number(cabidaInputs.anchoImpresion || 0);
    const largoMaterial = Number(cabidaInputs.largoMaterial || 0);
    const separacionAncho = Number(cabidaInputs.separacionAncho || 0);
    const separacionAvance = Number(cabidaInputs.separacionAvance || 0);
    const cantidadNumero = Number(cantidad || 0);
    const metrosExcedente = Number(metrosExcedenteManual || 0);

    const etiquetasAncho = anchoImpresion > 0 && anchoEtiqueta + separacionAncho > 0
      ? redondearDecimalAEntero(anchoImpresion / (anchoEtiqueta + separacionAncho))
      : 0;
    const etiquetasLargo = largoMaterial > 0 && altoEtiqueta + separacionAvance > 0
      ? redondearDecimalAEntero(largoMaterial / (altoEtiqueta + separacionAvance))
      : 0;

    const cabidaMetro = etiquetasAncho > 0 && etiquetasLargo > 0 ? etiquetasAncho * etiquetasLargo : 0;
    const metrosNetos = cantidadNumero > 0 && cabidaMetro > 0 ? redondearDecimalAEntero(cantidadNumero / cabidaMetro) : 0;
    const metrosUsar = metrosNetos + metrosExcedente;
    const etiquetasQueSalen = cabidaMetro > 0 ? redondearDecimalAEntero(metrosUsar * cabidaMetro) : 0;

    return {
      etiquetasAncho,
      etiquetasLargo,
      cabidaMetro,
      metrosNetos,
      metrosExcedente,
      metrosUsar,
      etiquetasQueSalen,
    };
  }, [cabidaInputs, cantidad, metrosExcedenteManual]);

  const metrosParaCostos = useMemo(() => Number(cabidaCalculada.metrosUsar || 0), [cabidaCalculada.metrosUsar]);

  const materialTotal = useMemo(
    () => materialesIncluidos.reduce((sum, item) => sum + calcularValorItem(item, metrosParaCostos), 0),
    [materialesIncluidos, metrosParaCostos],
  );

  const procesoTotal = useMemo(
    () => procesosIncluidos.reduce((sum, item) => sum + calcularValorItem(item, metrosParaCostos), 0),
    [procesosIncluidos, metrosParaCostos],
  );

  const operativoTotal = useMemo(
    () => operativosIncluidos.reduce((sum, item) => sum + calcularValorItem(item, metrosParaCostos), 0),
    [operativosIncluidos, metrosParaCostos],
  );

  const subtotal = materialTotal + procesoTotal + operativoTotal;
  const margenCalculado = subtotal * (margenActivo / 100);
  const totalFinal = subtotal + margenCalculado;

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-600">Cargando cotizador digital...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold">Producción</p>
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Cotizador</h1>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.5fr_0.8fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Producto</label>
                <select
                  value={productoSeleccionado}
                  onChange={(e) => setProductoSeleccionado(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona un producto</option>
                  {tiposProducto.map((producto) => (
                    <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-[#f5f1d0] px-4 py-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Cálculo de cabida</h2>
            </div>

            <div className="p-4">
              <div className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-800">
                CÁLCULO DE CABIDA – MATERIAL 31.5 x 100 cm
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Ancho etiqueta (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cabidaInputs.anchoEtiqueta}
                    onChange={(e) => setCabidaInputs((prev) => ({ ...prev, anchoEtiqueta: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Alto etiqueta (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cabidaInputs.altoEtiqueta}
                    onChange={(e) => setCabidaInputs((prev) => ({ ...prev, altoEtiqueta: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Ancho impresión (cm) - fijo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cabidaInputs.anchoImpresion}
                    onChange={(e) => setCabidaInputs((prev) => ({ ...prev, anchoImpresion: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Largo del material (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cabidaInputs.largoMaterial}
                    onChange={(e) => setCabidaInputs((prev) => ({ ...prev, largoMaterial: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Separación a lo ancho entre etiquetas (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cabidaInputs.separacionAncho}
                    onChange={(e) => setCabidaInputs((prev) => ({ ...prev, separacionAncho: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Separación en el avance (cm)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cabidaInputs.separacionAvance}
                    onChange={(e) => setCabidaInputs((prev) => ({ ...prev, separacionAvance: e.target.value === '' ? '' : Number(e.target.value) }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-5 border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                <div className="grid grid-cols-2 text-sm font-semibold text-slate-700">
                  <div className="px-3 py-2 border-r border-slate-200 bg-slate-100">Etiquetas a lo ancho (en 31.5 cm)</div>
                  <div className="px-3 py-2">{cabidaCalculada.etiquetasAncho}</div>
                  <div className="px-3 py-2 border-r border-slate-200 bg-slate-100">Etiquetas a lo largo (en 100 cm)</div>
                  <div className="px-3 py-2">{cabidaCalculada.etiquetasLargo}</div>
                  <div className="px-3 py-2 border-r border-slate-200 bg-slate-100">Cabida x metro</div>
                  <div className="px-3 py-2 font-bold text-emerald-700">{cabidaCalculada.cabidaMetro}</div>
                  <div className="px-3 py-2 border-r border-slate-200 bg-slate-100">Metros netos (cantidad / cabida)</div>
                  <div className="px-3 py-2 font-bold text-slate-800">{cabidaCalculada.metrosNetos}</div>
                  <div className="px-3 py-2 border-r border-slate-200 bg-slate-100">Metros de excedente</div>
                  <div className="px-3 py-2 font-bold text-red-600">
                    <input
                      type="number"
                      step="0.01"
                      value={metrosExcedenteManual}
                      onChange={(e) => setMetrosExcedenteManual(e.target.value)}
                      className="w-full border border-red-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-red-600"
                    />
                  </div>
                  <div className="px-3 py-2 border-r border-slate-200 bg-slate-100">METROS A USAR (netos + excedente)</div>
                  <div className="px-3 py-2 font-bold text-slate-800">{cabidaCalculada.metrosUsar}</div>
                  <div className="px-3 py-2 border-r border-slate-200 bg-slate-100">Etiquetas que salen</div>
                  <div className="px-3 py-2 font-bold text-slate-800">{cabidaCalculada.etiquetasQueSalen}</div>
                </div>
              </div>
            </div>
          </div>

          {!productoSeleccionado ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              Selecciona un producto para ver los materiales, procesos y costos aplicables.
            </div>
          ) : (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h2 className="font-bold text-slate-800">Costos de papel e impresión</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-3 py-3 font-semibold text-slate-700 w-12">
                          <span className="sr-only">Incluir</span>
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Material</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Cobro</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Cantidad</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialesDelProducto.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                            No hay materiales relacionados a este producto.
                          </td>
                        </tr>
                      ) : (
                        materialesDelProducto.map((item) => (
                          <tr key={item.id} className="border-t border-slate-200">
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selecciones.materiales[item.id] !== false}
                                onChange={() => toggleSeleccion('materiales', item.id)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-800">{item.nombre}</td>
                            <td className="px-4 py-3 text-slate-700">{getTipoCobroLabel(item.tipo_cobro)}</td>
                            <td className="px-4 py-3 text-slate-700">{item.unidad}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metrosParaCostos))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h2 className="font-bold text-slate-800">Procesos y acabados</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-3 py-3 font-semibold text-slate-700 w-12">
                          <span className="sr-only">Incluir</span>
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Proceso</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Cobro</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Precio</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {procesosDelProducto.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                            No hay procesos relacionados a este producto.
                          </td>
                        </tr>
                      ) : (
                        procesosDelProducto.map((item) => (
                          <tr key={item.id} className="border-t border-slate-200">
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selecciones.procesos[item.id] !== false}
                                onChange={() => toggleSeleccion('procesos', item.id)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-800">{item.nombre}</td>
                            <td className="px-4 py-3 text-slate-700">{getTipoCobroLabel(item.tipo_cobro)}</td>
                            <td className="px-4 py-3 text-slate-700">{formatMoney(item.precio)}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metrosParaCostos))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                  <h2 className="font-bold text-slate-800">Costos operativos y fijos</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left">
                      <tr>
                        <th className="px-3 py-3 font-semibold text-slate-700 w-12">
                          <span className="sr-only">Incluir</span>
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Concepto</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Cobro</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Costo</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operativosDelProducto.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                            No hay costos operativos relacionados a este producto.
                          </td>
                        </tr>
                      ) : (
                        operativosDelProducto.map((item) => (
                          <tr key={item.id} className="border-t border-slate-200">
                            <td className="px-3 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={selecciones.operativos[item.id] !== false}
                                onChange={() => toggleSeleccion('operativos', item.id)}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-slate-800">{item.concepto}</td>
                            <td className="px-4 py-3 text-slate-700">{getTipoCobroLabel(item.tipo_cobro)}</td>
                            <td className="px-4 py-3 text-slate-700">{formatMoney(item.costo_fijo)}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metrosParaCostos))}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="bg-slate-900 text-white rounded-2xl shadow-lg p-5 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4">Resumen</h2>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-emerald-500/30 bg-slate-800 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Producto</div>
              <div className="mt-1 font-semibold text-white">{tiposProducto.find((item) => Number(item.id) === productoIdSeleccionado)?.nombre || 'Sin producto'}</div>
              <div className="text-slate-300">{cantidad} unidades · {cabidaCalculada.metrosUsar.toFixed(2)} m</div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Materiales</span>
              <span>{formatMoney(materialTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Impresión / Acabados</span>
              <span>{formatMoney(procesoTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Costos operativos</span>
              <span>{formatMoney(operativoTotal)}</span>
            </div>
            <div className="border-t border-slate-700 my-3" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Margen {margenActivo}%</span>
              <span>{formatMoney(margenCalculado)}</span>
            </div>
            <div className="bg-emerald-500 text-emerald-950 rounded-xl p-3 mt-4">
              <div className="text-xs uppercase tracking-wide font-semibold">Total estimado</div>
              <div className="text-2xl font-black mt-1">{formatMoney(totalFinal)}</div>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-400">
            <div className="font-semibold text-slate-200 mb-2">Nota</div>
            Este cotizador usa solo los materiales, procesos y costos operativos asociados al producto seleccionado.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CotizadorDigital;
