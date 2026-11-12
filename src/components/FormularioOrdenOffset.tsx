import React from 'react';
import SelectorPrensa from './SelectorPrensa';

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
  // Información del trabajo
  cantidad: string;
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

  // Cantidad de Pliegos
  cantidadPliegosCompra: string;
  setCantidadPliegosCompra: (value: string) => void;
  exceso: string;
  setExceso: (value: string) => void;
  totalPliegos: string;

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
}> = ({ label, fieldKey, value, onChange, onFocus, placeholder, rows, isTextarea = false, inputClassName }) => {
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!editorRef.current) return;
    const nextHtml = value || '';
    if (editorRef.current.innerHTML !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [value]);

  return (
    <div>
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

const FormularioOrdenOffset: React.FC<FormularioOrdenOffsetProps> = ({
  cantidad,
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
  cantidadPliegosCompra,
  setCantidadPliegosCompra,
  exceso,
  setExceso,
  totalPliegos,
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
            />
          </div>
        </div>
      </div>

      {/* Material y Corte - Diseño horizontal */}
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RichTextOffsetField
            label="Material"
            fieldKey="material"
            value={material}
            onChange={(value) => {
              setMaterial(value);
              setMaterialEspesor('');
            }}
            onFocus={() => setCampoEstiloActivo('material')}
            placeholder="Escribir material de offset..."
            inputClassName="w-full min-h-[38px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          />

          <RichTextOffsetField
            label="Corte de Material"
            fieldKey="corte_material"
            value={corteMaterial}
            onChange={setCorteMaterial}
            onFocus={() => setCampoEstiloActivo('corte_material')}
            isTextarea={true}
            placeholder="Instrucciones de corte..."
            inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
          />
        </div>
      </div>

      {/* Cantidad de Pliegos - Diseño compacto */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            Cantidad de Pliegos
          </h3>
          <FormatoToolbarSeccion
            estilo={obtenerEstiloSeccion('pliegos')}
            onToggleBold={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('bold');
                return;
              }
              actualizarEstiloSeccion('pliegos', { bold: !obtenerEstiloSeccion('pliegos').bold });
            }}
            onToggleUnderline={() => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('underline');
                return;
              }
              actualizarEstiloSeccion('pliegos', { underline: !obtenerEstiloSeccion('pliegos').underline });
            }}
            onSetColor={(color) => {
              if (campoEstiloActivo) {
                ejecutarFormatoEnCampoActivo('foreColor', color);
                return;
              }
              actualizarEstiloSeccion('pliegos', { color });
            }}
          />
        </div>
        
        <div className="flex gap-4">
          <RichTextOffsetField
            label="Pliegos de Compra"
            fieldKey="cantidad_pliegos_compra"
            value={cantidadPliegosCompra}
            onChange={setCantidadPliegosCompra}
            onFocus={() => setCampoEstiloActivo('cantidad_pliegos_compra')}
            inputClassName="w-24 min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <RichTextOffsetField
            label="Exceso"
            fieldKey="exceso"
            value={exceso}
            onChange={setExceso}
            onFocus={() => setCampoEstiloActivo('exceso')}
            inputClassName="w-24 min-h-[38px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
            <input 
              className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-50 font-semibold text-gray-700 cursor-not-allowed" 
              type="text" 
              value={totalPliegos}
              readOnly
              style={estiloCampo('pliegos')}
            />
          </div>
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
          <RichTextOffsetField
            label="Impresión"
            fieldKey="impresion"
            value={impresion}
            onChange={setImpresion}
            onFocus={() => setCampoEstiloActivo('impresion')}
            isTextarea={true}
            placeholder="Especificaciones de impresión..."
            inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
          />

          <RichTextOffsetField
            label="Instrucciones de Impresión"
            fieldKey="instrucciones_impresion"
            value={instruccionesImpresion}
            onChange={setInstruccionesImpresion}
            onFocus={() => setCampoEstiloActivo('instrucciones_impresion')}
            isTextarea={true}
            placeholder="Instrucciones específicas..."
            inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
          />

          <RichTextOffsetField
            label="Instrucciones de Acabados"
            fieldKey="instrucciones_acabados"
            value={instruccionesAcabados}
            onChange={setInstruccionesAcabados}
            onFocus={() => setCampoEstiloActivo('instrucciones_acabados')}
            isTextarea={true}
            placeholder="Instrucciones de acabados..."
            inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
          />

          <RichTextOffsetField
            label="Instrucciones de Empacado"
            fieldKey="instrucciones_empacado"
            value={instruccionesEmpacado}
            onChange={setInstruccionesEmpacado}
            onFocus={() => setCampoEstiloActivo('instrucciones_empacado')}
            isTextarea={true}
            placeholder="Instrucciones de empacado..."
            inputClassName="w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
          />
        </div>
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
    </>
  );
};

export default FormularioOrdenOffset;
