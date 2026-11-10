import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerMaterialesDigitales,
  obtenerProcesosDigitales,
  obtenerCostosOperativosDigitales,
  obtenerConfiguracionComercialDigital,
  obtenerTiposProductoDigitales,
} from '../../services/digitalCostosService';

const MARGEN_MINIMO = 30;

const roundNumber = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor;
};

const formatMoney = (value, decimals = 2) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value || 0));

const toNumber = (value) => Number(value || 0);

const bloquearScrollNumero = (event) => {
  if (event?.target?.type === 'number') {
    event.preventDefault();
  }
};

const validarMargenBase = (valor) => {
  const numero = Number(valor ?? 0);
  if (Number.isFinite(numero) && numero < MARGEN_MINIMO) {
    return false;
  }
  return true;
};

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
  return Math.floor(numero);
};

const CotizadorDigital = ({ isModal = false, onApply = null, onClose = null }) => {
  const navigate = useNavigate();
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
  const [diasCredito, setDiasCredito] = useState(0);
  const [margenSeleccionadoId, setMargenSeleccionadoId] = useState(null);
  const [margenPreview, setMargenPreview] = useState(30);
  const [plazoOverrides, setPlazoOverrides] = useState({});
  const [warningModal, setWarningModal] = useState({ isOpen: false, message: '' });
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
        const margenesOrdenados = [...((configData?.margenes || []) || [])].sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre || '').localeCompare(String(b.nombre || '')));
        const plazosOrdenados = [...((configData?.plazos || []) || [])].sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || Number(a.dias || 0) - Number(b.dias || 0));
        const margenPorDefecto = margenesOrdenados.find((item) => item.activo) || margenesOrdenados[0];
        const plazoPorDefecto = { dias: 0, nombre: 'Contado', recargo_porcentaje: 0 };

        const margenBase = margenesOrdenados.length ? margenesOrdenados : [{ id: 'default-margen', nombre: 'Margen base', porcentaje: 30, activo: true, orden: 1 }];
        const plazosBase = plazosOrdenados.length ? plazosOrdenados : [{ id: 'contado', nombre: 'Contado', dias: 0, recargo_porcentaje: 0, activo: true, orden: 0 }];

        setConfiguracion({ margenes: margenBase, plazos: plazosBase });
        if (margenPorDefecto) {
          setMargenSeleccionadoId(Number(margenPorDefecto.id));
          setMargenPreview(Number(margenPorDefecto.porcentaje ?? 30));
        } else {
          setMargenPreview(30);
        }

        const overridesIniciales = Object.fromEntries(
          plazosBase.map((item) => [String(item.id), Number(item.recargo_porcentaje ?? 0)])
        );
        setPlazoOverrides(overridesIniciales);
        setDiasCredito(Number(plazoPorDefecto?.dias ?? 0));

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

  const margenesDisponibles = useMemo(
    () => [...(configuracion?.margenes || [])].sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || String(a.nombre || '').localeCompare(String(b.nombre || ''))),
    [configuracion],
  );

  const margenSeleccionado = useMemo(() => {
    if (!margenesDisponibles.length) {
      return { id: 'default-margen', nombre: 'Margen base', porcentaje: 30, activo: true, orden: 1 };
    }
    return margenesDisponibles.find((item) => Number(item.id) === Number(margenSeleccionadoId)) || margenesDisponibles.find((item) => item.activo) || margenesDisponibles[0];
  }, [margenesDisponibles, margenSeleccionadoId]);

  useEffect(() => {
    if (margenSeleccionado) {
      setMargenPreview(Number(margenSeleccionado.porcentaje ?? 30));
    }
  }, [margenSeleccionado]);

  const margenActivo = useMemo(() => Number(margenPreview ?? margenSeleccionado?.porcentaje ?? 30), [margenPreview, margenSeleccionado]);

  const productoIdSeleccionado = Number(productoSeleccionado || 0);
  const cantidadNumero = Number(cantidad || 0);

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
        const nombre = String(item?.nombre || item?.concepto || '');
        const esArranque = /arranque/i.test(nombre);
        if (next.materiales[item.id] === undefined) next.materiales[item.id] = esArranque;
      });
      procesosDelProducto.forEach((item) => {
        const nombre = String(item?.nombre || item?.concepto || '');
        const esArranque = /arranque/i.test(nombre);
        if (next.procesos[item.id] === undefined) next.procesos[item.id] = esArranque;
      });
      operativosDelProducto.forEach((item) => {
        const nombre = String(item?.nombre || item?.concepto || '');
        const esArranque = /arranque/i.test(nombre);
        if (next.operativos[item.id] === undefined) next.operativos[item.id] = esArranque;
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
  const subtotalConMargen = subtotal + margenCalculado;

  const creditTerms = useMemo(() => {
    const terms = (configuracion?.plazos || [])
      .filter((item) => item.activo !== false)
      .sort((a, b) => Number(a.dias || 0) - Number(b.dias || 0));

    return [
      { id: 'contado', dias: 0, nombre: 'Contado', recargo_porcentaje: 0 },
      ...terms.map((item) => ({ ...item, id: item.id ?? `plazo-${item.dias}` })),
    ];
  }, [configuracion]);

  const plazoSeleccionado = useMemo(() => {
    const selected = creditTerms.find((term) => Number(term.dias) === Number(diasCredito));
    if (selected) return selected;

    return { id: 'contado', dias: Number(diasCredito || 0), nombre: Number(diasCredito || 0) === 0 ? 'Contado' : `${Number(diasCredito || 0)} días`, recargo_porcentaje: 0 };
  }, [creditTerms, diasCredito]);

  const recargoCredito = useMemo(() => {
    const base = plazoSeleccionado?.recargo_porcentaje ?? 0;
    const preview = plazoOverrides[String(plazoSeleccionado?.id ?? 'contado')];
    return Number(preview ?? base ?? 0);
  }, [plazoOverrides, plazoSeleccionado]);

  const precioTotalConCredito = roundNumber(subtotalConMargen * (1 + recargoCredito / 100), 2);
  const valorUnitarioConCredito = cantidadNumero > 0 ? roundNumber(precioTotalConCredito / cantidadNumero, 4) : 0;
  const totalFinal = precioTotalConCredito;

  const opcionesPago = useMemo(() => {
    const base = [{
      id: 'contado',
      nombre: 'Contado',
      dias: 0,
      recargo_porcentaje: Number(plazoOverrides.contado ?? 0),
      total: subtotalConMargen,
    }];
    const rows = creditTerms.filter((term) => Number(term.dias) !== 0).map((term) => {
      const recargo = Number(plazoOverrides[String(term.id)] ?? term.recargo_porcentaje ?? 0);
      return {
        ...term,
        recargo_porcentaje: recargo,
        total: subtotalConMargen * (1 + recargo / 100),
      };
    });

    return [...base, ...rows];
  }, [creditTerms, plazoOverrides, subtotalConMargen]);

  const actualizarMargenLocal = (margenId, porcentaje) => {
    const valor = Number(porcentaje || 0);
    if (Number.isFinite(valor) && valor < MARGEN_MINIMO) {
      setWarningModal({ isOpen: true, message: 'El margen base establecido es de 30%. No se permite un valor menor.' });
      return;
    }
    setMargenPreview(valor);
    setMargenSeleccionadoId(Number(margenId));
  };

  const actualizarPlazoLocal = (plazoId, recargo) => {
    const valor = Number(recargo || 0);
    setPlazoOverrides((prev) => ({
      ...prev,
      [String(plazoId)]: valor,
    }));
  };

  const handleApplyCotizador = () => {
    const cantidadAplicar = Number(cantidad || 0);
    const cantidadFinal = cantidadAplicar > 0 ? cantidadAplicar : 1;
    const valorUnitarioAplicado = roundNumber(valorUnitarioConCredito || 0, 4);
    const totalAplicado = roundNumber(cantidadFinal * valorUnitarioAplicado, 2);

    if (typeof onApply === 'function') {
      onApply({
        cantidad: cantidadFinal,
        valor_unitario: valorUnitarioAplicado,
        valor_total: totalAplicado,
      });
      return;
    }

    const productoNombre = tiposProducto.find((item) => Number(item.id) === productoIdSeleccionado)?.nombre || 'Cotizador digital';
    navigate('/cotizaciones/crear', {
      state: {
        cotizadorData: {
          cantidad: cantidadFinal,
          valor_unitario: valorUnitarioAplicado,
          valor_total: totalAplicado,
          detalle: `Cotizador digital - ${productoNombre}`,
          tipo: 'Cotizador digital',
        },
      },
    });
  };

  const renderCotizadorContent = () => (
    <>
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
                  onWheel={bloquearScrollNumero}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Margen y pagos</label>
                  <span className="text-xs text-slate-500">Datos DB</span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-amber-700 font-semibold mb-2">Márgenes</div>
                    <div className="space-y-2">
                      {margenesDisponibles.map((margen) => (
                        <div
                          key={margen.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-2.5 py-2 ${
                            Number(margenSeleccionado?.id) === Number(margen.id)
                              ? 'border-emerald-500 bg-white'
                              : 'border-amber-200 bg-white/70'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setMargenSeleccionadoId(Number(margen.id))}
                            className="text-left flex-1 text-sm font-medium text-slate-700"
                          >
                            {margen.nombre || 'Margen'}
                          </button>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={Number(Number(margenSeleccionado?.id) === Number(margen.id) ? (margenPreview ?? margen.porcentaje ?? 0) : (margen.porcentaje ?? 0))}
                              onChange={(e) => {
                                const nextValue = e.target.value;
                                actualizarMargenLocal(margen.id, nextValue);
                              }}
                              onWheel={bloquearScrollNumero}
                              className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-xs text-slate-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs uppercase tracking-wide text-slate-600 font-semibold mb-2">Pagos</div>
                    <div className="space-y-2">
                      {opcionesPago.map((opcion) => (
                        <div
                          key={opcion.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-2.5 py-2 ${
                            Number(diasCredito) === Number(opcion.dias)
                              ? 'border-emerald-500 bg-white'
                              : 'border-slate-200 bg-white/70'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setDiasCredito(Number(opcion.dias))}
                            className="text-left flex-1 min-w-0"
                          >
                            <div className="text-sm font-semibold text-slate-700">{opcion.nombre}</div>
                            <div className="text-[11px] text-slate-500">{formatMoney(opcion.total)}</div>
                          </button>
                          {Number(opcion.dias) !== 0 && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={Number(plazoOverrides[String(opcion.id)] ?? opcion.recargo_porcentaje ?? 0)}
                                onChange={(e) => {
                                  const nextValue = e.target.value;
                                  const target = creditTerms.find((item) => String(item.id) === String(opcion.id) || (Number(item.dias) === Number(opcion.dias) && Number(item.dias) !== 0));
                                  if (!target) return;
                                  actualizarPlazoLocal(target.id, nextValue);
                                }}
                                onWheel={bloquearScrollNumero}
                                className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-slate-500">%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
                    onWheel={bloquearScrollNumero}
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
                    onWheel={bloquearScrollNumero}
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
                    onWheel={bloquearScrollNumero}
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
                    onWheel={bloquearScrollNumero}
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
                    onWheel={bloquearScrollNumero}
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
                    onWheel={bloquearScrollNumero}
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
                      onWheel={bloquearScrollNumero}
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
                        <th className="px-4 py-3 font-semibold text-slate-700">Precio</th>
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
                            <td className="px-4 py-3 text-slate-700">{formatMoney(item.costo_unitario ?? item.precio ?? 0)}</td>
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
            <div className="flex justify-between text-slate-300">
              <span>{plazoSeleccionado.nombre}</span>
              <span>{formatMoney(precioTotalConCredito)}</span>
            </div>
            {recargoCredito > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Recargo {recargoCredito}%</span>
                <span>{formatMoney(subtotalConMargen * (recargoCredito / 100))}</span>
              </div>
            )}
            <div className="rounded-xl border border-emerald-500/30 bg-slate-800 p-3 mt-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Precio final</div>
              <div className="text-2xl font-black mt-1 text-white">{formatMoney(totalFinal, 2)}</div>
            </div>
            <div className="rounded-xl border border-sky-500/30 bg-slate-800 p-3 mt-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-sky-300">Valor unitario</div>
              <div className="text-2xl font-black mt-1 text-white">{formatMoney(valorUnitarioConCredito, 4)}</div>
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-700 pt-3">
              {opcionesPago.map((opcion) => (
                <div key={opcion.id} className="flex items-center justify-between text-xs gap-3">
                  <span className="text-slate-300">{opcion.nombre}</span>
                  <span className={`${Number(diasCredito) === Number(opcion.dias) ? 'text-emerald-300 font-semibold' : 'text-slate-200'}`}>
                    {formatMoney(opcion.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-400">
            <div className="font-semibold text-slate-200 mb-2">Nota</div>
            Este cotizador usa solo los materiales, procesos y costos operativos asociados al producto seleccionado.
          </div>

          {!isModal && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleApplyCotizador}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                Aplicar a la cotización
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );

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

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-700">Cotizador</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleApplyCotizador}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Aplicar a la cotización
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(95vh-74px)] p-4 sm:p-6">
            {renderCotizadorContent()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {warningModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-amber-100 text-amber-700 rounded-full p-2">
                <span className="text-lg font-bold">!</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Advertencia</h3>
                <p className="text-sm text-gray-600 mt-2">{warningModal.message}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setWarningModal({ isOpen: false, message: '' })}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
      {renderCotizadorContent()}
    </div>
  );
  };

export default CotizadorDigital;
