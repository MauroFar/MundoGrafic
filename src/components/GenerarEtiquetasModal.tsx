import React, { useMemo, useState } from 'react';
import { FaTimes, FaPrint, FaTag } from 'react-icons/fa';

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
  cantidad: string;
  codigo: string;
  lote: string;
  fecha: string;
}

interface GenerarEtiquetasModalProps {
  orden: OrdenEtiqueta | null;
  producto?: any;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return value;
  }
};

const defaultEtiquetaForm = (orden: OrdenEtiqueta | null, producto?: any): EtiquetaFormData => ({
  cliente: orden?.nombre_cliente || 'FARBIO PHARMA',
  producto: producto?.producto || producto?.descripcion || orden?.concepto || 'ET ROLLO ADHESIVA AMARILLA',
  tamano: producto?.tamano || producto?.medidas || '10x10 CM',
  oc: orden?.numero_orden || '24020',
  cantidad: producto?.cantidad || '14000U',
  codigo: producto?.codigo || producto?.codigo_producto || '9100410',
  lote: producto?.lote || 'MG161029',
  fecha: formatDate(orden?.fecha_creacion),
});

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const GenerarEtiquetasModal: React.FC<GenerarEtiquetasModalProps> = ({ orden, producto, isOpen, onClose }) => {
  const [form, setForm] = useState<EtiquetaFormData>(() => defaultEtiquetaForm(orden, producto));
  const [numeroEtiquetas, setNumeroEtiquetas] = useState<number>(1);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setForm(defaultEtiquetaForm(orden, producto));
      setNumeroEtiquetas(1);
      setShowPreview(false);
      setPreviewUrl(null);
      setPreviewLoading(false);
    }
  }, [orden, producto, isOpen]);

  const preview = useMemo(() => ({
    cliente: cleanText(form.cliente || 'FARBIO PHARMA'),
    producto: cleanText(form.producto || 'ET ROLLO ADHESIVA AMARILLA'),
    tamano: cleanText(form.tamano || '10x10 CM'),
    oc: cleanText(form.oc || '24020'),
    cantidad: cleanText(form.cantidad || '14000U'),
    codigo: cleanText(form.codigo || '9100410'),
    lote: cleanText(form.lote || 'MG161029'),
    fecha: cleanText(form.fecha || formatDate()),
  }), [form]);

  const updateField = (field: keyof EtiquetaFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
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
        cliente: preview.cliente,
        producto: preview.producto,
        tamano: preview.tamano,
        oc: preview.oc,
        cantidad: preview.cantidad,
        codigo: preview.codigo,
        lote: preview.lote,
        fecha: preview.fecha,
        numeroEtiquetas: Math.max(1, Number(numeroEtiquetas) || 1),
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
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide border-b border-dashed border-gray-300 pb-1">
          <span>{preview.cliente || 'FARBIO PHARMA'}</span>
          <span className="font-black">MUNDOGRAFIC</span>
        </div>

        <div className="mt-2 text-center text-[16px] font-black uppercase leading-tight">
          {preview.producto || 'ET ROLLO ADHESIVA AMARILLA'}
        </div>

        <div className="mt-2 text-center text-[13px] font-bold uppercase">
          {preview.tamano || '10x10 CM'}
        </div>

        <div className="mt-3 space-y-2 text-left text-[12px] font-semibold">
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>OC:</span>
            <span>{preview.oc || '24020'}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>CANTIDAD:</span>
            <span>{preview.cantidad || '14000U'}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>CÓDIGO:</span>
            <span>{preview.codigo || '9100410'}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-dashed border-gray-200 pb-1">
            <span>LOTE:</span>
            <span>{preview.lote || 'MG161029'}</span>
          </div>
          <div className="flex justify-between gap-4 pb-1">
            <span>FECHA:</span>
            <span>{preview.fecha || '26-10-2026'}</span>
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
                  value={form.fecha ? new Date(form.fecha.split('/').reverse().join('-')).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  onChange={(e) => updateField('fecha', new Date(e.target.value).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }))}
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Número de etiquetas
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  value={numeroEtiquetas}
                  onChange={(e) => setNumeroEtiquetas(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
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
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              {previewLoading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-600">Generando...</div>
              ) : previewUrl ? (
                <div className="flex items-center justify-center w-full h-full">
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    title="Vista previa de etiqueta"
                    style={{ width: '100%', height: '100%', minHeight: '760px', maxWidth: '820px' }}
                    className="border border-gray-300 bg-white shadow-sm"
                  >
                    <p>No se puede mostrar el PDF. Por favor, intente nuevamente.</p>
                  </object>
                </div>
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
