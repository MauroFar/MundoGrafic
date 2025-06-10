import React, { useState } from 'react';
const Inventario = () => {
  const [productos, setProductos] = useState([
    {
      id: 1,
      codigo: 'PAP001',
      nombre: 'Resma de papel bond A4',
      categoria: 'Papelería',
      stock: 100,
      precio: 5.5,
      proveedor: 'Papeles Ecuador',
      ubicacion: 'Estante A1'
    },
    {
      id: 2,
      codigo: 'TIN002',
      nombre: 'Tinta negra offset',
      categoria: 'Tintas',
      stock: 50,
      precio: 12.0,
      proveedor: 'Inktech',
      ubicacion: 'Bodega B2'
    },
    {
      id: 3,
      codigo: 'MAQ003',
      nombre: 'Guillotina industrial',
      categoria: 'Maquinaria',
      stock: 2,
      precio: 850.0,
      proveedor: 'MaquinasPrint',
      ubicacion: 'Zona máquinas'
    },
    {
      id: 4,
      codigo: 'ROL004',
      nombre: 'Rollos adhesivos',
      categoria: 'Materiales',
      stock: 200,
      precio: 0.8,
      proveedor: 'Adhesivos S.A.',
      ubicacion: 'Estante C3'
    },
    {
      id: 5,
      codigo: 'PLT005',
      nombre: 'Planchas para impresión offset',
      categoria: 'Planchas',
      stock: 30,
      precio: 6.5,
      proveedor: 'OffsetTech',
      ubicacion: 'Zona técnica'
    }
  ]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    stock: '',
    precio: '',
    proveedor: '',
    ubicacion: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (productoEditando) {
      setProductos(prev =>
        prev.map(p => (p.id === productoEditando.id ? { ...nuevoProducto, id: p.id } : p))
      );
    } else {
      const nuevo = { ...nuevoProducto, id: Date.now() };
      setProductos(prev => [...prev, nuevo]);
    }

    setModalAbierto(false);
    setProductoEditando(null);
    setNuevoProducto({
      codigo: '',
      nombre: '',
      categoria: '',
      stock: '',
      precio: '',
      proveedor: '',
      ubicacion: ''
    });
  };

  const editarProducto = (producto) => {
    setProductoEditando(producto);
    setNuevoProducto(producto);
    setModalAbierto(true);
  };

  const eliminarProducto = (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventario de Imprenta</h1>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Agregar Producto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          className="w-full md:w-1/3 px-4 py-2 rounded-lg border"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-6 py-3 text-left">Código</th>
              <th className="px-6 py-3 text-left">Nombre</th>
              <th className="px-6 py-3 text-left">Categoría</th>
              <th className="px-6 py-3 text-left">Stock</th>
              <th className="px-6 py-3 text-left">Precio</th>
              <th className="px-6 py-3 text-left">Proveedor</th>
              <th className="px-6 py-3 text-left">Ubicación</th>
              <th className="px-6 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => (
              <tr key={producto.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{producto.codigo}</td>
                <td className="px-6 py-4">{producto.nombre}</td>
                <td className="px-6 py-4">{producto.categoria}</td>
                <td className="px-6 py-4">{producto.stock}</td>
                <td className="px-6 py-4">${producto.precio}</td>
                <td className="px-6 py-4">{producto.proveedor}</td>
                <td className="px-6 py-4">{producto.ubicacion}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => editarProducto(producto)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarProducto(producto.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {productoEditando ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['codigo', 'Código'],
                  ['nombre', 'Nombre'],
                  ['categoria', 'Categoría'],
                  ['stock', 'Stock', 'number'],
                  ['precio', 'Precio', 'number'],
                  ['proveedor', 'Proveedor'],
                  ['ubicacion', 'Ubicación']
                ].map(([name, label, type = 'text']) => (
                  <div key={name}>
                    <label className="block mb-2">{label}</label>
                    <input
                      type={type}
                      name={name}
                      value={nuevoProducto[name]}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false);
                    setProductoEditando(null);
                    setNuevoProducto({
                      codigo: '',
                      nombre: '',
                      categoria: '',
                      stock: '',
                      precio: '',
                      proveedor: '',
                      ubicacion: ''
                    });
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {productoEditando ? 'Guardar Cambios' : 'Agregar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
