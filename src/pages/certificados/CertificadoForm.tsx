import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../../components/Logo';
import { FaTimes, FaFileAlt } from 'react-icons/fa';

const CertificadoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const esVista = !!id && id !== 'crear' && id !== 'nuevo';

  const [form, setForm] = useState<any>({
    numero_certificado: esVista ? '' : null,
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

  const [saving, setSaving] = useState(false);
  const [fechaCaducidadManual, setFechaCaducidadManual] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  useEffect(() => {
    // Si es vista, cargar datos desde API
    const cargar = async () => {
      if (!esVista) return;
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/certificados/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('No se pudo cargar certificado');
        const data = await res.json();
        // Mapear a form
        setForm((f:any) => ({
          ...f,
            numero_certificado: data.numero_certificado,
          fecha_creacion: data.fecha_creacion ? data.fecha_creacion.slice(0,10) : f.fecha_creacion,
          fecha_elaboracion: data.fecha_elaboracion ? data.fecha_elaboracion.slice(0,10) : f.fecha_elaboracion,
          fecha_caducidad: data.fecha_caducidad ? data.fecha_caducidad.slice(0,10) : f.fecha_caducidad,
          cliente: data.cliente_nombre || f.cliente,
          referencia: data.referencia || data.producto_cod_mg || f.referencia,
          material: data.material || data.producto_descripcion || f.material,
          descripcion: data.descripcion || f.descripcion,
          cantidad: data.cantidad || f.cantidad,
          codigo: data.codigo || data.codigo_producto || f.codigo,
          lote: data.lote || f.lote,
          orden_compra: data.orden_compra || f.orden_compra,
          inspeccionado_por: data.inspeccionado_por || f.inspeccionado_por,
          observaciones: data.observaciones || f.observaciones,
          caracteristicas: (data.caracteristicas && data.caracteristicas.map((c:any) => ({ name: c.nombre, minimo: c.minimo, nominal: c.nominal, maximo: c.maximo, unidad: c.unidad }))) || f.caracteristicas
        }));

        // Si la API trajo fecha_caducidad, marcamos como editada por usuario (no sobreescribir luego)
        if (data.fecha_caducidad) setFechaCaducidadManual(true);
      } catch (err) {
        console.error(err);
        alert('Error cargando certificado');
      }
    };
    cargar();
  }, [id]);

  useEffect(() => {
    // Prefill desde location.state si venimos desde OrdenesVer
    const state: any = (location && (location as any).state) || {};
    if (state.orden) {
      const orden = state.orden;
      const producto = state.producto || {};
      setForm((f:any) => ({
        ...f,
        numero_certificado: f.numero_certificado || null,
        numero_orden: orden.numero_orden || orden.numero_orden || '',
        orden_trabajo_id: orden.id || orden.id || null,
        cliente: orden.nombre_cliente || f.cliente,
        referencia: producto.producto || producto.descripcion || f.referencia,
        material: (orden.detalle && (orden.detalle.material || orden.detalle.proveedor_material)) || producto.material || f.material,
        descripcion: '',
        cantidad: producto.cantidad || f.cantidad,
        codigo: producto.cod_cliente || f.codigo,
        lote: (orden.detalle && (orden.detalle.lote_produccion || orden.detalle.lote_produccion)) || producto.lote || f.lote,
        orden_compra: orden.orden_compra || f.orden_compra
      }));
    }
  }, [location]);

  const verPDF = async (certId: number) => {
    try {
      setPreviewUrl(null);
      setShowPreview(true);
      setPreviewLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${certId}/preview`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener la vista previa');
      const data = await res.json();
      if (!data.success || !data.pdf) throw new Error('Respuesta inválida al generar vista previa');
      setPreviewUrl(data.pdf);
    } catch (err: any) {
      console.error('Error en verPDF certificado:', err);
      toast.error(err.message || 'Error al cargar el PDF');
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const descargarPDF = async (certId: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${certId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener el PDF');
      const blob = await res.blob();
      if (blob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado_${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch (e) {} }, 10000);
      toast.success('✅ PDF descargado exitosamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al descargar el PDF');
    }
  };

  const imprimirPDF = async (certId: number) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/certificados/${certId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener el PDF');
      const blob = await res.blob();
      if (blob.type !== 'application/pdf') throw new Error('El archivo recibido no es un PDF válido');
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => { printWindow.print(); };
      } else {
        toast.error('No se pudo abrir la ventana de impresión. Permite ventanas emergentes.');
      }
      setTimeout(() => { try { window.URL.revokeObjectURL(url); } catch (e) {} }, 10000);
    } catch (err: any) {
      toast.error(err.message || 'Error al imprimir el PDF');
    }
  };

  const cerrarPreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      try { window.URL.revokeObjectURL(previewUrl); } catch (e) {}
    }
    setPreviewUrl(null);
  };

  // Helper: sumar 1 año en formato YYYY-MM-DD
  const addOneYear = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setFullYear(d.getFullYear() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Si la fecha de elaboración cambia y el usuario no editó la fecha de caducidad, auto-asignar +1 año
  useEffect(() => {
    const fechElab = form.fecha_elaboracion;
    if (!fechElab) return;
    if (!fechaCaducidadManual) {
      const nueva = addOneYear(fechElab);
      setForm((f:any) => ({ ...f, fecha_caducidad: nueva }));
    }
  }, [form.fecha_elaboracion, fechaCaducidadManual]);

  const guardarCertificado = async () => {
    setSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');

      const payload: any = {
        numero_certificado: form.numero_certificado || null,
        orden_trabajo_id: form.orden_trabajo_id || null,
        numero_orden: form.numero_orden || null,
        cliente_nombre: form.cliente || null,
        producto_cod_mg: form.referencia || null,
        producto_cod_cliente: form.codigo || null,
        producto_descripcion: form.descripcion || null,
        // Enviamos cantidad tal cual (texto) para permitir valores como "500 unidades"
        cantidad: form.cantidad || null,
        codigo_producto: form.codigo || null,
        lote: form.lote || null,
        orden_compra: form.orden_compra || null,
        fecha_elaboracion: form.fecha_elaboracion || null,
        fecha_caducidad: form.fecha_caducidad || null,
        inspeccionado_por: form.inspeccionado_por || null,
        observaciones: form.observaciones || null,
        caracteristicas: Array.isArray(form.caracteristicas) ? form.caracteristicas.map((c:any, idx:number) => ({
          nombre: c.name || c.nombre || `c${idx+1}`,
          minimo: c.minimo || null,
          nominal: c.nominal || null,
          maximo: c.maximo || null,
          unidad: c.unidad || null,
          orden: idx
        })) : []
      };

      const res = await fetch(`${apiUrl}/api/certificados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar certificado');
      }

      const data = await res.json();
      // Mostrar confirmación y redirigir al listado de certificados
      toast.success(`Certificado ${data.numero_certificado || ''} guardado correctamente`);
      navigate('/certificados');
    } catch (error: any) {
      alert(error.message || 'Error al guardar certificado');
      setSaving(false);
    }
  };

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
              {!esVista && (
                <button
                  className={`px-4 py-2 ${saving ? 'bg-gray-400' : 'bg-green-600'} text-white rounded`}
                  onClick={guardarCertificado}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              )}
              {esVista && (
                <>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded ml-2"
                    onClick={() => { if (id) verPDF(Number(id)); }}
                  >
                    Ver / Imprimir PDF
                  </button>

                  {showDetailModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
                      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-2xl font-bold mb-2">Vista previa PDF - CERTIFICADO</h2>
                              <div className="text-green-100 text-sm">Certificado N° {form.numero_certificado || '-'}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button onClick={() => setShowDetailModal(false)} className="text-white hover:bg-green-500 rounded-full p-2">
                                <FaTimes size={20} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Cliente</label>
                              <p className="text-gray-900 font-medium">{form.cliente || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Referencia</label>
                              <p className="text-gray-900 font-medium">{form.referencia || '-'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="text-sm text-gray-500 block mb-1">Material / Lote</label>
                              <p className="text-gray-900 font-medium">{(form.material || '-') + ' / ' + (form.lote || '-')}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600">Descripcion</label>
                            <div className="bg-white border rounded p-3">{form.descripcion || '-'}</div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <label className="text-sm text-gray-600 block mb-2 font-semibold">Creado por</label>
                              <p className="text-gray-900 font-medium mb-1">{form.created_by_nombre || 'Sistema'}</p>
                              <p className="text-xs text-gray-500">{form.created_at ? new Date(form.created_at).toLocaleString('es-EC') : '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <button className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2" onClick={() => { if (id) verPDF(Number(id)); }}><FaFileAlt/> Ver / Imprimir</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Preview Modal (embed PDF) */}
                  {showPreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-bold">Vista Previa del PDF</h2>
                          <button
                            onClick={() => cerrarPreview()}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          {previewLoading ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Generando vista previa...</p>
                              </div>
                            </div>
                          ) : (
                            previewUrl ? (
                              <embed src={previewUrl} type="application/pdf" className="w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">No hay PDF para mostrar.</div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
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
