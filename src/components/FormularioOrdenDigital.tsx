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
}) => {
  // Asegurar que productos siempre sea un array
  const productosArray = Array.isArray(productos) ? productos : [];

  // Tamaño de papel global para todos los productos
  const [tamanoPapelAncho, setTamanoPapelAncho] = React.useState<string>('');
  const [tamanoPapelLargo, setTamanoPapelLargo] = React.useState<string>('');

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

      return {
        ...producto,
        cavidad: cavidad.toString(),
        tamano_papel_ancho: tamanoPapelAnchoVal.toString(),
        tamano_papel_largo: tamanoPapelLargoVal.toString(),
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
    const productoActualizado: ProductoDigital = {
      ...nuevosProductos[index],
      [campo]: valor,
      tamano_papel_ancho: tamanoPapelAncho,
      tamano_papel_largo: tamanoPapelLargo,
    };

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
          {/* Adherencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adherencia</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={adherencia}
              onChange={(e) => setAdherencia(e.target.value)}
            />
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
            />
          </div>

          {/* Proveedor de Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor de Material</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={proveedorMaterial}
              onChange={(e) => setProveedorMaterial(e.target.value)}
            />
          </div>

          {/* Lote Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lote Material</label>
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

          {/* Impresión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impresión</label>
            <select
              className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={impresion}
              onChange={(e) => setImpresion(e.target.value)}
            >
              <option value="">Seleccione opción</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Reimpresion">Reimpresión</option>
            </select>
          </div>

          {/* Tipo de Impresión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Impresión</label>
            <select
              className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={tipoImpresion}
              onChange={(e) => setTipoImpresion(e.target.value)}
            >
              <option value="">Seleccione opción</option>
              <option value="CMY">CMY</option>
              <option value="CMYK">CMYK</option>
              <option value="CMYKW">CMYKW</option>
              <option value="NEGRO(K)">NEGRO(K)</option>
              <option value="CMYKW+OV">CMYKW+OV</option>
            </select>
          </div>

          {/* Troquel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Troquel</label>
            <select
              className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={troquel}
              onChange={(e) => setTroquel(e.target.value)}
            >
              <option value="">Seleccione opción</option>
              <option value="Flexible">Flexible</option>
              <option value="Plano">Plano</option>
              <option value="Ninguno">Ninguno</option>
            </select>
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

          {/* Terminado de Etiqueta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terminado de Etiqueta</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={terminadoEtiqueta}
              onChange={(e) => setTerminadoEtiqueta(e.target.value)}
            />
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
