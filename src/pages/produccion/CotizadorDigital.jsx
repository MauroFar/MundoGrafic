import React, { useEffect, useMemo, useState } from 'react';
import {
  obtenerMaterialesDigitales,
  obtenerProcesosDigitales,
  obtenerCostosOperativosDigitales,
  obtenerConfiguracionComercialDigital,
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

const CotizadorDigital = () => {
  const [materiales, setMateriales] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [operativos, setOperativos] = useState([]);
  const [configuracion, setConfiguracion] = useState({ margenes: [], plazos: [] });
  const [cantidad, setCantidad] = useState(2000);
  const [metros, setMetros] = useState(2000);
  const [anchoEtiqueta, setAnchoEtiqueta] = useState(9.3);
  const [altoEtiqueta, setAltoEtiqueta] = useState(14.6);
  const [anchoImpresion, setAnchoImpresion] = useState(31.5);
  const [largoMaterial, setLargoMaterial] = useState(100);
  const [separacionAncho, setSeparacionAncho] = useState(0.3);
  const [separacionAvance, setSeparacionAvance] = useState(0.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [materialesData, procesosData, operativosData, configData] = await Promise.all([
          obtenerMaterialesDigitales(),
          obtenerProcesosDigitales(),
          obtenerCostosOperativosDigitales(),
          obtenerConfiguracionComercialDigital(),
        ]);

        setMateriales((materialesData || []).filter((item) => item.estado === 'Activo'));
        setProcesos((procesosData || []).filter((item) => item.estado === 'Activo'));
        setOperativos((operativosData || []).filter((item) => item.estado === 'Activo'));
        setConfiguracion(configData || { margenes: [], plazos: [] });
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

  const etiquetasAncho = useMemo(() => {
    const ancho = Number(anchoImpresion || 0);
    const etiqueta = Number(anchoEtiqueta || 0);
    const separacion = Number(separacionAncho || 0);
    if (!ancho || !etiqueta) return 0;
    return Math.max(Math.floor((ancho + separacion) / (etiqueta + separacion)), 0);
  }, [anchoImpresion, anchoEtiqueta, separacionAncho]);

  const etiquetasLargo = useMemo(() => {
    const largo = Number(largoMaterial || 0);
    const alto = Number(altoEtiqueta || 0);
    const separacion = Number(separacionAvance || 0);
    if (!largo || !alto) return 0;
    return Math.max(Math.floor((largo + separacion) / (alto + separacion)), 0);
  }, [largoMaterial, altoEtiqueta, separacionAvance]);

  const cabidaPorMetro = useMemo(
    () => Math.max(etiquetasAncho * etiquetasLargo, 0),
    [etiquetasAncho, etiquetasLargo],
  );

  const metrosNetos = useMemo(
    () => (cabidaPorMetro > 0 ? Math.floor(Number(cantidad || 0) / cabidaPorMetro) : 0),
    [cabidaPorMetro, cantidad],
  );

  const metrosExcedente = useMemo(() => {
    const cant = Number(cantidad || 0);
    return cabidaPorMetro > 0 ? Math.max(Math.ceil((cant - metrosNetos * cabidaPorMetro) / cabidaPorMetro) * cabidaPorMetro, 0) : 0;
  }, [cabidaPorMetro, cantidad, metrosNetos]);

  const metrosFacturacion = useMemo(
    () => Math.max(Number(metros || 0), metrosNetos + metrosExcedente),
    [metros, metrosNetos, metrosExcedente],
  );

  const materialTotal = useMemo(
    () => materiales.reduce((sum, item) => sum + calcularValorItem(item, metrosFacturacion), 0),
    [materiales, metrosFacturacion],
  );

  const procesoTotal = useMemo(
    () => procesos.reduce((sum, item) => sum + calcularValorItem(item, metrosFacturacion), 0),
    [procesos, metrosFacturacion],
  );

  const operativoTotal = useMemo(
    () => operativos.reduce((sum, item) => sum + calcularValorItem(item, metrosFacturacion), 0),
    [operativos, metrosFacturacion],
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
        <div className="bg-emerald-600 text-white rounded-xl px-4 py-2 shadow-sm text-sm font-semibold">
          Cotización en tiempo real
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.5fr_0.8fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Metros</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={metros}
                  onChange={(e) => setMetros(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ancho etiqueta (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={anchoEtiqueta}
                  onChange={(e) => setAnchoEtiqueta(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alto etiqueta (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={altoEtiqueta}
                  onChange={(e) => setAltoEtiqueta(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ancho de impresión (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={anchoImpresion}
                  onChange={(e) => setAnchoImpresion(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Largo del material (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={largoMaterial}
                  onChange={(e) => setLargoMaterial(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Separación a lo ancho (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={separacionAncho}
                  onChange={(e) => setSeparacionAncho(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Separación en el avance (cm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={separacionAvance}
                  onChange={(e) => setSeparacionAvance(Number(e.target.value || 0))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-yellow-300 text-black font-black px-4 py-3 text-left uppercase tracking-wide">
                CÁLCULO DE CÁBIDA - MATERIAL {Number(anchoImpresion || 0).toFixed(1)} x {Number(largoMaterial || 0).toFixed(1)} cm
              </div>
              <table className="w-full text-sm text-slate-700">
                <tbody>
                  {[
                    ['Ancho etiqueta (cm)', anchoEtiqueta],
                    ['Alto etiqueta (cm)', altoEtiqueta],
                    ['Ancho de impresión (cm) - fijo', anchoImpresion],
                    ['Largo del material (cm)', largoMaterial],
                    ['Separación a lo ancho entre etiquetas (cm)', separacionAncho],
                    ['Separación en el avance (cm)', separacionAvance],
                    ['Etiquetas a lo ancho', etiquetasAncho],
                    ['Etiquetas a lo largo', etiquetasLargo],
                    ['Cabida x metro', cabidaPorMetro],
                    ['Metros netos (cantidad ÷ cabida)', metrosNetos],
                    ['Metros excedente', metrosExcedente],
                    ['METROS A USAR (netos + excedente)', metrosNetos + metrosExcedente],
                    ['Etiquetas que salen', cantidad],
                  ].map(([label, value], index) => (
                    <tr key={label} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border border-slate-200 px-3 py-2 font-medium text-slate-700">{label}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right font-semibold text-slate-900">{Number(value || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Costos de papel e impresión</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">Material</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Cobro</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Cantidad</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {materiales.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                        No hay materiales activos en la base de datos.
                      </td>
                    </tr>
                  ) : (
                    materiales.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-slate-800">{item.nombre}</td>
                        <td className="px-4 py-3 text-slate-700">{getTipoCobroLabel(item.tipo_cobro)}</td>
                        <td className="px-4 py-3 text-slate-700">{item.unidad}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metrosFacturacion))}</td>
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
                    <th className="px-4 py-3 font-semibold text-slate-700">Proceso</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Cobro</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Precio</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {procesos.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                        No hay procesos activos registrados.
                      </td>
                    </tr>
                  ) : (
                    procesos.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-slate-800">{item.nombre}</td>
                        <td className="px-4 py-3 text-slate-700">{getTipoCobroLabel(item.tipo_cobro)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(item.precio)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metrosFacturacion))}</td>
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
                    <th className="px-4 py-3 font-semibold text-slate-700">Concepto</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Cobro</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Costo</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {operativos.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                        No hay costos operativos activos.
                      </td>
                    </tr>
                  ) : (
                    operativos.map((item) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-slate-800">{item.concepto}</td>
                        <td className="px-4 py-3 text-slate-700">{getTipoCobroLabel(item.tipo_cobro)}</td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(item.costo_fijo)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metrosFacturacion))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="bg-slate-900 text-white rounded-2xl shadow-lg p-5 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-4">Resumen</h2>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-emerald-500/30 bg-slate-800 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Cabida</div>
              <div className="mt-1 font-semibold text-white">{Number(anchoEtiqueta || 0).toFixed(2)} cm × {Number(altoEtiqueta || 0).toFixed(2)} cm</div>
              <div className="text-slate-300">{cabidaPorMetro} uds/m · {Number(metrosNetos + metrosExcedente || 0).toFixed(2)} m</div>
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
            Este cotizador usa los parámetros activos de materiales, procesos y costos operativos configurados en producción digital.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CotizadorDigital;
