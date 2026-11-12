import React from 'react';
import ReactDOM from 'react-dom';

// Información técnica específica por producto (copia independiente del cuadro general)
export interface InfoTecnicaProducto {
  productoIndex: number;
  nombreProducto: string;
  adherencia: string;
  material: string;
  materialUnit: string;
  proveedorMaterial: string;
  impresion: string;
  tipoImpresion: string;
  troquel: string;
  codigoTroquel: string;
  loteMaterial: string;
  loteProduccion: string;
  terminadoEtiqueta: string;
  terminadoUnit: string;
  terminadosEspeciales: string;
  cantidadPorRollo: string;
  observaciones: string;
  mostrarObservaciones: boolean;
  espesor: string;
}

interface ProductoDigital {
  id?: number;
  cantidad: string;
  cod_mg: string;
  cod_cliente: string;
  producto: string;
  avance: string;          // mantenido en BD, oculto en UI
  numero_salida: string;   // por producto (movido desde información técnica)
  gap_horizontal: string;
  medida_ancho: string;
  gap_vertical: string;
  medida_alto: string;
  cavidad: string;
  metros_impresos: string;
  metros_impresos_auto?: boolean;
  tamano_papel_ancho: string;
  tamano_papel_largo: string;
}

type EstiloCampoInfoTecnica = {
  bold: boolean;
  underline: boolean;
  color: string;
};

type EstiloInfoTecnica = Record<string, EstiloCampoInfoTecnica>;

const ESTILO_INFO_TECNICA_DEFAULT: EstiloCampoInfoTecnica = {
  bold: false,
  underline: false,
  color: '#111827',
};

const INFO_TECNICA_COLORS = [
  { color: '#111827', label: 'Negro' },
  { color: '#1d4ed8', label: 'Azul' },
  { color: '#dc2626', label: 'Rojo' },
  { color: '#15803d', label: 'Verde' },
  { color: '#7c3aed', label: 'Morado' },
  { color: '#ea580c', label: 'Naranja' },
  { color: '#0891b2', label: 'Celeste' },
  { color: '#be185d', label: 'Rosa' },
];

const InfoTecnicaFieldLabel: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <label
    className="block text-sm font-medium text-gray-700 mb-1"
    style={{
      color: 'inherit',
      fontWeight: 'inherit',
      textDecoration: 'inherit',
      ...style,
    }}
  >
    {children}
  </label>
);

const RichTextInfoField: React.FC<{
  label: string;
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  placeholder?: string;
  rows?: number;
  isTextarea?: boolean;
  style?: React.CSSProperties;
}> = ({ label, fieldKey, value, onChange, onFocus, placeholder, rows, isTextarea = false, style }) => {
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
      <InfoTecnicaFieldLabel style={style}>{label}</InfoTecnicaFieldLabel>
      <div
        ref={editorRef}
        data-field-key={fieldKey}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={isTextarea
          ? 'w-full min-h-[88px] px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none'
          : 'w-full min-h-[38px] px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'}
        style={{
          color: '#111827',
          whiteSpace: isTextarea ? 'pre-wrap' : 'normal',
        }}
        onFocus={onFocus}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        onMouseUp={onFocus}
        onKeyUp={onFocus}
      />
    </div>
  );
};

interface FormularioOrdenDigitalProps {
  // Información del trabajo
  productos: ProductoDigital[];
  setProductos: (productos: ProductoDigital[]) => void;
  mostrarTotalCantidades: boolean;
  setMostrarTotalCantidades: (value: boolean) => void;
  mostrarTotalMetros: boolean;
  setMostrarTotalMetros: (value: boolean) => void;
  infoTecnicaEstilo: EstiloInfoTecnica;
  setInfoTecnicaEstilo: React.Dispatch<React.SetStateAction<EstiloInfoTecnica>>;
  
  // Información técnica
  adherencia: string;
  setAdherencia: (value: string) => void;
  material: string;
  setMaterial: (value: string) => void;
  proveedorMaterial: string;
  setProveedorMaterial: (value: string) => void;
  impresion: string;
  setImpresion: (value: string) => void;
  tipoImpresion: string;
  setTipoImpresion: (value: string) => void;
  troquel: string;
  setTroquel: (value: string) => void;
  codigoTroquel: string;
  setCodigoTroquel: (value: string) => void;
  loteMaterial: string;
  setLoteMaterial: (value: string) => void;
  loteProduccion: string;
  setLoteProduccion: (value: string) => void;
  terminadoEtiqueta: string;
  setTerminadoEtiqueta: (value: string) => void;
  terminadosEspeciales: string;
  setTerminadosEspeciales: (value: string) => void;
  cantidadPorRollo: string;
  setCantidadPorRollo: (value: string) => void;
  observaciones: string;
  setObservaciones: (value: string) => void;
  mostrarObservacionesGeneral: boolean;
  setMostrarObservacionesGeneral: (value: boolean) => void;
  espesor: string;
  setEspesor: (value: string) => void;
  /** Info técnica específica por producto (estado controlado desde el padre) */
  infoTecnicaProductos: InfoTecnicaProducto[];
  setInfoTecnicaProductos: React.Dispatch<React.SetStateAction<InfoTecnicaProducto[]>>;
}

const FormularioOrdenDigital: React.FC<FormularioOrdenDigitalProps> = ({
  productos,
  setProductos,
  mostrarTotalCantidades,
  setMostrarTotalCantidades,
  mostrarTotalMetros,
  setMostrarTotalMetros,
  infoTecnicaEstilo,
  setInfoTecnicaEstilo,
  adherencia,
  setAdherencia,
  material,
  setMaterial,
  proveedorMaterial,
  setProveedorMaterial,
  impresion,
  setImpresion,
  tipoImpresion,
  setTipoImpresion,
  troquel,
  setTroquel,
  codigoTroquel,
  setCodigoTroquel,
  loteMaterial,
  setLoteMaterial,
  loteProduccion,
  setLoteProduccion,
  terminadoEtiqueta,
  setTerminadoEtiqueta,
  terminadosEspeciales,
  setTerminadosEspeciales,
  cantidadPorRollo,
  setCantidadPorRollo,
  observaciones,
  setObservaciones,
  mostrarObservacionesGeneral,
  setMostrarObservacionesGeneral,
  espesor,
  setEspesor,
  infoTecnicaProductos,
  setInfoTecnicaProductos,
}) => {
  // Asegurar que productos siempre sea un array
  const productosArray = Array.isArray(productos) ? productos : [];
  const totalMetros = productosArray.reduce((acumulado, producto) => {
    const valorNormalizado = String(producto.metros_impresos || '').replace(',', '.').trim();
    const metros = parseFloat(valorNormalizado);
    return acumulado + (Number.isFinite(metros) ? metros : 0);
  }, 0);
  const totalCantidad = productosArray.reduce((acumulado, producto) => {
    const valorNormalizado = String(producto.cantidad || '').replace(',', '.').trim();
    const cantidad = parseFloat(valorNormalizado);
    return acumulado + (Number.isFinite(cantidad) ? cantidad : 0);
  }, 0);
  const totalCantidadDisplay = Number.isInteger(totalCantidad)
    ? String(totalCantidad)
    : totalCantidad.toFixed(2);
  const totalMetrosDisplay = Number.isInteger(totalMetros)
    ? String(totalMetros)
    : totalMetros.toFixed(2);

  // Tamaño de papel global para todos los productos (valores por defecto editables)
  const [tamanoPapelAncho, setTamanoPapelAncho] = React.useState<string>('315');
  const [tamanoPapelLargo, setTamanoPapelLargo] = React.useState<string>('1000');
  const [campoEstiloActivo, setCampoEstiloActivo] = React.useState<string | null>(null);
  const productosContainerRef = React.useRef<HTMLDivElement | null>(null);

  const infoTecnicaTextStyle: React.CSSProperties = {};
  const infoTecnicaHeaderStyle: React.CSSProperties = {};

  const getEstiloCampo = (campo: string): EstiloCampoInfoTecnica => infoTecnicaEstilo[campo] || ESTILO_INFO_TECNICA_DEFAULT;
  const getEstiloCampoCss = (campo: string): React.CSSProperties => {
    const estilo = getEstiloCampo(campo);
    return {
      color: estilo.color,
      fontWeight: estilo.bold ? 700 : 400,
      textDecoration: estilo.underline ? 'underline' : 'none',
    };
  };

  const aplicarEstiloCampo = (campo: string, patch: Partial<EstiloCampoInfoTecnica>) => {
    setInfoTecnicaEstilo((prev) => ({
      ...prev,
      [campo]: {
        ...ESTILO_INFO_TECNICA_DEFAULT,
        ...(prev[campo] ?? {}),
        ...patch,
      },
    }));
  };

  const aplicarEstiloActivo = (patch: Partial<EstiloCampoInfoTecnica>) => {
    if (!campoEstiloActivo) return;
    aplicarEstiloCampo(campoEstiloActivo, patch);
  };

  const estiloActivo = campoEstiloActivo ? getEstiloCampo(campoEstiloActivo) : ESTILO_INFO_TECNICA_DEFAULT;

  const ejecutarFormatoEnCampoActivo = (command: 'bold' | 'underline' | 'foreColor', color?: string) => {
    const campo = campoEstiloActivo;
    if (!campo) return;
    const editor = document.querySelector(`[data-field-key="${campo}"]`) as HTMLDivElement | null;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, color ?? undefined);

    const nextHtml = editor.innerHTML;
    switch (campo) {
      case 'adherencia': setAdherencia(nextHtml); break;
      case 'material': setMaterial(nextHtml); break;
      case 'proveedorMaterial': setProveedorMaterial(nextHtml); break;
      case 'espesor': setEspesor(nextHtml); break;
      case 'loteMaterial': setLoteMaterial(nextHtml); break;
      case 'loteProduccion': setLoteProduccion(nextHtml); break;
      case 'impresion': setImpresion(nextHtml); break;
      case 'tipoImpresion': setTipoImpresion(nextHtml); break;
      case 'troquel': setTroquel(nextHtml); break;
      case 'codigoTroquel': setCodigoTroquel(nextHtml); break;
      case 'terminadoEtiqueta': setTerminadoEtiqueta(nextHtml); break;
      case 'terminadosEspeciales': setTerminadosEspeciales(nextHtml); break;
      case 'cantidadPorRollo': setCantidadPorRollo(nextHtml); break;
      case 'observaciones': setObservaciones(nextHtml); break;
      default: break;
    }
  };

  const infoTecnicaValueStyle: React.CSSProperties = {};

  // Dropdown de acciones por fila de producto (índice del menú abierto, -1 = ninguno)
  const [accionesMenuAbierto, setAccionesMenuAbierto] = React.useState<number>(-1);
  const [accionesMenuPos, setAccionesMenuPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const accionesMenuRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Información técnica específica por producto — controlada desde el padre vía props

  // Cerrar dropdown de acciones al hacer click fuera o al hacer scroll
  React.useEffect(() => {
    if (accionesMenuAbierto === -1) return;
    const close = (e: Event) => {
      // Si el click fue dentro del portal del menú, no cerrar
      const portalEl = document.getElementById('acciones-menu-portal');
      if (portalEl && portalEl.contains(e.target as Node)) return;
      setAccionesMenuAbierto(-1);
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', close);
      document.addEventListener('scroll', close, { capture: true });
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [accionesMenuAbierto]);

  const generarInfoTecnicaProducto = (index: number) => {
    const producto = productosArray[index];
    const nuevaInfo: InfoTecnicaProducto = {
      productoIndex: index,
      nombreProducto: producto?.producto || `Producto ${index + 1}`,
      adherencia: '',
      material: '',
      materialUnit: '',
      proveedorMaterial: '',
      impresion: '',
      tipoImpresion: '',
      troquel: '',
      codigoTroquel: '',
      loteMaterial: '',
      loteProduccion,
      terminadoEtiqueta: '',
      terminadoUnit: '',
      terminadosEspeciales: '',
      cantidadPorRollo: '',
      observaciones: '',
      mostrarObservaciones: true,
      espesor: '',
    };
    setInfoTecnicaProductos((prev) => {
      // Si ya existe una info técnica para este producto, no duplicar
      if (prev.some((it) => it.productoIndex === index)) return prev;
      return [...prev, nuevaInfo];
    });
    setAccionesMenuAbierto(-1);
  };

  const eliminarInfoTecnicaProducto = (productoIndex: number) => {
    setInfoTecnicaProductos((prev) => prev.filter((it) => it.productoIndex !== productoIndex));
  };

  const actualizarInfoTecnicaProducto = (
    productoIndex: number,
    campo: keyof InfoTecnicaProducto,
    valor: string | boolean,
  ) => {
    setInfoTecnicaProductos((prev) =>
      prev.map((it) =>
        it.productoIndex === productoIndex ? { ...it, [campo]: valor } : it,
      ),
    );
  };

  // Adherencia options and dropdown state
  const adherenciaOptions = React.useMemo(() => ['MULTIPROPOSITO','P1', 'P3H', 'P4', 'TERMICO', 'SIN ADH.'], []);
  const [showAdherenciaOptions, setShowAdherenciaOptions] = React.useState<boolean>(false);
  const adherenciaContainerRef = React.useRef<HTMLDivElement | null>(null);
  const adherenciaInputRef = React.useRef<HTMLInputElement | null>(null);

  // Material options and dropdown state
  const MATERIALS = React.useMemo(() => [
    { name: 'PROPALCOTE', display: 'PROPALCOTE (0,045 mm)', unit: '0.045' },
    { name: 'POLIPROPILENO BLANCO MATE', display: 'POLIPROPILENO BLANCO MATE (0,054 mm)', unit: '0.054' },
    { name: 'POLIPROPILENO BLANCO BRILLANTE', display: 'POLIPROPILENO BLANCO BRILLANTE (0,060 mm)', unit: '0.060' },
    { name: 'POLIPROPILENO TRANSPARENTE', display: 'POLIPROPILENO TRANSPARENTE (0,050 mm)', unit: '0.050' },
    { name: 'POLIPROPILENO METALIZADO', display: 'POLIPROPILENO METALIZADO (0,050 mm)', unit: '0.050' },
    { name: 'TERMOENCOGIBLE PVC', display: 'TERMOENCOGIBLE PVC (0,04 mm)', unit: '0.040' },
    { name: 'TERMOENCOGIBLE PET', display: 'TERMOENCOGIBLE PET (0,040 mm)', unit: '0.040' },
    { name: 'CARTULINA METALIZADA', display: 'CARTULINA METALIZADA', unit: '' },
    { name: 'CARTULINA NORMAL', display: 'CARTULINA NORMAL', unit: '' },
    { name: 'BOPP METALIZADO', display: 'BOPP METALIZADO (0,06 mm)', unit: '0.060' },
    { name: 'BOPP BLANCO', display: 'BOPP BLANCO (0,06 mm)', unit: '0.060' },
    { name: 'BOPP TRANSPARENTE', display: 'BOPP TRANSPARENTE (0,06 mm)', unit: '0.060' },
    { name: 'TERMICO DIRECTO PAPEL', display: 'TERMICO DIRECTO PAPEL (0,045 mm)', unit: '0.045' },
    { name: 'TERMICO DIRECTO POLIPROPILENO', display: 'TERMICO DIRECTO POLIPROPILENO (0,054 mm)', unit: '0.054' },
    { name: 'POLIPROPILENO BLANCO FREZZER', display: 'POLIPROPILENO BLANCO FREZZER (0,054 mm)', unit: '0.054' },
  ], []);
  // Terminados (unidad) - mover aquí para evitar uso antes de inicializar
  const TERMINADOS = React.useMemo(() => [
    { name: 'BARNIZ BRILLANTE UV TOTAL', display: 'BARNIZ BRILLANTE UV TOTAL (0,010 mm)', unit: '0.010' },
    { name: 'BARNIZ MATE  UV TOTAL', display: 'BARNIZ MATE  UV TOTAL (0,010 mm)', unit: '0.010' },
    { name: 'BARNIZ BRILLANTE UV  CON RESERVA', display: 'BARNIZ BRILLANTE UV  CON RESERVA (0,010 mm)', unit: '0.010' },
    { name: 'BARNIZ MATE  UV TOTAL CON RESERVA', display: 'BARNIZ MATE  UV TOTAL CON RESERVA (0,010 mm)', unit: '0.010' },
    { name: 'LAMINADO BRILLANTE BIOGLOSS', display: 'LAMINADO BRILLANTE BIOGLOSS (0,028 mm)', unit: '0.028' },
    { name: 'LAMINADO MATE BIOGLOSS', display: 'LAMINADO MATE BIOGLOSS (0,037 mm)', unit: '0.037' },
    { name: 'LAMINADO BRILLANTE BOPP', display: 'LAMINADO BRILLANTE BOPP (0,030 mm)', unit: '0.030' },
    { name: 'LAMINADO MATE BOPP', display: 'LAMINADO MATE BOPP (0,040 mm)', unit: '0.040' },
    { name: 'SIN PROTECCION', display: 'SIN PROTECCION (0 mm)', unit: '0' },
  ], []);
  const [showMaterialOptions, setShowMaterialOptions] = React.useState<boolean>(false);
  const materialContainerRef = React.useRef<HTMLDivElement | null>(null);
  const materialInputRef = React.useRef<HTMLInputElement | null>(null);

  // Cerrar dropdown si se hace click fuera o se presiona Escape
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!adherenciaContainerRef.current) return;
      if (!adherenciaContainerRef.current.contains(e.target as Node)) {
        setShowAdherenciaOptions(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAdherenciaOptions(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const materialDisplay = (() => {
    const found = MATERIALS.find(m => m.name === material);
    return found ? found.display : material;
  })();
  const [materialUnit, setMaterialUnit] = React.useState<string>('');
  const [terminadoUnit, setTerminadoUnit] = React.useState<string>('');

  const computeEspesor = (matUnit: string, termUnit: string) => {
    const m = parseFloat(matUnit || '0') || 0;
    const t = parseFloat(termUnit || '0') || 0;
    const s = m + t;
    return s > 0 ? String(Number(s.toFixed(3))) : '';
  };
  const terminadoDisplay = (() => {
    const found = TERMINADOS.find(t => t.name === terminadoEtiqueta);
    return found ? found.display : terminadoEtiqueta;
  })();

  // Sincronizar unidades locales cuando cambian las props `material` o `terminadoEtiqueta` (por edición)
  React.useEffect(() => {
    const m = MATERIALS.find(x => x.name === material);
    const t = TERMINADOS.find(x => x.name === terminadoEtiqueta);
    const mu = m ? (m.unit || '') : '';
    const tu = t ? (t.unit || '') : '';
    setMaterialUnit(mu);
    setTerminadoUnit(tu);
    const esp = computeEspesor(mu, tu);
    setEspesor(esp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, terminadoEtiqueta]);

  // Troquel options and dropdown state
  const troquelOptions = React.useMemo(() => ['FLEXIBLE', 'PLANO', 'REFILADO'], []);
  const [showTroquelOptions, setShowTroquelOptions] = React.useState<boolean>(false);
  const troquelContainerRef = React.useRef<HTMLDivElement | null>(null);
  const troquelInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onDocClickTroquel = (e: MouseEvent) => {
      if (!troquelContainerRef.current) return;
      if (!troquelContainerRef.current.contains(e.target as Node)) {
        setShowTroquelOptions(false);
      }
    };
    const onKeyTroquel = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTroquelOptions(false);
    };
    document.addEventListener('mousedown', onDocClickTroquel);
    document.addEventListener('keydown', onKeyTroquel);
    return () => {
      document.removeEventListener('mousedown', onDocClickTroquel);
      document.removeEventListener('keydown', onKeyTroquel);
    };
  }, []);

  // Terminado de etiqueta options and dropdown state (con unidad)
  const [showTerminadoOptions, setShowTerminadoOptions] = React.useState<boolean>(false);
  const terminadoContainerRef = React.useRef<HTMLDivElement | null>(null);
  const terminadoInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onDocClickTerm = (e: MouseEvent) => {
      if (!terminadoContainerRef.current) return;
      if (!terminadoContainerRef.current.contains(e.target as Node)) {
        setShowTerminadoOptions(false);
      }
    };
    const onKeyTerm = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowTerminadoOptions(false);
    };
    document.addEventListener('mousedown', onDocClickTerm);
    document.addEventListener('keydown', onKeyTerm);
    return () => {
      document.removeEventListener('mousedown', onDocClickTerm);
      document.removeEventListener('keydown', onKeyTerm);
    };
  }, []);

  // Proveedor de Material options and dropdown state
  const proveedorOptions = React.useMemo(() => [
    'GLOBAL',
    'ARCLAD',
    'FLEXIPACK',
    'FLEXOR',
    'RITRAMA',
    'ARROVIECH',
  ], []);
  const [showProveedorOptions, setShowProveedorOptions] = React.useState<boolean>(false);
  const proveedorContainerRef = React.useRef<HTMLDivElement | null>(null);
  const proveedorInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onDocClickProv = (e: MouseEvent) => {
      if (!proveedorContainerRef.current) return;
      if (!proveedorContainerRef.current.contains(e.target as Node)) {
        setShowProveedorOptions(false);
      }
    };
    const onKeyProv = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowProveedorOptions(false);
    };
    document.addEventListener('mousedown', onDocClickProv);
    document.addEventListener('keydown', onKeyProv);
    return () => {
      document.removeEventListener('mousedown', onDocClickProv);
      document.removeEventListener('keydown', onKeyProv);
    };
  }, []);

  // Impresión options and dropdown state (editable)
  const impresionOptions = React.useMemo(() => ['Nuevo', 'Reimpresion'], []);
  const [showImpresionOptions, setShowImpresionOptions] = React.useState<boolean>(false);
  const impresionContainerRef = React.useRef<HTMLDivElement | null>(null);
  const impresionInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onDocClickImp = (e: MouseEvent) => {
      if (!impresionContainerRef.current) return;
      if (!impresionContainerRef.current.contains(e.target as Node)) {
        setShowImpresionOptions(false);
      }
    };
    const onKeyImp = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowImpresionOptions(false); };
    document.addEventListener('mousedown', onDocClickImp);
    document.addEventListener('keydown', onKeyImp);
    return () => {
      document.removeEventListener('mousedown', onDocClickImp);
      document.removeEventListener('keydown', onKeyImp);
    };
  }, []);

  // Tipo de impresión options and dropdown state (editable)
  const tipoImpresionOptions = React.useMemo(() => ['CMY','CMYK','CMYKW','NEGRO(K)','CMYKW+OV'], []);
  const [showTipoImpresionOptions, setShowTipoImpresionOptions] = React.useState<boolean>(false);
  const tipoImpresionContainerRef = React.useRef<HTMLDivElement | null>(null);
  const tipoImpresionInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const onDocClickTipo = (e: MouseEvent) => {
      if (!tipoImpresionContainerRef.current) return;
      if (!tipoImpresionContainerRef.current.contains(e.target as Node)) {
        setShowTipoImpresionOptions(false);
      }
    };
    const onKeyTipo = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowTipoImpresionOptions(false); };
    document.addEventListener('mousedown', onDocClickTipo);
    document.addEventListener('keydown', onKeyTipo);
    return () => {
      document.removeEventListener('mousedown', onDocClickTipo);
      document.removeEventListener('keydown', onKeyTipo);
    };
  }, []);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!materialContainerRef.current) return;
      if (!materialContainerRef.current.contains(e.target as Node)) {
        setShowMaterialOptions(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMaterialOptions(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Solo sincronizar una vez desde los productos (para órdenes existentes),
  // para no interferir mientras el usuario edita manualmente.
  const haSincronizadoDesdeProductos = React.useRef(false);

  React.useEffect(() => {
    if (haSincronizadoDesdeProductos.current) return;
    if (!Array.isArray(productosArray) || productosArray.length === 0) return;

    const primero = productosArray[0] as any;

    if (primero?.tamano_papel_ancho) {
      setTamanoPapelAncho(String(primero.tamano_papel_ancho));
    }
    if (primero?.tamano_papel_largo) {
      setTamanoPapelLargo(String(primero.tamano_papel_largo));
    }

    haSincronizadoDesdeProductos.current = true;
  }, [productosArray]);

  // Ajustar la altura de los textareas de 'producto' cuando cambian los productos (para contenido precargado)
  React.useEffect(() => {
    if (!productosContainerRef.current) return;
    const areas = productosContainerRef.current.querySelectorAll('textarea');
    areas.forEach((a) => {
      const el = a as HTMLTextAreaElement;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [productosArray]);

  // Calcula cavidad a partir de gap, medidas y tamaño de papel
  const recalcularCavidadObj = (producto: any) => {
    const gapH = parseFloat(producto.gap_horizontal) || 0;
    const ancho = parseFloat(producto.medida_ancho) || 0;
    const gapV = parseFloat(producto.gap_vertical) || 0;
    const alto = parseFloat(producto.medida_alto) || 0;

    const tamanoPapelAnchoVal =
      parseFloat(producto.tamano_papel_ancho) || parseFloat(tamanoPapelAncho) || 0;
    const tamanoPapelLargoVal =
      parseFloat(producto.tamano_papel_largo) || parseFloat(tamanoPapelLargo) || 0;

    // Necesitamos todos los datos > 0 para poder calcular
    if (
      tamanoPapelAnchoVal > 0 &&
      tamanoPapelLargoVal > 0 &&
      ancho + gapH > 0 &&
      alto + gapV > 0
    ) {
      // Fórmula: tamaño papel / (gap + medida)  -> tomamos solo la parte entera
      const piezasAncho = Math.floor(tamanoPapelAnchoVal / (gapH + ancho));
      const piezasAlto = Math.floor(tamanoPapelLargoVal / (gapV + alto));
      const cavidad = piezasAncho * piezasAlto;

      // calcular metros impresos automáticamente salvo que el usuario lo haya editado
      const cantidadNum = parseFloat(producto.cantidad) || 0;
      let metrosImpresosCalc = '';
      if (cavidad > 0 && cantidadNum > 0) {
        const calc = Math.ceil(cantidadNum / cavidad) + 20; // dividir cantidad por cavidad y sumar 20
        metrosImpresosCalc = String(calc);
      }

      return {
        ...producto,
        cavidad: cavidad.toString(),
        tamano_papel_ancho: tamanoPapelAnchoVal.toString(),
        tamano_papel_largo: tamanoPapelLargoVal.toString(),
        // asignar metros_impresos sólo si no se marcó como editado manualmente
        metros_impresos: (producto.metros_impresos_auto === false)
          ? (producto.metros_impresos || '')
          : (metrosImpresosCalc || producto.metros_impresos || ''),
        metros_impresos_auto: (producto.metros_impresos_auto === undefined) ? true : producto.metros_impresos_auto,
      };
    }

    // Si aún no hay datos suficientes, dejamos cavidad vacía
    return { ...producto, cavidad: '' };
  };

  // Cuando cambia el tamaño de papel global, actualizamos todos los productos y recalculamos cavidad
  const actualizarTamanoPapelGlobal = (
    campo: 'tamano_papel_ancho' | 'tamano_papel_largo',
    valor: string,
  ) => {
    if (campo === 'tamano_papel_ancho') setTamanoPapelAncho(valor);
    if (campo === 'tamano_papel_largo') setTamanoPapelLargo(valor);

    const nuevosProductos = productosArray.map((prod) => {
      const actualizado = {
        ...prod,
        [campo]: valor,
      };
      return recalcularCavidadObj(actualizado);
    });

    setProductos(nuevosProductos);
  };

  const agregarProducto = () => {
    setProductos([
      ...productosArray,
      {
        cantidad: '',
        cod_mg: '',
        cod_cliente: '',
        producto: '',
        avance: '',
        numero_salida: '',
        gap_horizontal: '',
        medida_ancho: '',
        gap_vertical: '',
        medida_alto: '',
        cavidad: '',
        metros_impresos: '',
        metros_impresos_auto: true,
        tamano_papel_ancho: tamanoPapelAncho,
        tamano_papel_largo: tamanoPapelLargo,
      },
    ]);
  };

  const eliminarProducto = (index: number) => {
    setProductos(productosArray.filter((_, i) => i !== index));
  };

  const actualizarProducto = (index: number, campo: keyof ProductoDigital, valor: string) => {
    const nuevosProductos = [...productosArray];
    const productoPrev: any = nuevosProductos[index];
    const productoActualizado: any = {
      ...productoPrev,
      [campo]: valor,
      tamano_papel_ancho: tamanoPapelAncho,
      tamano_papel_largo: tamanoPapelLargo,
    };

    // Si el usuario edita manualmente metros_impresos, marcar como manual
    if (campo === 'metros_impresos') {
      productoActualizado.metros_impresos_auto = false;
    }

    nuevosProductos[index] = recalcularCavidadObj(productoActualizado);
    setProductos(nuevosProductos);
  };

  return (
    <>
      {/* Información del Trabajo - Tabla de Productos */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        {/* container ref used to adjust textarea heights for producto field */}
        <div ref={productosContainerRef}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-lg font-bold text-gray-800 whitespace-nowrap">
              Información del Trabajo
            </h3>
            <div className="flex items-center gap-2 overflow-hidden rounded border border-gray-200 bg-gray-50 px-2 py-1">
              <img
                src="/img/salidas.png"
                alt="Referencia de salidas"
                className="-my-1 h-12 w-auto max-w-none object-contain"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">Ref. salidas (1-4)</span>
            </div>
          </div>
          {/* Tamaño de papel en la misma fila */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 whitespace-nowrap">Tamaño papel:</span>
            <span className="text-sm">Ancho</span>
            <input
              type="number"
              min="0"
              step="any"
              className="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
              placeholder="mm"
              value={tamanoPapelAncho}
              onChange={(e) => actualizarTamanoPapelGlobal('tamano_papel_ancho', e.target.value)}
            />
            <span className="text-sm">Largo</span>
            <input
              type="number"
              min="0"
              step="any"
              className="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
              placeholder="mm"
              value={tamanoPapelLargo}
              onChange={(e) => actualizarTamanoPapelGlobal('tamano_papel_largo', e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={agregarProducto}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            + Agregar Producto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Cantidad</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Cod MG</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Cod Cliente</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Producto</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Gap Horizontal (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Medida Ancho (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Gap Vertical (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Medida Alto (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Cavidad</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Metros Impresos</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Nº Salida</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosArray.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-2 py-4 text-center text-gray-500 border border-gray-300">
                    No hay productos agregados. Haz clic en "Agregar Producto" para comenzar.
                  </td>
                </tr>
              ) : (
                productosArray.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.cantidad}
                        onChange={(e) => actualizarProducto(index, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-24 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.cod_mg}
                        onChange={(e) => actualizarProducto(index, 'cod_mg', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-24 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.cod_cliente}
                        onChange={(e) => actualizarProducto(index, 'cod_cliente', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <textarea
                        rows={1}
                        className="w-full min-w-[150px] px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
                        value={producto.producto}
                        onChange={(e) => {
                          actualizarProducto(index, 'producto', e.target.value);
                          // adjust height
                          const el = e.target as HTMLTextAreaElement;
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }}
                        onInput={(e) => {
                          const el = e.target as HTMLTextAreaElement;
                          el.style.height = 'auto';
                          el.style.height = `${el.scrollHeight}px`;
                        }}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.gap_horizontal}
                        onChange={(e) => actualizarProducto(index, 'gap_horizontal', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.medida_ancho}
                        onChange={(e) => actualizarProducto(index, 'medida_ancho', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.gap_vertical}
                        onChange={(e) => actualizarProducto(index, 'gap_vertical', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.medida_alto}
                        onChange={(e) => actualizarProducto(index, 'medida_alto', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.cavidad}
                        onChange={(e) => actualizarProducto(index, 'cavidad', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-24 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.metros_impresos}
                        onChange={(e) => actualizarProducto(index, 'metros_impresos', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-16 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                        value={producto.numero_salida || ''}
                        onChange={(e) => actualizarProducto(index, 'numero_salida', e.target.value)}
                        placeholder="1-4"
                        maxLength={1}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300 text-center">
                      <div
                        className="relative inline-block"
                        ref={(el) => { accionesMenuRefs.current[index] = el; }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            if (accionesMenuAbierto === index) {
                              setAccionesMenuAbierto(-1);
                              return;
                            }
                            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                            setAccionesMenuPos({
                              top: rect.bottom + window.scrollY + 4,
                              left: rect.right + window.scrollX - 208, // 208 = w-52
                            });
                            setAccionesMenuAbierto(index);
                          }}
                          className="p-1.5 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors text-gray-600"
                          title="Acciones"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <circle cx="10" cy="4" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="10" cy="16" r="1.5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-start">
          <div className="grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={mostrarTotalCantidades}
                  onChange={(e) => setMostrarTotalCantidades(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mostrar total de cantidades
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de Cantidades
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                value={totalCantidadDisplay}
                disabled={!mostrarTotalCantidades}
                readOnly
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={mostrarTotalMetros}
                  onChange={(e) => setMostrarTotalMetros(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mostrar total de metros
              </label>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de Metros
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
                value={totalMetrosDisplay}
                disabled={!mostrarTotalMetros}
                readOnly
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Información Técnica */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-col gap-3 mb-4 pb-2 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-gray-800" style={infoTecnicaHeaderStyle}>
            Información Técnica
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                ejecutarFormatoEnCampoActivo('bold');
                aplicarEstiloActivo({ bold: !estiloActivo.bold });
              }}
              className={`px-2.5 py-1 rounded border text-sm font-bold ${estiloActivo.bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
              title="Negrita"
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                ejecutarFormatoEnCampoActivo('underline');
                aplicarEstiloActivo({ underline: !estiloActivo.underline });
              }}
              className={`px-2.5 py-1 rounded border text-sm font-semibold underline ${estiloActivo.underline ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
              title="Subrayado"
            >
              U
            </button>
            <div className="flex items-center gap-1 flex-wrap pl-1">
              {INFO_TECNICA_COLORS.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  aria-label={label}
                  title={label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    ejecutarFormatoEnCampoActivo('foreColor', color);
                    aplicarEstiloActivo({ color });
                  }}
                  className="w-5 h-5 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: estiloActivo.color === color ? '#1d4ed8' : 'transparent',
                    boxShadow: estiloActivo.color === color ? '0 0 0 2px #fff, 0 0 0 4px #1d4ed8' : 'none',
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
                  value={estiloActivo.color}
                  onChange={(e) => {
                    aplicarEstiloActivo({ color: e.target.value });
                    ejecutarFormatoEnCampoActivo('foreColor', e.target.value);
                  }}
                />
                <span className="text-[10px] text-gray-500">✦</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={infoTecnicaValueStyle}>
          {/* Adherencia: editable combo with explicit dropdown button */}
          <div className="relative" ref={adherenciaContainerRef}>
            <div className="flex">
              <div className="flex-1">
                <RichTextInfoField
                  label="Adherencia"
                  fieldKey="adherencia"
                  value={adherencia}
                  onChange={setAdherencia}
                  onFocus={() => setCampoEstiloActivo('adherencia')}
                  placeholder="Seleccionar o escribir..."
                  style={infoTecnicaTextStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAdherenciaOptions((s) => {
                  const next = !s;
                  if (next && adherenciaInputRef.current) adherenciaInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50 self-end mb-0.5"
                aria-label="Mostrar opciones de adherencia"
              >
                ▾
              </button>
            </div>
            {showAdherenciaOptions && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
                {adherenciaOptions.map((opt) => (
                  <li
                    key={opt}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setAdherencia(opt); setShowAdherenciaOptions(false); }}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Material: editable combo with dropdown */}
          <div className="relative" ref={materialContainerRef}>
            <div className="flex">
              <div className="flex-1">
                <RichTextInfoField
                  label="Material"
                  fieldKey="material"
                  value={materialDisplay}
                  onChange={(next) => { setMaterial(next); setMaterialUnit(''); const esp = computeEspesor('', terminadoUnit); setEspesor(esp); }}
                  onFocus={() => setCampoEstiloActivo('material')}
                  placeholder="Seleccionar o escribir..."
                  style={infoTecnicaTextStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialOptions((s) => {
                  const next = !s;
                  if (next && materialInputRef.current) materialInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50 self-end mb-0.5"
                aria-label="Mostrar opciones de material"
              >
                ▾
              </button>
            </div>
            {showMaterialOptions && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
                {MATERIALS.map((opt) => (
                  <li
                    key={opt.name}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setMaterial(opt.name); setMaterialUnit(opt.unit || ''); const esp = computeEspesor(opt.unit || '', terminadoUnit); setEspesor(esp); setShowMaterialOptions(false); }}
                  >
                    {opt.display}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Proveedor de Material: editable combo */}
          <div className="relative" ref={proveedorContainerRef}>
            <div className="flex">
              <div className="flex-1">
                <RichTextInfoField
                  label="Proveedor de Material"
                  fieldKey="proveedorMaterial"
                  value={proveedorMaterial}
                  onChange={setProveedorMaterial}
                  onFocus={() => setCampoEstiloActivo('proveedorMaterial')}
                  placeholder="Seleccionar o escribir..."
                  style={infoTecnicaTextStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowProveedorOptions((s) => {
                  const next = !s;
                  if (next && proveedorInputRef.current) proveedorInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50 self-end mb-0.5"
                aria-label="Mostrar opciones de proveedor"
              >
                ▾
              </button>
            </div>
            {showProveedorOptions && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
                {proveedorOptions.map((opt) => (
                  <li
                    key={opt}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setProveedorMaterial(opt); setShowProveedorOptions(false); }}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Espesor */}
          <div>
            <RichTextInfoField
              label="Espesor"
              fieldKey="espesor"
              value={espesor}
              onChange={setEspesor}
              onFocus={() => setCampoEstiloActivo('espesor')}
              placeholder="mm"
              style={infoTecnicaTextStyle}
            />
          </div>

          {/* Lote Material/Codigo Material */}
          <div>
            <RichTextInfoField
              label="Lote Material/Codigo Material"
              fieldKey="loteMaterial"
              value={loteMaterial}
              onChange={setLoteMaterial}
              onFocus={() => setCampoEstiloActivo('loteMaterial')}
              style={infoTecnicaTextStyle}
            />
          </div>

          {/* Lote de Producción */}
          <div>
            <RichTextInfoField
              label="Lote de Producción"
              fieldKey="loteProduccion"
              value={loteProduccion}
              onChange={setLoteProduccion}
              onFocus={() => setCampoEstiloActivo('loteProduccion')}
              style={infoTecnicaTextStyle}
            />
          </div>

          {/* Impresión (editable combo) */}
          <div ref={impresionContainerRef} className="relative">
            <div className="flex">
              <div className="flex-1">
                <RichTextInfoField
                  label="Impresión"
                  fieldKey="impresion"
                  value={impresion}
                  onChange={setImpresion}
                  onFocus={() => setCampoEstiloActivo('impresion')}
                  placeholder="Seleccione opción"
                  style={infoTecnicaTextStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => { setShowImpresionOptions(s => !s); impresionInputRef.current?.focus(); }}
                className="px-2 py-1 border border-gray-300 rounded-r bg-gray-50 self-end mb-0.5"
              >▾</button>
            </div>
            {showImpresionOptions && (
              <ul className="absolute z-20 left-0 right-0 mt-1 border border-gray-200 bg-white rounded max-h-40 overflow-auto">
                {impresionOptions.map(opt => (
                  <li key={opt} onClick={() => { setImpresion(opt); setShowImpresionOptions(false); }} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-center">{opt}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Tipo de Impresión (editable combo) */}
          <div ref={tipoImpresionContainerRef} className="relative">
            <div className="flex">
              <div className="flex-1">
                <RichTextInfoField
                  label="Tipo de Impresión"
                  fieldKey="tipoImpresion"
                  value={tipoImpresion}
                  onChange={setTipoImpresion}
                  onFocus={() => setCampoEstiloActivo('tipoImpresion')}
                  placeholder="Seleccione opción"
                  style={infoTecnicaTextStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => { setShowTipoImpresionOptions(s => !s); tipoImpresionInputRef.current?.focus(); }}
                className="px-2 py-1 border border-gray-300 rounded-r bg-gray-50 self-end mb-0.5"
              >▾</button>
            </div>
            {showTipoImpresionOptions && (
              <ul className="absolute z-20 left-0 right-0 mt-1 border border-gray-200 bg-white rounded max-h-40 overflow-auto">
                {tipoImpresionOptions.map(opt => (
                  <li key={opt} onClick={() => { setTipoImpresion(opt); setShowTipoImpresionOptions(false); }} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-center">{opt}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Troquel: editable combo */}
          <div className="relative" ref={troquelContainerRef}>
            <div className="flex">
              <div className="flex-1">
                <RichTextInfoField
                  label="Troquel"
                  fieldKey="troquel"
                  value={troquel}
                  onChange={setTroquel}
                  onFocus={() => setCampoEstiloActivo('troquel')}
                  placeholder="Seleccionar o escribir..."
                  style={infoTecnicaTextStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowTroquelOptions((s) => {
                  const next = !s;
                  if (next && troquelInputRef.current) troquelInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50 self-end mb-0.5"
                aria-label="Mostrar opciones de troquel"
              >
                ▾
              </button>
            </div>
            {showTroquelOptions && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
                {troquelOptions.map((opt) => (
                  <li
                    key={opt}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setTroquel(opt); setShowTroquelOptions(false); }}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Código Troquel */}
          <div>
            <RichTextInfoField
              label="Código Troquel"
              fieldKey="codigoTroquel"
              value={codigoTroquel}
              onChange={setCodigoTroquel}
              onFocus={() => setCampoEstiloActivo('codigoTroquel')}
              style={infoTecnicaTextStyle}
            />
          </div>

          {/* Terminado de Etiqueta: editable combo */}
          <div className="relative" ref={terminadoContainerRef}>
            <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Terminado de Etiqueta</InfoTecnicaFieldLabel>
            <div className="flex">
              <input
                ref={terminadoInputRef}
                placeholder="Seleccionar o escribir..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={getEstiloCampoCss('terminadoEtiqueta')}
                value={terminadoDisplay}
                onChange={(e) => { setTerminadoEtiqueta(e.target.value); setTerminadoUnit(''); const esp = computeEspesor(materialUnit, ''); setEspesor(esp); }}
                onFocus={() => setCampoEstiloActivo('terminadoEtiqueta')}
              />
              <button
                type="button"
                onClick={() => setShowTerminadoOptions((s) => {
                  const next = !s;
                  if (next && terminadoInputRef.current) terminadoInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50"
                aria-label="Mostrar opciones de terminado"
              >
                ▾
              </button>
            </div>
            {showTerminadoOptions && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
                {TERMINADOS.map((opt) => (
                  <li
                    key={opt.name}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setTerminadoEtiqueta(opt.name); setTerminadoUnit(opt.unit || ''); const esp = computeEspesor(materialUnit, opt.unit || ''); setEspesor(esp); setShowTerminadoOptions(false); }}
                  >
                    {opt.display}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Terminados Especiales */}
          <div>
            <RichTextInfoField
              label="Terminados Especiales"
              fieldKey="terminadosEspeciales"
              value={terminadosEspeciales}
              onChange={setTerminadosEspeciales}
              onFocus={() => setCampoEstiloActivo('terminadosEspeciales')}
              style={infoTecnicaTextStyle}
            />
          </div>

          {/* Cantidad por Rollo */}
          <div>
            <RichTextInfoField
              label="Cantidad por Rollo"
              fieldKey="cantidadPorRollo"
              value={cantidadPorRollo}
              onChange={setCantidadPorRollo}
              onFocus={() => setCampoEstiloActivo('cantidadPorRollo')}
              style={infoTecnicaTextStyle}
            />
          </div>

        </div>

        {/* Observaciones */}
        <div className="mt-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={mostrarObservacionesGeneral}
              onChange={(e) => setMostrarObservacionesGeneral(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Mostrar observaciones en PDF
          </label>
          <RichTextInfoField
            label="Observaciones"
            fieldKey="observaciones"
            value={observaciones}
            onChange={setObservaciones}
            onFocus={() => setCampoEstiloActivo('observaciones')}
            placeholder="Observaciones adicionales sobre la orden..."
            rows={3}
            isTextarea
            style={infoTecnicaTextStyle}
          />
        </div>
      </div>

      {/* Información Técnica específica por producto */}
      {infoTecnicaProductos.map((info) => (
        <InfoTecnicaProductoCard
          key={info.productoIndex}
          info={info}
          MATERIALS={MATERIALS}
          TERMINADOS={TERMINADOS}
          adherenciaOptions={adherenciaOptions}
          troquelOptions={troquelOptions}
          proveedorOptions={proveedorOptions}
          impresionOptions={impresionOptions}
          tipoImpresionOptions={tipoImpresionOptions}
          onChange={actualizarInfoTecnicaProducto}
          onEliminar={eliminarInfoTecnicaProducto}
          infoTecnicaHeaderStyle={infoTecnicaHeaderStyle}
          infoTecnicaValueStyle={infoTecnicaValueStyle}
          infoTecnicaTextStyle={infoTecnicaTextStyle}
          infoTecnicaEstilo={infoTecnicaEstilo}
          setInfoTecnicaEstilo={setInfoTecnicaEstilo}
          onFieldFocus={setCampoEstiloActivo}
        />
      ))}

      {/* Portal: menú de acciones flotante, se renderiza sobre toda la UI */}
      {accionesMenuAbierto !== -1 && ReactDOM.createPortal(
        <div
          id="acciones-menu-portal"
          style={{
            position: 'absolute',
            top: accionesMenuPos.top,
            left: accionesMenuPos.left,
            zIndex: 9999,
            width: '13rem',
          }}
          className="bg-white border border-gray-200 rounded shadow-xl overflow-hidden"
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              const idx = accionesMenuAbierto;
              setAccionesMenuAbierto(-1);
              generarInfoTecnicaProducto(idx);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar información técnica
          </button>
          <div className="border-t border-gray-100" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              const idx = accionesMenuAbierto;
              setAccionesMenuAbierto(-1);
              eliminarProducto(idx);
              eliminarInfoTecnicaProducto(idx);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>,
        document.body,
      )}
    </>
  );
};

// Subcomponente para cada cuadro de Información Técnica específica por producto
interface InfoTecnicaProductoCardProps {
  info: InfoTecnicaProducto;
  MATERIALS: { name: string; display: string; unit: string }[];
  TERMINADOS: { name: string; display: string; unit: string }[];
  adherenciaOptions: string[];
  troquelOptions: string[];
  proveedorOptions: string[];
  impresionOptions: string[];
  tipoImpresionOptions: string[];
  onChange: (productoIndex: number, campo: keyof InfoTecnicaProducto, valor: string | boolean) => void;
  onEliminar: (productoIndex: number) => void;
  infoTecnicaHeaderStyle: React.CSSProperties;
  infoTecnicaValueStyle: React.CSSProperties;
  infoTecnicaTextStyle: React.CSSProperties;
  infoTecnicaEstilo: EstiloInfoTecnica;
  setInfoTecnicaEstilo: React.Dispatch<React.SetStateAction<EstiloInfoTecnica>>;
  onFieldFocus: (field: string) => void;
}

const InfoTecnicaProductoCard: React.FC<InfoTecnicaProductoCardProps> = ({
  info,
  MATERIALS,
  TERMINADOS,
  adherenciaOptions,
  troquelOptions,
  proveedorOptions,
  impresionOptions,
  tipoImpresionOptions,
  onChange,
  onEliminar,
  infoTecnicaHeaderStyle,
  infoTecnicaValueStyle,
  infoTecnicaTextStyle,
  infoTecnicaEstilo,
  setInfoTecnicaEstilo,
  onFieldFocus,
}) => {
  const [showAdherencia, setShowAdherencia] = React.useState(false);
  const [showMaterial, setShowMaterial] = React.useState(false);
  const [showProveedor, setShowProveedor] = React.useState(false);
  const [showImpresion, setShowImpresion] = React.useState(false);
  const [showTipoImpresion, setShowTipoImpresion] = React.useState(false);
  const [showTroquel, setShowTroquel] = React.useState(false);
  const [showTerminado, setShowTerminado] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowAdherencia(false);
        setShowMaterial(false);
        setShowProveedor(false);
        setShowImpresion(false);
        setShowTipoImpresion(false);
        setShowTroquel(false);
        setShowTerminado(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const computeEspesor = (matUnit: string, termUnit: string) => {
    const m = parseFloat(matUnit || '0') || 0;
    const t = parseFloat(termUnit || '0') || 0;
    const s = m + t;
    return s > 0 ? String(Number(s.toFixed(3))) : '';
  };

  const materialDisplay = MATERIALS.find((m) => m.name === info.material)?.display ?? info.material;
  const terminadoDisplay = TERMINADOS.find((t) => t.name === info.terminadoEtiqueta)?.display ?? info.terminadoEtiqueta;

  const getEstiloCampo = (campo: string): EstiloCampoInfoTecnica => infoTecnicaEstilo[campo] || ESTILO_INFO_TECNICA_DEFAULT;
  const getEstiloCampoCss = (campo: string): React.CSSProperties => {
    const estilo = getEstiloCampo(campo);
    return {
      color: estilo.color,
      fontWeight: estilo.bold ? 700 : 400,
      textDecoration: estilo.underline ? 'underline' : 'none',
    };
  };
  const aplicarEstiloCampo = (campo: string, patch: Partial<EstiloCampoInfoTecnica>) => {
    setInfoTecnicaEstilo((prev) => ({
      ...prev,
      [campo]: {
        ...ESTILO_INFO_TECNICA_DEFAULT,
        ...(prev[campo] ?? {}),
        ...patch,
      },
    }));
  };

  const set = (campo: Exclude<keyof InfoTecnicaProducto, 'mostrarObservaciones'>) => (valor: string) =>
    onChange(info.productoIndex, campo, valor);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-400">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800" style={infoTecnicaHeaderStyle}>
          Información Técnica{' '}
          <span style={infoTecnicaHeaderStyle}>— {info.nombreProducto || `Producto ${info.productoIndex + 1}`}</span>
        </h3>
        <button
          type="button"
          onClick={() => onEliminar(info.productoIndex)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
          title="Eliminar información técnica específica"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Quitar
        </button>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={infoTecnicaValueStyle}>
        {/* Adherencia */}
        <div className="relative">
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Adherencia</InfoTecnicaFieldLabel>
          <div className="flex">
            <input
              placeholder="Seleccionar o escribir..."
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={getEstiloCampoCss(`producto_${info.productoIndex}_adherencia`)}
              value={info.adherencia}
              onChange={(e) => set('adherencia')(e.target.value)}
              onFocus={() => onFieldFocus(`producto_${info.productoIndex}_adherencia`)}
            />
            <button type="button" onClick={() => setShowAdherencia((s) => !s)}
              className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50">▾</button>
          </div>
          {showAdherencia && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
              {adherenciaOptions.map((opt) => (
                <li key={opt} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={(e) => { e.preventDefault(); set('adherencia')(opt); setShowAdherencia(false); }}>{opt}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Material */}
        <div className="relative">
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Material</InfoTecnicaFieldLabel>
          <div className="flex">
            <input
              placeholder="Seleccionar o escribir..."
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={getEstiloCampoCss(`producto_${info.productoIndex}_material`)}
              value={materialDisplay}
              onChange={(e) => { set('material')(e.target.value); set('materialUnit')(''); set('espesor')(computeEspesor('', info.terminadoUnit)); }}
              onFocus={() => onFieldFocus(`producto_${info.productoIndex}_material`)}
            />
            <button type="button" onClick={() => setShowMaterial((s) => !s)}
              className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50">▾</button>
          </div>
          {showMaterial && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
              {MATERIALS.map((opt) => (
                <li key={opt.name} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    set('material')(opt.name);
                    set('materialUnit')(opt.unit || '');
                    set('espesor')(computeEspesor(opt.unit || '', info.terminadoUnit));
                    setShowMaterial(false);
                  }}>{opt.display}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Proveedor de Material */}
        <div className="relative">
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Proveedor de Material</InfoTecnicaFieldLabel>
          <div className="flex">
            <input
              placeholder="Seleccionar o escribir..."
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={getEstiloCampoCss(`producto_${info.productoIndex}_proveedorMaterial`)}
              value={info.proveedorMaterial}
              onChange={(e) => set('proveedorMaterial')(e.target.value)}
              onFocus={() => onFieldFocus(`producto_${info.productoIndex}_proveedorMaterial`)}
            />
            <button type="button" onClick={() => setShowProveedor((s) => !s)}
              className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50">▾</button>
          </div>
          {showProveedor && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
              {proveedorOptions.map((opt) => (
                <li key={opt} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={(e) => { e.preventDefault(); set('proveedorMaterial')(opt); setShowProveedor(false); }}>{opt}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Espesor */}
        <div>
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Espesor</InfoTecnicaFieldLabel>
          <input type="text" placeholder="mm"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={getEstiloCampoCss(`producto_${info.productoIndex}_espesor`)}
            value={info.espesor}
            onChange={(e) => set('espesor')(e.target.value)}
            onFocus={() => onFieldFocus(`producto_${info.productoIndex}_espesor`)}
          />
        </div>

        {/* Lote Material */}
        <div>
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Lote Material/Codigo Material</InfoTecnicaFieldLabel>
          <input type="text"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={getEstiloCampoCss(`producto_${info.productoIndex}_loteMaterial`)}
            value={info.loteMaterial}
            onChange={(e) => set('loteMaterial')(e.target.value)}
            onFocus={() => onFieldFocus(`producto_${info.productoIndex}_loteMaterial`)}
          />
        </div>

        {/* Lote de Producción */}
        <div>
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Lote de Producción</InfoTecnicaFieldLabel>
          <input type="text"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={getEstiloCampoCss(`producto_${info.productoIndex}_loteProduccion`)}
            value={info.loteProduccion}
            onChange={(e) => set('loteProduccion')(e.target.value)}
            onFocus={() => onFieldFocus(`producto_${info.productoIndex}_loteProduccion`)}
          />
        </div>

        {/* Impresión */}
        <div className="relative">
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Impresión</InfoTecnicaFieldLabel>
          <div className="flex">
            <input placeholder="Seleccione opción"
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
              style={getEstiloCampoCss(`producto_${info.productoIndex}_impresion`)}
              value={info.impresion}
              onChange={(e) => set('impresion')(e.target.value)}
              onFocus={() => onFieldFocus(`producto_${info.productoIndex}_impresion`)}
            />
            <button type="button" onClick={() => setShowImpresion((s) => !s)}
              className="px-2 py-1 border border-gray-300 rounded-r bg-gray-50">▾</button>
          </div>
          {showImpresion && (
            <ul className="absolute z-20 left-0 right-0 mt-1 border border-gray-200 bg-white rounded max-h-40 overflow-auto">
              {impresionOptions.map((opt) => (
                <li key={opt} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-center"
                  onClick={() => { set('impresion')(opt); setShowImpresion(false); }}>{opt}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Tipo de Impresión */}
        <div className="relative">
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Tipo de Impresión</InfoTecnicaFieldLabel>
          <div className="flex">
            <input placeholder="Seleccione opción"
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
              style={getEstiloCampoCss(`producto_${info.productoIndex}_tipoImpresion`)}
              value={info.tipoImpresion}
              onChange={(e) => set('tipoImpresion')(e.target.value)}
              onFocus={() => onFieldFocus(`producto_${info.productoIndex}_tipoImpresion`)}
            />
            <button type="button" onClick={() => setShowTipoImpresion((s) => !s)}
              className="px-2 py-1 border border-gray-300 rounded-r bg-gray-50">▾</button>
          </div>
          {showTipoImpresion && (
            <ul className="absolute z-20 left-0 right-0 mt-1 border border-gray-200 bg-white rounded max-h-40 overflow-auto">
              {tipoImpresionOptions.map((opt) => (
                <li key={opt} className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-center"
                  onClick={() => { set('tipoImpresion')(opt); setShowTipoImpresion(false); }}>{opt}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Troquel */}
        <div className="relative">
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Troquel</InfoTecnicaFieldLabel>
          <div className="flex">
            <input placeholder="Seleccionar o escribir..."
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={getEstiloCampoCss(`producto_${info.productoIndex}_troquel`)}
              value={info.troquel}
              onChange={(e) => set('troquel')(e.target.value)}
              onFocus={() => onFieldFocus(`producto_${info.productoIndex}_troquel`)}
            />
            <button type="button" onClick={() => setShowTroquel((s) => !s)}
              className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50">▾</button>
          </div>
          {showTroquel && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-40 overflow-auto">
              {troquelOptions.map((opt) => (
                <li key={opt} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={(e) => { e.preventDefault(); set('troquel')(opt); setShowTroquel(false); }}>{opt}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Código Troquel */}
        <div>
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Código Troquel</InfoTecnicaFieldLabel>
          <input type="text"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={getEstiloCampoCss(`producto_${info.productoIndex}_codigoTroquel`)}
            value={info.codigoTroquel}
            onChange={(e) => set('codigoTroquel')(e.target.value)}
            onFocus={() => onFieldFocus(`producto_${info.productoIndex}_codigoTroquel`)}
          />
        </div>

        {/* Terminado de Etiqueta */}
        <div className="relative">
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Terminado de Etiqueta</InfoTecnicaFieldLabel>
          <div className="flex">
            <input placeholder="Seleccionar o escribir..."
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={getEstiloCampoCss(`producto_${info.productoIndex}_terminadoEtiqueta`)}
              value={terminadoDisplay}
              onChange={(e) => { set('terminadoEtiqueta')(e.target.value); set('terminadoUnit')(''); set('espesor')(computeEspesor(info.materialUnit, '')); }}
              onFocus={() => onFieldFocus(`producto_${info.productoIndex}_terminadoEtiqueta`)}
            />
            <button type="button" onClick={() => setShowTerminado((s) => !s)}
              className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50">▾</button>
          </div>
          {showTerminado && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
              {TERMINADOS.map((opt) => (
                <li key={opt.name} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    set('terminadoEtiqueta')(opt.name);
                    set('terminadoUnit')(opt.unit || '');
                    set('espesor')(computeEspesor(info.materialUnit, opt.unit || ''));
                    setShowTerminado(false);
                  }}>{opt.display}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Terminados Especiales */}
        <div>
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Terminados Especiales</InfoTecnicaFieldLabel>
          <input type="text"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={getEstiloCampoCss(`producto_${info.productoIndex}_terminadosEspeciales`)}
            value={info.terminadosEspeciales}
            onChange={(e) => set('terminadosEspeciales')(e.target.value)}
            onFocus={() => onFieldFocus(`producto_${info.productoIndex}_terminadosEspeciales`)}
          />
        </div>

        {/* Cantidad por Rollo */}
        <div>
          <InfoTecnicaFieldLabel style={infoTecnicaTextStyle}>Cantidad por Rollo</InfoTecnicaFieldLabel>
          <input type="text"
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={getEstiloCampoCss(`producto_${info.productoIndex}_cantidadPorRollo`)}
            value={info.cantidadPorRollo}
            onChange={(e) => set('cantidadPorRollo')(e.target.value)}
            onFocus={() => onFieldFocus(`producto_${info.productoIndex}_cantidadPorRollo`)}
          />
        </div>
      </div>

      {/* Observaciones */}
      <div className="mt-4">
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={info.mostrarObservaciones}
            onChange={(e) => onChange(info.productoIndex, 'mostrarObservaciones', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Mostrar observaciones en PDF
        </label>
        <InfoTecnicaFieldLabel>Observaciones</InfoTecnicaFieldLabel>
        <textarea
          className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          style={getEstiloCampoCss(`producto_${info.productoIndex}_observaciones`)}
          rows={3}
          value={info.observaciones}
          onChange={(e) => set('observaciones')(e.target.value)}
          onFocus={() => onFieldFocus(`producto_${info.productoIndex}_observaciones`)}
          placeholder="Observaciones adicionales sobre la orden..."
        />
      </div>
    </div>
  );
};

export default FormularioOrdenDigital;
