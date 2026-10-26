import React, { useMemo, useState } from 'react';
import { FaTimes, FaPrint, FaTag, FaCheck } from 'react-icons/fa';

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

  React.useEffect(() => {
    if (isOpen) {
      setForm(defaultEtiquetaForm(orden, producto));
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

  const handlePrint = () => {
    window.print();
  };

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
                onClick={handlePrint}
              >
                <span className="inline-flex items-center gap-2">
                  <FaPrint />
                  Imprimir
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center bg-white p-6">
            <div className="w-full max-w-[340px] border border-black bg-white p-2 shadow-md print:shadow-none">
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

                <div className="mt-3 flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-700">
                  <FaCheck className="mr-2 text-green-600" />
                  Etiqueta validada
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerarEtiquetasModal;
