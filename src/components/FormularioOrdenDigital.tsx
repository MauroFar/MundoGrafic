import React from 'react';

interface ProductoDigital {
  id?: number;
  cantidad: string;
  cod_mg: string;
  cod_cliente: string;
  producto: string;
  avance: string;
  medida_ancho: string;
  medida_alto: string;
  cavidad: string;
  metros_impresos: string;
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
  
  const agregarProducto = () => {
    setProductos([
      ...productosArray,
      {
        cantidad: '',
        cod_mg: '',
        cod_cliente: '',
        producto: '',
        avance: '',
        medida_ancho: '',
        medida_alto: '',
        cavidad: '',
        metros_impresos: ''
      }
    ]);
  };

  const eliminarProducto = (index: number) => {
    setProductos(productosArray.filter((_, i) => i !== index));
  };

  const actualizarProducto = (index: number, campo: keyof ProductoDigital, valor: string) => {
    const nuevosProductos = [...productosArray];
    nuevosProductos[index] = { ...nuevosProductos[index], [campo]: valor };
    setProductos(nuevosProductos);
  };

  return (
    <>
      {/* Información del Trabajo - Tabla de Productos */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">
            Información del Trabajo
          </h3>
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
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Medida Ancho (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Medida Alto (mm)</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Cavidad</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Metros Impresos</th>
                <th className="px-2 py-2 text-xs font-semibold text-gray-700 border border-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosArray.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-4 text-center text-gray-500 border border-gray-300">
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
                        value={producto.medida_ancho}
                        onChange={(e) => actualizarProducto(index, 'medida_ancho', e.target.value)}
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
              placeholder="Ej: MULTIPROPÓSITO, PERMANENTE, REMOVIBLE"
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
              placeholder="Ej: PROPALCOTE"
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
              placeholder="Ej: MG260113"
            />
          </div>

          {/* Lote de Producción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lote de Producción</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={loteProduccion}
              onChange={(e) => setLoteProduccion(e.target.value)}
              placeholder="Ej: MG260120"
            />
          </div>

          {/* Impresión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impresión</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={impresion}
              onChange={(e) => setImpresion(e.target.value)}
              placeholder="Ej: NUEVO, REIMPRESIÓN"
            />
          </div>

          {/* Tipo de Impresión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Impresión</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={tipoImpresion}
              onChange={(e) => setTipoImpresion(e.target.value)}
              placeholder="Ej: CMYK"
            />
          </div>

          {/* Troquel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Troquel</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={troquel}
              onChange={(e) => setTroquel(e.target.value)}
              placeholder="Ej: FLEXIBLE, ROTATIVO, PLANO, NINGUNO"
            />
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
              placeholder="Ej: BARNIZ UV, LAMINADO, HOT STAMPING, NINGUNO"
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
