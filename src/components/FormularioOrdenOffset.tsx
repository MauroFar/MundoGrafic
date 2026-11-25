import React from 'react';
import SelectorPrensa from './SelectorPrensa';
import SelectorInstruccionOffset from './SelectorInstruccionOffset';

type EstiloSeccionOffset = {
  bold: boolean;
  underline: boolean;
  color: string;
};

const ESTILO_OFFSET_DEFAULT: EstiloSeccionOffset = {
  bold: false,
  underline: false,
  color: '#111827',
};

export interface MaterialAdicionalOffset {
  id: string;
  material: string;
  tamano_pliego: string;
  cabida_producto: string;
  cantidad_pliegos_compra: string;
  exceso: string;
  total_pliegos: string;
  guillotina_tamano_corte: string;
  cabida_corte: string;
  formatos_a_imprimir: string;
  cabida_imp_formato: string;
  total_impresion: string;
}

export const crearMaterialAdicionalOffset = (): MaterialAdicionalOffset => ({
  id: crypto.randomUUID(),
  material: '',
  tamano_pliego: '',
  cabida_producto: '',
  cantidad_pliegos_compra: '',
  exceso: '',
  total_pliegos: '',
  guillotina_tamano_corte: '',
  cabida_corte: '',
  formatos_a_imprimir: '',
  cabida_imp_formato: '',
  total_impresion: '',
});

export const calcularMaterialAdicionalOffset = (
  material: MaterialAdicionalOffset,
  cantidad: string,
): MaterialAdicionalOffset => {
  const cantidadNumerica = parseFloat(String(cantidad).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
  const cabidaProducto = parseFloat(material.cabida_producto.replace(',', '.')) || 0;
  const cantidadPliegos = cantidadNumerica > 0 && cabidaProducto > 0
    ? Math.ceil(cantidadNumerica / cabidaProducto)
    : 0;
  const exceso = parseInt(material.exceso, 10) || 0;
  const totalPliegos = cantidadPliegos > 0 || exceso > 0 ? cantidadPliegos + exceso : 0;
  const cabidaCorte = parseInt(material.cabida_corte, 10) || 0;
  const formatosImprimir = totalPliegos > 0 && cabidaCorte > 0 ? totalPliegos * cabidaCorte : 0;
  const cabidaImpresion = parseInt(material.cabida_imp_formato, 10) || 0;
  const totalImpresion = formatosImprimir > 0 && cabidaImpresion > 0
    ? formatosImprimir * cabidaImpresion
    : 0;

  return {
    ...material,
    cantidad_pliegos_compra: cantidadPliegos ? String(cantidadPliegos) : '',
    total_pliegos: totalPliegos ? String(totalPliegos) : '',
    formatos_a_imprimir: formatosImprimir ? String(formatosImprimir) : '',
    total_impresion: totalImpresion ? String(totalImpresion) : '',
  };
};

const OFFSET_COLORS = [
  { color: '#111827', label: 'Negro' },
  { color: '#1d4ed8', label: 'Azul' },
  { color: '#dc2626', label: 'Rojo' },
  { color: '#15803d', label: 'Verde' },
  { color: '#7c3aed', label: 'Morado' },
  { color: '#ea580c', label: 'Naranja' },
  { color: '#0891b2', label: 'Celeste' },
  { color: '#be185d', label: 'Rosa' },
];

const FormatoToolbarSeccion: React.FC<{
  estilo: EstiloSeccionOffset;
  onToggleBold: () => void;
  onToggleUnderline: () => void;
  onSetColor: (color: string) => void;
}> = ({ estilo, onToggleBold, onToggleUnderline, onSetColor }) => (
  <div className="flex items-center gap-3 flex-wrap">
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggleBold}
        className={`px-2.5 py-1 rounded border text-sm font-bold ${estilo.bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
        title="Negrita"
      >
        B
      </button>
      <span className="text-[10px] font-medium text-gray-600">Negrita</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggleUnderline}
        className={`px-2.5 py-1 rounded border text-sm font-semibold underline ${estilo.underline ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
        title="Subrayado"
      >
        U
      </button>
      <span className="text-[10px] font-medium text-gray-600">Subrayado</span>
    </div>
    <div className="flex items-center gap-1 flex-wrap pl-1">
      {OFFSET_COLORS.map(({ color, label }) => (
        <button
          key={color}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => onSetColor(color)}
          className="w-5 h-5 rounded-full border-2 transition-all"
          style={{
            backgroundColor: color,
            borderColor: estilo.color === color ? '#1d4ed8' : 'transparent',
            boxShadow: estilo.color === color ? '0 0 0 2px #fff, 0 0 0 4px #1d4ed8' : 'none',
          }}
        />
      ))}
      <label
        title="Color personalizado"
        className="relative flex h-5 w-5 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-gray-400 bg-white"
      >
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={estilo.color}
          onChange={(e) => onSetColor(e.target.value)}
        />
        <span className="text-[10px] text-gray-500">✦</span>
      </label>
    </div>
  </div>
);

interface FormularioOrdenOffsetProps {
  cantidad: string;
  materialesAdicionales: MaterialAdicionalOffset[];
  setMaterialesAdicionales: React.Dispatch<React.SetStateAction<MaterialAdicionalOffset[]>>;
  // Información del trabajo
  setCantidad: (value: string) => void;
  concepto: string;
  setConcepto: (value: string) => void;
  tamanoAbierto1: string;
  setTamanoAbierto1: (value: string) => void;
  tamanoCerrado1: string;
  setTamanoCerrado1: (value: string) => void;

  // Material y Corte
  material: string;
  setMaterial: (value: string) => void;
  materialEspesor: string;
  setMaterialEspesor: (value: string) => void;
  corteMaterial: string;
  setCorteMaterial: (value: string) => void;
  tamanoPliego: string;
  setTamanoPliego: (value: string) => void;

  // Cantidad de Pliegos
  cabidaProducto: string;
  setCabidaProducto: (value: string) => void;
  cantidadPliegosCompra: string;
  setCantidadPliegosCompra: (value: string) => void;
  exceso: string;
  setExceso: (value: string) => void;
  totalPliegos: string;

  // Guillotina
  cabidaCorte: string;
  setCabidaCorte: (value: string) => void;
  guillotinaTamanoCorte: string;
  setGuillotinaTamanoCorte: (value: string) => void;
  formatosAImprimir: string;
  cabidaImpFormato: string;
  setCabidaImpFormato: (value: string) => void;
  totalImpresion: string;

  // Impresión y Acabados
  impresion: string;
  setImpresion: (value: string) => void;
  instruccionesImpresion: string;
  setInstruccionesImpresion: (value: string) => void;
  instruccionesAcabados: string;
  setInstruccionesAcabados: (value: string) => void;
  instruccionesEmpacado: string;
  setInstruccionesEmpacado: (value: string) => void;

  // Prensa y Observaciones
  prensaSeleccionada: string;
  setPrensaSeleccionada: (value: string) => void;
  observaciones: string;
  setObservaciones: (value: string) => void;
  notasObservaciones: string;
  setNotasObservaciones: (value: string) => void;
  estilos?: Record<string, EstiloSeccionOffset>;
  setEstilos?: React.Dispatch<React.SetStateAction<Record<string, EstiloSeccionOffset>>>;
}

const RichTextOffsetField: React.FC<{
  label: string;
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  placeholder?: string;
  rows?: number;
  isTextarea?: boolean;
  inputClassName?: string;
  inputWidth?: number;
}> = ({ label, fieldKey, value, onChange, onFocus, placeholder, rows, isTextarea = false, inputClassName, inputWidth }) => {
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!editorRef.current) return;
    const nextHtml = value || '';
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [value]);

  return (
    <div
      style={inputWidth ? { width: inputWidth, minWidth: inputWidth, flex: '0 0 auto' } : undefined}
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        ref={editorRef}
        data-offset-field-key={fieldKey}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={inputClassName ?? (isTextarea
          ? 'w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none'
          : 'w-full min-h-[38px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500')}
        style={{
          color: '#111827',
          whiteSpace: isTextarea ? 'pre-wrap' : 'normal',
          ...(inputWidth ? { width: inputWidth, minWidth: inputWidth, flexShrink: 0 } : {}),
        }}
        onFocus={onFocus}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onMouseUp={onFocus}
        onKeyUp={onFocus}
        data-placeholder={placeholder}
      />
    </div>
  );
};

const MaterialAdicionalOffsetCard: React.FC<{
  material: MaterialAdicionalOffset;
  cantidad: string;
  numero: number;
  onChange: (material: MaterialAdicionalOffset) => void;
  onRemove: () => void;
}> = ({ material, cantidad, numero, onChange, onRemove }) => {
  const materialCalculado = calcularMaterialAdicionalOffset(material, cantidad);
  const cambiarCampo = (campo: keyof MaterialAdicionalOffset, valor: string) => {
    onChange({ ...material, [campo]: valor });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
    <div className="mb-3 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
      <h4 className="font-semibold text-gray-800">Material adicional {numero}</h4>
      <button
        type="button"
        onClick={onRemove}
        className="rounded border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Eliminar
      </button>
    </div>

    <div className="flex flex-wrap items-start gap-4">
      <div className="flex w-full flex-col gap-2 md:w-[38%]">
        <p className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Material</p>
        <label className="block text-sm font-medium text-gray-700">Material</label>
        <textarea
          className="min-h-[32px] w-full resize-none rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          placeholder="Escribir material..."
          value={material.material}
          onChange={(event) => cambiarCampo('material', event.target.value)}
        />
        <div className="mt-1 flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tamaño Pliego</label>
            <input type="text" className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="65x90" value={material.tamano_pliego} onChange={(event) => cambiarCampo('tamano_pliego', event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cabida Prod.</label>
            <input type="number" className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="0" value={material.cabida_producto} onChange={(event) => cambiarCampo('cabida_producto', event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cantidad de Pliegos</label>
            <input type="text" className="w-16 cursor-not-allowed rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-700" placeholder="0" value={materialCalculado.cantidad_pliegos_compra} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Exceso</label>
            <input type="text" className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="0" value={material.exceso} onChange={(event) => cambiarCampo('exceso', event.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-[27%]">
        <p className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Guillotina</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Pliegos a Cortar</label>
            <input type="text" className="w-16 cursor-not-allowed rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-700" placeholder="0" value={materialCalculado.total_pliegos} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tamaño de Corte</label>
            <input type="text" className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="65x90" value={material.guillotina_tamano_corte} onChange={(event) => cambiarCampo('guillotina_tamano_corte', event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cabida Corte</label>
            <input type="number" className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0" value={material.cabida_corte} onChange={(event) => cambiarCampo('cabida_corte', event.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="border-b border-gray-100 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Prensas</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Formatos a Imprimir</label>
            <input type="text" className="w-20 cursor-not-allowed rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-700" placeholder="0" value={materialCalculado.formatos_a_imprimir} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cabida Imp. en Formato</label>
            <input type="number" className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" placeholder="0" value={material.cabida_imp_formato} onChange={(event) => cambiarCampo('cabida_imp_formato', event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Total de Impresión</label>
            <input type="text" className="w-20 cursor-not-allowed rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm font-semibold text-gray-700" placeholder="0" value={materialCalculado.total_impresion} readOnly />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

const FormularioOrdenOffset: React.FC<FormularioOrdenOffsetProps> = ({
  cantidad,
  materialesAdicionales,
  setMaterialesAdicionales,
  setCantidad,
  concepto,
  setConcepto,
  tamanoAbierto1,
  setTamanoAbierto1,
  tamanoCerrado1,
  setTamanoCerrado1,
  material,
  setMaterial,
  setMaterialEspesor,
  corteMaterial,
  setCorteMaterial,
  tamanoPliego,
  setTamanoPliego,
  cabidaProducto,
  setCabidaProducto,
  cantidadPliegosCompra,
  setCantidadPliegosCompra,
  exceso,
  setExceso,
  totalPliegos,
  cabidaCorte,
  setCabidaCorte,
  guillotinaTamanoCorte,
  setGuillotinaTamanoCorte,
  formatosAImprimir,
  cabidaImpFormato,
  setCabidaImpFormato,
  totalImpresion,
  impresion,
  setImpresion,
  instruccionesImpresion,
  setInstruccionesImpresion,
  instruccionesAcabados,
  setInstruccionesAcabados,
  instruccionesEmpacado,
  setInstruccionesEmpacado,
  prensaSeleccionada,
  setPrensaSeleccionada,
  observaciones,
  setObservaciones,
  notasObservaciones,
  setNotasObservaciones,
  estilos,
  setEstilos,
}) => {
  const [materialPendienteEliminar, setMaterialPendienteEliminar] = React.useState<string | null>(null);
  const [seccionesEstilo, setSeccionesEstilo] = React.useState<Record<string, EstiloSeccionOffset>>({
    trabajo: { ...ESTILO_OFFSET_DEFAULT },
    material: { ...ESTILO_OFFSET_DEFAULT },
    pliegos: { ...ESTILO_OFFSET_DEFAULT },
    impresion: { ...ESTILO_OFFSET_DEFAULT },
    prensa: { ...ESTILO_OFFSET_DEFAULT },
    ...(estilos || {}),
  });
  const [campoEstiloActivo, setCampoEstiloActivo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (estilos && typeof estilos === 'object') {
      setSeccionesEstilo((prev) => ({
        trabajo: { ...ESTILO_OFFSET_DEFAULT, ...(prev.trabajo || {}), ...(estilos.trabajo || {}) },
        material: { ...ESTILO_OFFSET_DEFAULT, ...(prev.material || {}), ...(estilos.material || {}) },
        pliegos: { ...ESTILO_OFFSET_DEFAULT, ...(prev.pliegos || {}), ...(estilos.pliegos || {}) },
        impresion: { ...ESTILO_OFFSET_DEFAULT, ...(prev.impresion || {}), ...(estilos.impresion || {}) },
        prensa: { ...ESTILO_OFFSET_DEFAULT, ...(prev.prensa || {}), ...(estilos.prensa || {}) },
      }));
    }
  }, [estilos]);

  const obtenerEstiloSeccion = (clave: string): EstiloSeccionOffset => seccionesEstilo[clave] || { ...ESTILO_OFFSET_DEFAULT };

  const actualizarEstiloSeccion = (clave: string, patch: Partial<EstiloSeccionOffset>) => {
    setSeccionesEstilo((prev) => {
      const next = {
        ...prev,
        [clave]: {
          ...ESTILO_OFFSET_DEFAULT,
          ...(prev[clave] ?? {}),
          ...patch,
        },
      };
      if (setEstilos) setEstilos(next);
      return next;
    });
  };

  const ejecutarFormatoEnCampoActivo = (command: 'bold' | 'underline' | 'foreColor', color?: string) => {
    const campo = campoEstiloActivo;
    if (!campo) return;
    const editor = document.querySelector(`[data-offset-field-key="${campo}"]`) as HTMLDivElement | null;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, color ?? undefined);
    const nextHtml = editor.innerHTML;

    switch (campo) {
      case 'cantidad': setCantidad(nextHtml); break;
      case 'concepto': setConcepto(nextHtml); break;
      case 'tamano_abierto_1': setTamanoAbierto1(nextHtml); break;
      case 'tamano_cerrado_1': setTamanoCerrado1(nextHtml); break;
      case 'material': setMaterial(nextHtml); break;
      case 'corte_material': setCorteMaterial(nextHtml); break;
      case 'cantidad_pliegos_compra': setCantidadPliegosCompra(nextHtml); break;
      case 'exceso': setExceso(nextHtml); break;
      case 'impresion': setImpresion(nextHtml); break;
      case 'instrucciones_impresion': setInstruccionesImpresion(nextHtml); break;
      case 'instrucciones_acabados': setInstruccionesAcabados(nextHtml); break;
      case 'instrucciones_empacado': setInstruccionesEmpacado(nextHtml); break;
      case 'prensa_seleccionada': setPrensaSeleccionada(nextHtml); break;
      case 'observaciones': setObservaciones(nextHtml); break;
      case 'notas_observaciones': setNotasObservaciones(nextHtml); break;
      default: break;
    }
  };

  const estiloCampo = (clave: string) => {
    const estilo = obtenerEstiloSeccion(clave);
    return {
      color: estilo.color,
      fontWeight: estilo.bold ? 700 : 400,
      textDecoration: estilo.underline ? 'underline' : 'none',
    };
  };

  return (
    <>
      {/* Información del Trabajo - Diseño compacto */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            Información del Trabajo
          </h3>
          <FormatoToolbarSeccion
            estilo={obtenerEstiloSeccion('trabajo')}
            onToggleBold={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('bold');
                return;
              }
              actualizarEstiloSeccion('trabajo', { bold: !obtenerEstiloSeccion('trabajo').bold });
            }}
            onToggleUnderline={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('underline');
                return;
              }
              actualizarEstiloSeccion('trabajo', { underline: !obtenerEstiloSeccion('trabajo').underline });
            }}
            onSetColor={(color) => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('foreColor', color);
                return;
              }
              actualizarEstiloSeccion('trabajo', { color });
            }}
          />
        </div>
        
        <div className="flex gap-4 items-start">
          <div className="flex flex-col">
            <RichTextOffsetField
              label="Cantidad"
              fieldKey="cantidad"
              value={cantidad}
              onChange={setCantidad}
              onFocus={() => setCampoEstiloActivo('cantidad')}
              inputClassName="w-20 min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              inputWidth={112}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <RichTextOffsetField
              label="Concepto"
              fieldKey="concepto"
              value={concepto}
              onChange={setConcepto}
              onFocus={() => setCampoEstiloActivo('concepto')}
              isTextarea={true}
              placeholder="Descripción del trabajo..."
              inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex flex-col">
            <RichTextOffsetField
              label="Tamaño Abierto"
              fieldKey="tamano_abierto_1"
              value={tamanoAbierto1}
              onChange={setTamanoAbierto1}
              onFocus={() => setCampoEstiloActivo('tamano_abierto_1')}
              inputClassName="w-20 min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              inputWidth={112}
            />
          </div>

          <div className="flex flex-col">
            <RichTextOffsetField
              label="Tamaño Cerrado"
              fieldKey="tamano_cerrado_1"
              value={tamanoCerrado1}
              onChange={setTamanoCerrado1}
              onFocus={() => setCampoEstiloActivo('tamano_cerrado_1')}
              inputClassName="w-20 min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              inputWidth={112}
            />
          </div>
        </div>
      </div>

      {/* Material y Corte + Cantidad de Pliegos */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            Material y Corte
          </h3>
          <FormatoToolbarSeccion
            estilo={obtenerEstiloSeccion('material')}
            onToggleBold={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('bold');
                return;
              }
              actualizarEstiloSeccion('material', { bold: !obtenerEstiloSeccion('material').bold });
            }}
            onToggleUnderline={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('underline');
                return;
              }
              actualizarEstiloSeccion('material', { underline: !obtenerEstiloSeccion('material').underline });
            }}
            onSetColor={(color) => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('foreColor', color);
                return;
              }
              actualizarEstiloSeccion('material', { color });
            }}
          />
        </div>
        
        <div className="flex gap-4 items-start">

          {/* Columna 1 — Material (más ancha) */}
          <div className="flex flex-col gap-2 w-[38%]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1">Material</p>
            <RichTextOffsetField
              label="Material"
              fieldKey="material"
              value={material}
              onChange={(value) => {
                setMaterial(value);
                setMaterialEspesor('');
              }}
              onFocus={() => setCampoEstiloActivo('material')}
              placeholder="Escribir material..."
              isTextarea={true}
              inputClassName="w-full min-h-[32px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm resize-none"
            />
            <div className="flex flex-wrap gap-3 mt-1">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño Pliego</label>
                <input
                  type="text"
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                  placeholder="65x90"
                  value={tamanoPliego}
                  onChange={(e) => setTamanoPliego(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cabida Prod.</label>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                  placeholder="0"
                  value={cabidaProducto}
                  onChange={(e) => setCabidaProducto(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad de Pliegos</label>
                <input
                  type="text"
                  className="w-16 px-2 py-1 border border-gray-300 rounded bg-gray-50 font-semibold text-gray-700 cursor-not-allowed text-sm"
                  value={cantidadPliegosCompra}
                  readOnly
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Exceso</label>
                <RichTextOffsetField
                  label=""
                  fieldKey="exceso"
                  value={exceso}
                  onChange={setExceso}
                  onFocus={() => setCampoEstiloActivo('exceso')}
                  inputClassName="w-16 min-h-[32px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Columna 2 — Guillotina */}
          <div className="flex flex-col gap-2 w-[27%]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1">Guillotina</p>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pliegos a Cortar</label>
                <input
                  type="text"
                  className="w-16 px-2 py-1 border border-gray-300 rounded bg-gray-50 font-semibold text-gray-700 cursor-not-allowed text-sm"
                  value={totalPliegos}
                  readOnly
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tamaño de Corte</label>
                <input
                  type="text"
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="65x90"
                  value={guillotinaTamanoCorte}
                  onChange={(e) => setGuillotinaTamanoCorte(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cabida Corte</label>
                <input
                  type="number"
                  className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="0"
                  value={cabidaCorte}
                  onChange={(e) => setCabidaCorte(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Columna 3 — Prensas (un poco más grande) */}
          <div className="flex flex-col gap-2 flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 pb-1">Prensas</p>
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Formatos a Imprimir</label>
                <input
                  type="text"
                  className="w-20 px-2 py-1 border border-gray-300 rounded bg-gray-50 font-semibold text-gray-700 cursor-not-allowed text-sm"
                  value={formatosAImprimir}
                  readOnly
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cabida Imp. en Formato</label>
                <input
                  type="number"
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                  placeholder="0"
                  value={cabidaImpFormato}
                  onChange={(e) => setCabidaImpFormato(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total de Impresión</label>
                <input
                  type="text"
                  className="w-20 px-2 py-1 border border-gray-300 rounded bg-gray-50 text-sm font-semibold text-gray-700 cursor-not-allowed"
                  value={totalImpresion}
                  readOnly
                  placeholder="0"
                />
              </div>
            </div>
          </div>

        </div>

        {materialesAdicionales.length > 0 && (
          <div className="mt-4 space-y-4">
            {materialesAdicionales.map((material, index) => (
              <MaterialAdicionalOffsetCard
                key={material.id}
                material={material}
                cantidad={cantidad}
                numero={index + 2}
                onChange={(materialActualizado) => setMaterialesAdicionales((actuales) =>
                  actuales.map((actual) => actual.id === materialActualizado.id ? materialActualizado : actual)
                )}
                onRemove={() => setMaterialPendienteEliminar(material.id)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setMaterialesAdicionales((actuales) => [...actuales, crearMaterialAdicionalOffset()])}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Añadir material adicional
        </button>
      </div>

      {/* Prensa y Observaciones - Diseño horizontal */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            Prensa y Observaciones
          </h3>
          <FormatoToolbarSeccion
            estilo={obtenerEstiloSeccion('prensa')}
            onToggleBold={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('bold');
                return;
              }
              actualizarEstiloSeccion('prensa', { bold: !obtenerEstiloSeccion('prensa').bold });
            }}
            onToggleUnderline={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('underline');
                return;
              }
              actualizarEstiloSeccion('prensa', { underline: !obtenerEstiloSeccion('prensa').underline });
            }}
            onSetColor={(color) => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('foreColor', color);
                return;
              }
              actualizarEstiloSeccion('prensa', { color });
            }}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SelectorPrensa
            value={prensaSeleccionada}
            onChange={setPrensaSeleccionada}
            label="Seleccionar Prensa"
            placeholder="Seleccionar o escribir prensa..."
            inputStyle={estiloCampo('prensa')}
          />

          <div className="lg:col-span-2">
            <RichTextOffsetField
              label="Observaciones Generales"
              fieldKey="observaciones"
              value={observaciones}
              onChange={setObservaciones}
              onFocus={() => setCampoEstiloActivo('observaciones')}
              isTextarea={true}
              placeholder="Observaciones generales del trabajo..."
              inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <RichTextOffsetField
            label="Notas Adicionales"
            fieldKey="notas_observaciones"
            value={notasObservaciones}
            onChange={setNotasObservaciones}
            onFocus={() => setCampoEstiloActivo('notas_observaciones')}
            isTextarea={true}
            placeholder="Añadir notas adicionales aquí..."
            inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      {/* Impresión y Acabados - Diseño horizontal */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            Impresión y Acabados
          </h3>
          <FormatoToolbarSeccion
            estilo={obtenerEstiloSeccion('impresion')}
            onToggleBold={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('bold');
                return;
              }
              actualizarEstiloSeccion('impresion', { bold: !obtenerEstiloSeccion('impresion').bold });
            }}
            onToggleUnderline={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('underline');
                return;
              }
              actualizarEstiloSeccion('impresion', { underline: !obtenerEstiloSeccion('impresion').underline });
            }}
            onSetColor={(color) => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('foreColor', color);
                return;
              }
              actualizarEstiloSeccion('impresion', { color });
            }}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <SelectorInstruccionOffset
              categoria="impresion"
              fieldKey="instrucciones_impresion"
              label="Instrucciones de Impresión"
              value={instruccionesImpresion}
              onChange={setInstruccionesImpresion}
              onFocus={() => setCampoEstiloActivo('instrucciones_impresion')}
              placeholder="Instrucciones específicas..."
              inputClassName="w-full min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <SelectorInstruccionOffset
              categoria="acabados"
              fieldKey="instrucciones_acabados"
              label="Instrucciones de Acabados y Terminados"
              value={instruccionesAcabados}
              onChange={setInstruccionesAcabados}
              onFocus={() => setCampoEstiloActivo('instrucciones_acabados')}
              placeholder="Instrucciones de acabados y terminados..."
              inputClassName="w-full min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <SelectorInstruccionOffset
              categoria="empacado"
              fieldKey="instrucciones_empacado"
              label="Instrucciones de Empacado"
              value={instruccionesEmpacado}
              onChange={setInstruccionesEmpacado}
              onFocus={() => setCampoEstiloActivo('instrucciones_empacado')}
              placeholder="Instrucciones de empacado..."
              inputClassName="w-full min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <RichTextOffsetField
            label="Notas Adicionales"
            fieldKey="impresion"
            value={impresion}
            onChange={setImpresion}
            onFocus={() => setCampoEstiloActivo('impresion')}
            isTextarea={true}
            placeholder="Notas adicionales..."
            inputClassName="w-full min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {materialPendienteEliminar !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setMaterialPendienteEliminar(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-eliminar-material-titulo"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="confirmar-eliminar-material-titulo" className="text-lg font-bold text-gray-900">
              Eliminar material adicional
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              ¿Estás seguro de que deseas eliminar este cuadro?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMaterialPendienteEliminar(null)}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaterialesAdicionales((actuales) => actuales.filter((material) => material.id !== materialPendienteEliminar));
                  setMaterialPendienteEliminar(null);
                }}
                className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormularioOrdenOffset;
