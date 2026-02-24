import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Logo from '../../components/Logo';

const CertificadoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const esVista = !!id && id !== 'crear' && id !== 'nuevo';

  const generateNumero = () => {
    const d = new Date();
    return `CERT-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const [form, setForm] = useState<any>({
    numero_certificado: esVista ? '' : generateNumero(),
    fecha_elaboracion: new Date().toISOString().slice(0,10),
    fecha_caducidad: '',
      fecha_creacion: esVista ? '' : new Date().toISOString().slice(0,10),
    cliente: '',
    referencia: '',
    material: '',
    descripcion: '',
    cantidad: '',
    codigo: '',
    lote: '',
    orden_compra: '',
    inspeccionado_por: '',
    observaciones: '',
    caracteristicas: [
      { name: 'LARGO (mm)', minimo: '', nominal: '', maximo: '' },
      { name: 'ANCHO (mm)', minimo: '', nominal: '', maximo: '' },
      { name: 'ALTO (mm)', minimo: '', nominal: '', maximo: '' },
      { name: 'ESPESOR (Micras)', minimo: '', nominal: '', maximo: '' }
    ]
  });

  const actualizar = (campo: string, valor: any) => setForm((f:any) => ({ ...f, [campo]: valor }));
  const actualizarCaracteristica = (index: number, campo: string, valor: any) => {
    setForm((f:any) => {
      const c = Array.isArray(f.caracteristicas) ? [...f.caracteristicas] : [];
      c[index] = { ...c[index], [campo]: valor };
      return { ...f, caracteristicas: c };
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20"><Logo/></div>
              <div>
                <h1 className="text-xl font-bold">{esVista ? 'Ver Certificado' : 'Crear Certificado de Análisis de Calidad'}</h1>
                <div className="text-sm text-gray-600">Certificado N.: <span className="font-medium">{form.numero_certificado}</span></div>
              </div>
            </div>
            <div>
              <button className="px-4 py-2 bg-gray-400 text-white rounded mr-2" onClick={() => navigate('/certificados')}>Volver</button>
              {!esVista && <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={() => {/* guardar luego */}}>Guardar</button>}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="w-2/3 border-r pr-6">
              <div className="text-sm text-gray-700 mb-2">CERTIFICADO DE ANALISIS DE CALIDAD</div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">FECHA CREACIÓN (certificado):</label>
                    <input type="date" className="w-full border rounded px-2 py-1 bg-gray-50" value={form.fecha_creacion} readOnly />
                  </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">FECHA DE ELABORACIÓN:</label>
                  <input type="date" className="w-full border rounded px-2 py-1" value={form.fecha_elaboracion} onChange={(e) => actualizar('fecha_elaboracion', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">Certificado N.:</label>
                  <input className="w-full border rounded px-2 py-1 bg-gray-50" value={form.numero_certificado} readOnly />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">CLIENTE:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.cliente} onChange={(e) => actualizar('cliente', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">FECHA DE CADUCIDAD:</label>
                  <input type="date" className="w-full border rounded px-2 py-1" value={form.fecha_caducidad} onChange={(e) => actualizar('fecha_caducidad', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">REFERENCIA:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.referencia} onChange={(e) => actualizar('referencia', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">MATERIAL:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.material} onChange={(e) => actualizar('material', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600">DESCRIPCION:</label>
                  <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.descripcion} onChange={(e) => actualizar('descripcion', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600">CANTIDAD:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.cantidad} onChange={(e) => actualizar('cantidad', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">CODIGO:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.codigo} onChange={(e) => actualizar('codigo', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600">LOTE:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.lote} onChange={(e) => actualizar('lote', e.target.value)} />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600">ORDEN DE COMPRA:</label>
                <input className="w-full border rounded px-2 py-1" value={form.orden_compra} onChange={(e) => actualizar('orden_compra', e.target.value)} />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600">OBSERVACIONES:</label>
                <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.observaciones} onChange={(e) => actualizar('observaciones', e.target.value)} />
              </div>

            </div>

            <div className="w-1/3 pl-6">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm font-semibold mb-2">CARACTERISTICAS CUANTITATIVAS</div>
                <table className="w-full text-xs border">
                  <thead>
                    <tr>
                      <th className="border px-1">CARACTERISTICAS</th>
                      <th className="border px-1">Mínimo</th>
                      <th className="border px-1">Nominal</th>
                      <th className="border px-1">Máximo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.caracteristicas.map((row:any, idx:number) => (
                      <tr key={idx} className="text-xs">
                        <td className="border px-1 py-1">{row.name}</td>
                        <td className="border px-1 text-center"><input value={row.minimo} onChange={(e) => actualizarCaracteristica(idx, 'minimo', e.target.value)} className="w-full text-center text-xs px-1 py-1" /></td>
                        <td className="border px-1 text-center"><input value={row.nominal} onChange={(e) => actualizarCaracteristica(idx, 'nominal', e.target.value)} className="w-full text-center text-xs px-1 py-1" /></td>
                        <td className="border px-1 text-center"><input value={row.maximo} onChange={(e) => actualizarCaracteristica(idx, 'maximo', e.target.value)} className="w-full text-center text-xs px-1 py-1" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-600">INSPECCIONADO POR:</label>
                  <input className="w-full border rounded px-2 py-1" value={form.inspeccionado_por} onChange={(e) => actualizar('inspeccionado_por', e.target.value)} />
                </div>

                <div className="mt-6 text-xs text-gray-600">MUNDO GRAFIC certifica que el 100% del producto se encuentra revisado y aprobado por el control de calidad.</div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificadoForm;
