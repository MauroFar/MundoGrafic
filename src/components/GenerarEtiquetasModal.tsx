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
  oc: string;
  numeroCaja: string;
  cantidad: string;
  miniCantidad: string;
  paquete1: string;
  paquete2: string;
  paquete3: string;
  unidad1: string;
  unidad2: string;
  unidad3: string;
  codigo: string;
  lote: string;
  fecha: string;
  lugarEntrega: string;
  ciudad: string;
  core: string;
  pesoNeto: string;
  pesoBruto: string;
  miniCore: string;
  miniPesoNeto: string;
  miniPesoBruto: string;
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

  return {
    cliente: orden?.nombre_cliente || '',
    producto: productName,
    oc: ordenCompra,
    numeroCaja: '',
    cantidad: String(cantidad ?? ''),
    miniCantidad: '',
    paquete1: '',
    paquete2: '',
    paquete3: '',
    unidad1: '',
    unidad2: '',
    unidad3: '',
    codigo: codigoCliente,
    lote: loteProduccion,
    fecha: getLocalDateValue(),
    lugarEntrega: '',
    ciudad: '',
    core: '',
    pesoNeto: '',
    pesoBruto: '',
    miniCore: '',
    miniPesoNeto: '',
    miniPesoBruto: '',
  };
};

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const buildFormatoValue = (form: EtiquetaFormData) => {
const paquete = [form.paquete1, form.paquete2, form.paquete3].filter(Boolean).join('').trim();
    const unidad = [form.unidad1, form.unidad2, form.unidad3].filter(Boolean).join('').trim();

  if (!paquete && !unidad) return '';
  if (!paquete) return unidad;
  if (!unidad) return paquete;
  return `${paquete} x ${unidad}`;
};

const GenerarEtiquetasModal: React.FC<GenerarEtiquetasModalProps> = ({ orden, producto, isOpen, onClose }) => {
  const [form, setForm] = useState<EtiquetaFormData>(() => defaultEtiquetaForm(orden, producto));
  const [generalChecked, setGeneralChecked] = useState<boolean>(true);
  const [miniChecked, setMiniChecked] = useState<boolean>(true);
  const [numeroEtiquetasGeneral, setNumeroEtiquetasGeneral] = useState<string>('1');
  const [numeroEtiquetasMini, setNumeroEtiquetasMini] = useState<string>('1');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setForm(defaultEtiquetaForm(orden, producto));
      setGeneralChecked(true);
      setMiniChecked(true);
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
    oc: cleanText(form.oc || ''),
    numeroCaja: cleanText(form.numeroCaja || ''),
    cantidad: cleanText(form.cantidad || ''),
    formato: cleanText(buildFormatoValue(form)),
    codigo: cleanText(form.codigo || ''),
    lote: cleanText(form.lote || ''),
    fecha: cleanText(form.fecha || formatDate(form.fecha || '')),
    lugarEntrega: cleanText(form.lugarEntrega || ''),
    ciudad: cleanText(form.ciudad || ''),
    core: cleanText(form.core || ''),
    pesoNeto: cleanText(form.pesoNeto || ''),
    pesoBruto: cleanText(form.pesoBruto || ''),
    miniCore: cleanText(form.miniCore || ''),
    miniPesoNeto: cleanText(form.miniPesoNeto || ''),
    miniPesoBruto: cleanText(form.miniPesoBruto || ''),
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
        oc: form.oc,
        numeroCaja: form.numeroCaja,
        cantidad: form.cantidad,
        miniCantidad: form.miniCantidad,
        formato: buildFormatoValue(form),
        paquete1: form.paquete1,
        paquete2: form.paquete2,
        paquete3: form.paquete3,
        unidad1: form.unidad1,
        unidad2: form.unidad2,
        unidad3: form.unidad3,
        codigo: form.codigo,
        lote: form.lote,
        fecha: form.fecha,
        lugarEntrega: form.lugarEntrega,
        ciudad: form.ciudad,
        core: form.core,
        pesoNeto: form.pesoNeto,
        pesoBruto: form.pesoBruto,
        miniCore: form.miniCore,
        miniPesoNeto: form.miniPesoNeto,
        miniPesoBruto: form.miniPesoBruto,
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

  const renderInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    type: 'text' | 'date' | 'number' = 'text',
    className = 'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
    readOnly = false,
  ) => (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      <input
        type={type}
        className={className}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
      />
    </label>
  );

  const renderGeneralPanel = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800">Etiqueta General</h3>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={generalChecked}
            onChange={(e) => setGeneralChecked(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          <span>Mostrar</span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderInput('Cliente', form.cliente, (value) => updateField('cliente', value))}
          {renderInput('O.C.', form.oc, (value) => updateField('oc', value))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderInput('Número de caja', form.numeroCaja, (value) => updateField('numeroCaja', value))}
          {generalChecked ? (
            <label className="block text-sm font-medium text-gray-700">
              Número de etiquetas
              <input
                type="number"
                min={1}
                step={1}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                value={numeroEtiquetasGeneral}
                onChange={(e) => setNumeroEtiquetasGeneral(e.target.value)}
              />
            </label>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>

        {renderInput('Producto / descripción', form.producto, (value) => updateField('producto', value))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderInput('Cantidad', form.cantidad, (value) => updateField('cantidad', value), undefined, 'text')}
        </div>

        <div className="rounded-md border border-gray-300 bg-gray-50 p-3">
          <div className="text-sm font-medium text-gray-700">Formato de paquete</div>
          <div className="mt-3 flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">Paquete</div>
              <div className="flex flex-col gap-1.5">
                {([1, 2, 3] as const).map((index) => (
                  <input
                    key={`paquete-${index}`}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form[`paquete${index}` as keyof Pick<EtiquetaFormData, 'paquete1' | 'paquete2' | 'paquete3'>]}
                    onChange={(e) => updateField(`paquete${index}` as keyof EtiquetaFormData, e.target.value)}
                    placeholder={index === 1 ? '5' : index === 2 ? 'R' : 'P'}
                  />
                ))}
              </div>
            </div>

            <div className="pb-3 text-xl font-black leading-none text-gray-600">x</div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">Unidad</div>
              <div className="flex flex-col gap-1.5">
                {([1, 2, 3] as const).map((index) => (
                  <input
                    key={`unidad-${index}`}
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    value={form[`unidad${index}` as keyof Pick<EtiquetaFormData, 'unidad1' | 'unidad2' | 'unidad3'>]}
                    onChange={(e) => updateField(`unidad${index}` as keyof EtiquetaFormData, e.target.value)}
                    placeholder={index === 1 ? '1000' : index === 2 ? 'cm' : 'm'}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderInput('Código', form.codigo, (value) => updateField('codigo', value))}
          {renderInput('Lote', form.lote, (value) => updateField('lote', value))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderInput('Fecha', form.fecha, (value) => updateField('fecha', value), undefined, 'date')}
          {renderInput('Ciudad', form.ciudad, (value) => updateField('ciudad', value))}
        </div>

        {renderInput('Lugar Entrega', form.lugarEntrega, (value) => updateField('lugarEntrega', value))}
      </div>
    </div>
  );

  const renderMiniPanel = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-800">Etiqueta individual 5,5 x 3cm</h3>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={generalChecked}
            onChange={(e) => setMiniChecked(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          <span>Mostrar</span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput('Cliente', form.cliente, (value) => updateField('cliente', value))}
          {renderInput('O.C.', form.oc, (value) => updateField('oc', value))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput('Producto / descripción', form.producto, (value) => updateField('producto', value))}
          {renderInput('Cantidad individual', form.miniCantidad, (value) => updateField('miniCantidad', value), 'Ej. 25', 'text')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput('Código', form.codigo, (value) => updateField('codigo', value))}
          {renderInput('Lote', form.lote, (value) => updateField('lote', value))}
        </div>

        <div className="space-y-3 rounded-md border border-gray-300 bg-gray-50 p-3">
          <div className="text-sm font-medium text-gray-700">Datos de etiqueta</div>
          {renderInput('Core', form.miniCore, (value) => updateField('miniCore', value))}
          {renderInput('Peso Neto', form.miniPesoNeto, (value) => updateField('miniPesoNeto', value))}
          {renderInput('Peso Bruto', form.miniPesoBruto, (value) => updateField('miniPesoBruto', value))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput('Fecha', form.fecha, (value) => updateField('fecha', value), undefined, 'date')}
        </div>

        {miniChecked && (
          <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="p-4 sm:p-6 border-b border-gray-200 lg:border-b-0 lg:border-r bg-gray-50">
            {renderGeneralPanel()}

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

          <div className="bg-white p-4 sm:p-6">
            {renderMiniPanel()}
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
