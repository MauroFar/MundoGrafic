import React from 'react';

interface ProductoDigital {
  id?: number;
  cantidad: string;
  cod_mg: string;
  cod_cliente: string;
  producto: string;
  avance: string;
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

interface FormularioOrdenDigitalProps {
  // Información del trabajo
  productos: ProductoDigital[];
  setProductos: (productos: ProductoDigital[]) => void;
  
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
  numeroSalida: string;
  setNumeroSalida: (value: string) => void;
  espesor: string;
  setEspesor: (value: string) => void;
}

const FormularioOrdenDigital: React.FC<FormularioOrdenDigitalProps> = ({
  productos,
  setProductos,
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
  numeroSalida,
  setNumeroSalida,
  espesor,
  setEspesor,
}) => {
  // Asegurar que productos siempre sea un array
  const productosArray = Array.isArray(productos) ? productos : [];

  // Tamaño de papel global para todos los productos (valores por defecto editables)
  const [tamanoPapelAncho, setTamanoPapelAncho] = React.useState<string>('315');
  const [tamanoPapelLargo, setTamanoPapelLargo] = React.useState<string>('1000');

  // Adherencia options and dropdown state
  const adherenciaOptions = React.useMemo(() => ['MULTIPROPOSITO','P1', 'P3H', 'P4', 'TERMICO', 'SIN ADH.'], []);
  const [showAdherenciaOptions, setShowAdherenciaOptions] = React.useState<boolean>(false);
  const adherenciaContainerRef = React.useRef<HTMLDivElement | null>(null);
  const adherenciaInputRef = React.useRef<HTMLInputElement | null>(null);

  // Material options and dropdown state
  const materialOptions = React.useMemo(() => [
    'PROPALCOTE',
    'POLIPROPILENO BLANCO MATE',
    'POLIPROPILENO BLANCO BRILLANTE',
    'POLIPROPILENO TRANSPARENTE',
    'POLIPROPILENO METALIZADO',
    'TERMOENCOGIBLE PVC',
    'TERMOENCOGIBLE PET',
    'CARTULINA METALIZADA',
    'CARTULINA NORMAL',
    'BOPP METALIZADO',
    'BOPP BLANCO',
    'BOPP TRANSPARENTE',
    'TERMICO DIRECTO PAPEL',
    'TERMICO DIRECTO POLIPROPILENO',
    'POLIPROPILENO BLANCO FREZZER',
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

  // Terminado de etiqueta options and dropdown state
  const terminadoOptions = React.useMemo(() => [
    'BARNIZ BRILLANTE UV TOTAL',
    'BARNIZ MATE  UV TOTAL',
    'BARNIZ BRILLANTE UV  CON RESERVA',
    'BARNIZ MATE  UV TOTAL CON RESERVA',
    'LAMINADO BRILLANTE BIOGLOSS',
    'LAMINADO MATE BIOGLOSS',
    'LAMINADO BRILLANTE BOPP',
    'LAMINADO MATE BOPP',
    'SIN PROTECCION',
  ], []);
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">
            Información del Trabajo
          </h3>
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
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Avance (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Gap Horizontal (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Medida Ancho (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Gap Vertical (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Medida Alto (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Cavidad</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Metros Impresos</th>
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
                      <input
                        type="text"
                        className="w-full min-w-[150px] px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.producto}
                        onChange={(e) => actualizarProducto(index, 'producto', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 border border-gray-300">
                      <input
                        type="text"
                        className="w-20 px-1 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={producto.avance}
                        onChange={(e) => actualizarProducto(index, 'avance', e.target.value)}
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
                    <td className="px-2 py-2 border border-gray-300 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarProducto(index)}
                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información Técnica */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
          Información Técnica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Adherencia: editable combo with explicit dropdown button */}
          <div className="relative" ref={adherenciaContainerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adherencia</label>
            <div className="flex">
              <input
                ref={adherenciaInputRef}
                placeholder="Seleccionar o escribir..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={adherencia}
                onChange={(e) => setAdherencia(e.target.value)}
                onFocus={() => {/* keep list closed on focus */}}
              />
              <button
                type="button"
                onClick={() => setShowAdherenciaOptions((s) => {
                  const next = !s;
                  if (next && adherenciaInputRef.current) adherenciaInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <div className="flex">
              <input
                ref={materialInputRef}
                placeholder="Seleccionar o escribir..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowMaterialOptions((s) => {
                  const next = !s;
                  if (next && materialInputRef.current) materialInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50"
                aria-label="Mostrar opciones de material"
              >
                ▾
              </button>
            </div>
            {showMaterialOptions && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-48 overflow-auto">
                {materialOptions.map((opt) => (
                  <li
                    key={opt}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setMaterial(opt); setShowMaterialOptions(false); }}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Proveedor de Material: editable combo */}
          <div className="relative" ref={proveedorContainerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor de Material</label>
            <div className="flex">
              <input
                ref={proveedorInputRef}
                placeholder="Seleccionar o escribir..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={proveedorMaterial}
                onChange={(e) => setProveedorMaterial(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowProveedorOptions((s) => {
                  const next = !s;
                  if (next && proveedorInputRef.current) proveedorInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Espesor</label>
            <input
              type="text"
              placeholder="Micras"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={espesor}
              onChange={(e) => setEspesor(e.target.value)}
            />
          </div>

          {/* Lote Material/Codigo Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lote Material/Codigo Material</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={loteMaterial}
              onChange={(e) => setLoteMaterial(e.target.value)}
            />
          </div>

          {/* Lote de Producción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lote de Producción</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={loteProduccion}
              readOnly
            />
          </div>

          {/* Impresión (editable combo) */}
          <div ref={impresionContainerRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Impresión</label>
            <div className="flex">
              <input
                ref={impresionInputRef}
                placeholder="Seleccione opción"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                value={impresion}
                onChange={(e) => setImpresion(e.target.value)}
              />
              <button
                type="button"
                onClick={() => { setShowImpresionOptions(s => !s); impresionInputRef.current?.focus(); }}
                className="px-2 py-1 border border-gray-300 rounded-r bg-gray-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Impresión</label>
            <div className="flex">
              <input
                ref={tipoImpresionInputRef}
                placeholder="Seleccione opción"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"
                value={tipoImpresion}
                onChange={(e) => setTipoImpresion(e.target.value)}
              />
              <button
                type="button"
                onClick={() => { setShowTipoImpresionOptions(s => !s); tipoImpresionInputRef.current?.focus(); }}
                className="px-2 py-1 border border-gray-300 rounded-r bg-gray-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Troquel</label>
            <div className="flex">
              <input
                ref={troquelInputRef}
                placeholder="Seleccionar o escribir..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={troquel}
                onChange={(e) => setTroquel(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowTroquelOptions((s) => {
                  const next = !s;
                  if (next && troquelInputRef.current) troquelInputRef.current.focus();
                  return next;
                })}
                className="px-3 py-1.5 border-t border-b border-r border-gray-300 rounded-r bg-white hover:bg-gray-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Código Troquel</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={codigoTroquel}
              onChange={(e) => setCodigoTroquel(e.target.value)}
            />
          </div>

          {/* Terminado de Etiqueta: editable combo */}
          <div className="relative" ref={terminadoContainerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terminado de Etiqueta</label>
            <div className="flex">
              <input
                ref={terminadoInputRef}
                placeholder="Seleccionar o escribir..."
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={terminadoEtiqueta}
                onChange={(e) => setTerminadoEtiqueta(e.target.value)}
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
                {terminadoOptions.map((opt) => (
                  <li
                    key={opt}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onMouseDown={(e) => { e.preventDefault(); setTerminadoEtiqueta(opt); setShowTerminadoOptions(false); }}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Terminados Especiales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terminados Especiales</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={terminadosEspeciales}
              onChange={(e) => setTerminadosEspeciales(e.target.value)}
            />
          </div>

          {/* Cantidad por Rollo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad por Rollo</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={cantidadPorRollo}
              onChange={(e) => setCantidadPorRollo(e.target.value)}
            />
          </div>

          {/* Número de Salida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Salida</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={numeroSalida}
              onChange={(e) => setNumeroSalida(e.target.value)}
              placeholder="1, 2, 3 o 4"
              maxLength={1}
            />
          </div>
        </div>

        {/* Imagen de referencia de Salidas */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Referencia de Salidas</label>
          <div className="flex justify-center">
            <img 
              src="/img/salidas.png" 
              alt="Referencia de salidas" 
              className="max-w-full h-auto rounded shadow-sm"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">Ingrese el número de salida (1, 2, 3 o 4) según la imagen</p>
        </div>

        {/* Observaciones */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea
            className="w-full px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones adicionales sobre la orden..."
          />
        </div>
      </div>
    </>
  );
};

export default FormularioOrdenDigital;
