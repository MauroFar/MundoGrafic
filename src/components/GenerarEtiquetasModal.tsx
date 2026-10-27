import React, { useMemo, useState } from 'react';
import { FaPrint, FaTag, FaTimes } from 'react-icons/fa';

interface OrdenEtiqueta {
  id?: number;
  numero_orden?: string;
  nombre_cliente?: string;
  concepto?: string;
  tipo_orden?: string;
  fecha_creacion?: string;
}

interface EtiquetaFormData {
  cliente: string;
  producto: string;
  tamano: string;
  oc: string;
  numeroCaja: string;
  cantidad: string;
  paquete1: string;
  paquete2: string;
  unidad1: string;
  unidad2: string;
  codigo: string;
  lote: string;
  fecha: string;
  lugarEntrega: string;
  ciudad: string;
}

interface GenerarEtiquetasModalProps {
  orden: OrdenEtiqueta | null;
  producto?: any;
  isOpen: boolean;
  onClose: () => void;
}

type EtiquetaTipo = 'general' | 'mini';

const formatDate = (value?: string) => {
  if (!value) return '';

  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return value;
  }
};

const getLocalDateValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
};

const defaultEtiquetaForm = (orden: OrdenEtiqueta | null, producto?: any): EtiquetaFormData => {
  const productName = producto?.producto || producto?.descripcion || producto?.nombre || '';
  const cantidad = producto?.cantidad ?? producto?.unidades ?? producto?.cantidad_total ?? '';
  const codigoCliente = producto?.cod_cliente || producto?.codigo_cliente || producto?.codigo || producto?.codigo_producto || '';
  const loteProduccion = producto?.lote_produccion || producto?.lote || (orden as any)?.detalle?.lote_produccion || '';
  const ordenCompra = (orden as any)?.orden_compra || '';
  const tamanoInicial = producto?.tamano || producto?.medidas || '';

  return {
    cliente: orden?.nombre_cliente || '',
    producto: productName,
    tamano: tamanoInicial,
    oc: ordenCompra,
    numeroCaja: '',
    cantidad: String(cantidad ?? ''),
    paquete1: '',
    paquete2: '',
    unidad1: '',
    unidad2: '',
    codigo: codigoCliente,
    lote: loteProduccion,
    fecha: getLocalDateValue(),
    lugarEntrega: '',
    ciudad: '',
  };
};

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const buildFormatoValue = (form: EtiquetaFormData) => {
  const paquete = [form.paquete1, form.paquete2].join('').trim();
  const unidad = [form.unidad1, form.unidad2].join('').trim();

  if (!paquete && !unidad) return '';
  if (!paquete) return unidad;
  if (!unidad) return paquete;
  return `${paquete} x ${unidad}`;
};

const GenerarEtiquetasModal: React.FC<GenerarEtiquetasModalProps> = ({ orden, producto, isOpen, onClose }) => {
  const [form, setForm] = useState<EtiquetaFormData>(() => defaultEtiquetaForm(orden, producto));
  const [generalChecked, setGeneralChecked] = useState<boolean>(true);
  const [miniChecked, setMiniChecked] = useState<boolean>(false);
  const [numeroEtiquetasGeneral, setNumeroEtiquetasGeneral] = useState<string>('1');
  const [numeroEtiquetasMini, setNumeroEtiquetasMini] = useState<string>('1');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setForm(defaultEtiquetaForm(orden, producto));
      setGeneralChecked(true);
      setMiniChecked(false);
      setNumeroEtiquetasGeneral('1');
      setNumeroEtiquetasMini('1');
      setShowPreview(false);
      setPreviewUrl(null);
      setPreviewLoading(false);
    }
  }, [orden, producto, isOpen]);

  const preview = useMemo(() => ({
    cliente: cleanText(form.cliente || ''),
    producto: cleanText(form.producto || ''),
    tamano: cleanText(form.tamano || ''),
    oc: cleanText(form.oc || ''),
    numeroCaja: cleanText(form.numeroCaja || ''),
    cantidad: cleanText(form.cantidad || ''),
    formato: cleanText(buildFormatoValue(form)),
    codigo: cleanText(form.codigo || ''),
    lote: cleanText(form.lote || ''),
    fecha: cleanText(form.fecha || formatDate(form.fecha || '')),
    lugarEntrega: cleanText(form.lugarEntrega || ''),
    ciudad: cleanText(form.ciudad || ''),
  }), [form]);

  const updateField = (field: keyof EtiquetaFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const getNumeroEtiquetasGeneralValido = () => {
    const parsed = Number(numeroEtiquetasGeneral);
    if (!generalChecked) return 0;
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.max(1, Math.floor(parsed));
  };

  const getNumeroEtiquetasMiniValido = () => {
    const parsed = Number(numeroEtiquetasMini);
    if (!miniChecked) return 0;
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.max(1, Math.floor(parsed));
  };

  const buildEtiquetaPdfDataUrl = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/$/, '');
    const response = await fetch(`${apiUrl}/api/ordenTrabajo/etiquetas/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        numero_orden: orden?.numero_orden || '',
        cliente: form.cliente,
        producto: form.producto,
        tamano: form.tamano,
        oc: form.oc,
        numeroCaja: form.numeroCaja,
        cantidad: form.cantidad,
        formato: buildFormatoValue(form),
        codigo: form.codigo,
        lote: form.lote,
        fecha: form.fecha,
        lugarEntrega: form.lugarEntrega,
        ciudad: form.ciudad,
        generalChecked,
        miniChecked,
        numeroEtiquetasGeneral: getNumeroEtiquetasGeneralValido(),
        numeroEtiquetasMini: getNumeroEtiquetasMiniValido(),
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error || 'Error al generar la etiqueta');
    }

    const data = await response.json();
    if (!data.success || !data.pdf) {
      throw new Error('Respuesta inválida al generar la etiqueta');
    }

    return data.pdf as string;
  };

  const handleOpenPreview = async () => {
    try {
      setPreviewLoading(true);
      setShowPreview(true);
      const pdfDataUrl = await buildEtiquetaPdfDataUrl();

      const base64 = pdfDataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (error) {
      console.error('Error al generar la vista previa de la etiqueta:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const previewEtiqueta = (
    <div className="w-full max-w-[340px] border border-black bg-white p-2 shadow-md print:shadow-none mx-auto">
      <div className="border border-gray-300 p-2 text-center">
<div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide border-b border-dashed border-gray-300 pb-1">
          <span className="font-black text-left">#{orden?.numero_orden || ''}</span>
          <span className="text-center flex-1 truncate px-1">{preview.cliente}</span>
          <span className="font-black text-right">MUNDOGRAFIC</span>
        </div>

        <div className="mt-2 text-center text-[16px] font-black uppercase leading-tight">
          {preview.producto}
        </div>

        {preview.tamano && (
          <div className="mt-2 text-center text-[13px] font-bold uppercase">
            {preview.tamano}
          </div>
        )}

        <div className="mt-3 space-y-2 text-left text-[12px] font-semibold">
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>OC:</span>
            <span>{preview.oc}</span>
          </div>
          {preview.numeroCaja && (
            <div className="text-center text-[11px] font-bold border-b border-dashed border-gray-200 pb-1">
              {preview.numeroCaja}
            </div>
          )}
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>CANTIDAD:</span>
            <span>{preview.cantidad}</span>
          </div>
          {preview.formato && (
            <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
              <span>FORMATO:</span>
              <span>{preview.formato}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>CÓDIGO:</span>
            <span>{preview.codigo}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>LOTE:</span>
            <span>{preview.lote}</span>
          </div>
          <div className="flex justify-between gap-4 pb-1">
            <span>FECHA:</span>
            <span>{preview.fecha}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>LUGAR ENTREGA:</span>
            <span>{preview.lugarEntrega}</span>
          </div>
          <div className="flex justify-between gap-4 pb-1">
            <span>CIUDAD:</span>
            <span>{preview.ciudad}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-2">
              <FaTag />
            </div>
            <div>
              <h2 className="text-xl font-bold">Generar etiquetas</h2>
              <p className="text-sm text-blue-100">Orden #{orden?.numero_orden || 'N/A'}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
          <div className="p-6 border-r border-gray-200 bg-gray-50">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Cliente
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.cliente}
                    onChange={(e) => updateField('cliente', e.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  O.C.
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.oc}
                    onChange={(e) => updateField('oc', e.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700">
                Número de caja
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  value={form.numeroCaja}
                  onChange={(e) => updateField('numeroCaja', e.target.value)}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Producto / descripción
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  value={form.producto}
                  onChange={(e) => updateField('producto', e.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Tamaño
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.tamano}
                    onChange={(e) => updateField('tamano', e.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Cantidad
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.cantidad}
                    onChange={(e) => updateField('cantidad', e.target.value)}
                  />
                </label>
              </div>

              <div className="rounded-md border border-gray-300 bg-white p-3">
                <div className="text-sm font-medium text-gray-700">Formato de paquete</div>
                <div className="mt-3 flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">Paquete</div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        value={form.paquete1}
                        onChange={(e) => updateField('paquete1', e.target.value)}
                        placeholder="5"
                      />
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        value={form.paquete2}
                        onChange={(e) => updateField('paquete2', e.target.value)}
                        placeholder="R"
                      />
                    </div>
                  </div>

                  <div className="pb-3 text-xl font-black leading-none text-gray-600">x</div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">Unidad</div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        value={form.unidad1}
                        onChange={(e) => updateField('unidad1', e.target.value)}
                        placeholder="1000"
                      />
                      <input
                        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        value={form.unidad2}
                        onChange={(e) => updateField('unidad2', e.target.value)}
                        placeholder=""
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Código
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.codigo}
                    onChange={(e) => updateField('codigo', e.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Lote
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.lote}
                    onChange={(e) => updateField('lote', e.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700">
                Fecha
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  value={form.fecha || getLocalDateValue()}
                  onChange={(e) => updateField('fecha', e.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm font-medium text-gray-700">
                  Lugar Entrega
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.lugarEntrega}
                    onChange={(e) => updateField('lugarEntrega', e.target.value)}
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Ciudad
                  <input
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form.ciudad}
                    onChange={(e) => updateField('ciudad', e.target.value)}
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Tipo de etiqueta</div>

                <div className="rounded-md border border-gray-300 bg-white p-3">
                  <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={generalChecked}
                        onChange={(e) => setGeneralChecked(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      <span>Etiqueta general 10 x 5,5 cm</span>
                    </span>
                  </label>

                  {generalChecked && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600">Número de etiquetas</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        value={numeroEtiquetasGeneral}
                        onChange={(e) => setNumeroEtiquetasGeneral(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-gray-300 bg-white p-3">
                  <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={miniChecked}
                        onChange={(e) => setMiniChecked(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      <span>Etiquetas 5,5 x 3 cm</span>
                    </span>
                  </label>

                  {miniChecked && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-600">Número de etiquetas</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        value={numeroEtiquetasMini}
                        onChange={(e) => setNumeroEtiquetasMini(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                onClick={handleOpenPreview}
              >
                <span className="inline-flex items-center gap-2">
                  <FaPrint />
                  Ver PDF / Imprimir
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center bg-white p-6">
            {previewEtiqueta}
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-lg p-4 w-11/12 h-5/6 flex flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vista Previa del PDF</h2>
              <button
                type="button"
                onClick={() => {
                  setShowPreview(false);
                  setPreviewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar vista previa"
              >
                <FaTimes size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewLoading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600">Generando...</div>
              ) : previewUrl ? (
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className="w-full h-full"
                >
                  <p>No se puede mostrar el PDF. Por favor, intente nuevamente.</p>
                </object>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">Sin vista previa disponible.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerarEtiquetasModal;
