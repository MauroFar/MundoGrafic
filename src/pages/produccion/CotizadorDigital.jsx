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

  const materialTotal = useMemo(
    () => materiales.reduce((sum, item) => sum + calcularValorItem(item, metros), 0),
    [materiales, metros],
  );

  const procesoTotal = useMemo(
    () => procesos.reduce((sum, item) => sum + calcularValorItem(item, metros), 0),
    [procesos, metros],
  );

  const operativoTotal = useMemo(
    () => operativos.reduce((sum, item) => sum + calcularValorItem(item, metros), 0),
    [operativos, metros],
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
          <h1 className="text-3xl font-bold text-slate-800 mt-1">Cotizador Digital</h1>
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
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metros))}</td>
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
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metros))}</td>
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
                        <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(calcularValorItem(item, metros))}</td>
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
