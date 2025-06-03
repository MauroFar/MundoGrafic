import React, { useState } from 'react';

const ProductosTerminados = () => {
  const [productos, setProductos] = useState([
    {
      id: 1,
      codigo: 'PT001',
      nombre: 'Tarjetas de presentación premium',
      cantidad: 1000,
      fechaTerminacion: '2024-03-15',
      cliente: 'Empresa ABC',
      estado: 'Listo para entrega',
      ubicacion: 'Almacén A'
    },
    {
      id: 2,
      codigo: 'PT002',
      nombre: 'Catálogos corporativos',
      cantidad: 500,
      fechaTerminacion: '2024-03-14',
      cliente: 'Corporación XYZ',
      estado: 'En empaque',
      ubicacion: 'Zona de empaque'
    },
    {
      id: 3,
      codigo: 'PT003',
      nombre: 'Banners publicitarios',
      cantidad: 10,
      fechaTerminacion: '2024-03-13',
      cliente: 'Marketing Pro',
      estado: 'Entregado',
      ubicacion: 'Histórico'
    }
  ]);

  const [filtro, setFiltro] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo: '',
    nombre: '',
    cantidad: '',
    fechaTerminacion: '',
    cliente: '',
    estado: '',
    ubicacion: ''
  });

  const estados = ['En proceso', 'En empaque', 'Listo para entrega', 'Entregado'];

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
      cantidad: '',
      fechaTerminacion: '',
      cliente: '',
      estado: '',
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
    producto.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    producto.cliente.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Productos Terminados</h1>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Registrar Producto Terminado
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, código o cliente..."
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
              <th className="px-6 py-3 text-left">Cantidad</th>
              <th className="px-6 py-3 text-left">Fecha Terminación</th>
              <th className="px-6 py-3 text-left">Cliente</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-left">Ubicación</th>
              <th className="px-6 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => (
              <tr key={producto.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{producto.codigo}</td>
                <td className="px-6 py-4">{producto.nombre}</td>
                <td className="px-6 py-4">{producto.cantidad}</td>
                <td className="px-6 py-4">{producto.fechaTerminacion}</td>
                <td className="px-6 py-4">{producto.cliente}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    producto.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                    producto.estado === 'Listo para entrega' ? 'bg-blue-100 text-blue-800' :
                    producto.estado === 'En empaque' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {producto.estado}
                  </span>
                </td>
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
              {productoEditando ? 'Editar Producto Terminado' : 'Registrar Producto Terminado'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Código</label>
                  <input
                    type="text"
                    name="codigo"
                    value={nuevoProducto.codigo}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={nuevoProducto.nombre}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Cantidad</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={nuevoProducto.cantidad}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Fecha Terminación</label>
                  <input
                    type="date"
                    name="fechaTerminacion"
                    value={nuevoProducto.fechaTerminacion}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Cliente</label>
                  <input
                    type="text"
                    name="cliente"
                    value={nuevoProducto.cliente}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Estado</label>
                  <select
                    name="estado"
                    value={nuevoProducto.estado}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Seleccionar estado</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2">Ubicación</label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={nuevoProducto.ubicacion}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
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
                      cantidad: '',
                      fechaTerminacion: '',
                      cliente: '',
                      estado: '',
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
                  {productoEditando ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosTerminados; 