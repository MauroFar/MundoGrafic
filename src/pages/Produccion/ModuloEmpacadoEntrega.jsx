import React, { useState, useEffect } from 'react';
import { FaBox, FaTruck, FaCheckCircle, FaClock, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser } from 'react-icons/fa';

const ModuloEmpacadoEntrega = () => {
  const [ordenesEmpacado, setOrdenesEmpacado] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarOrdenesEmpacado();
  }, []);

  const cargarOrdenesEmpacado = () => {
    setCargando(true);
    
    // Simular carga de datos con datos ficticios
    setTimeout(() => {
      const datosFicticios = [
        {
          id: 1,
          numeroOrden: 'OT-2024-001',
          cliente: 'Empresa ABC',
          producto: 'Tarjetas de Presentación',
          cantidad: 1000,
          estado: 'empacado',
          fechaEmpacado: new Date(Date.now() - 2 * 60 * 60 * 1000),
          fechaEntrega: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          responsableEmpacado: 'Carlos López',
          responsableEntrega: 'María García',
          direccionEntrega: 'Av. Principal 123, Ciudad',
          telefonoCliente: '+1 234-567-8900',
          emailCliente: 'contacto@empresaabc.com',
          contactoCliente: 'Juan Pérez',
          tipoEmpaque: 'Caja de cartón',
          peso: '2.5 kg',
          dimensiones: '30 x 20 x 5 cm',
          observaciones: 'Fragil - Manejar con cuidado',
          tracking: 'TRK001234567',
          costoEnvio: 15.50,
          metodoEnvio: 'Estándar',
          estadoEntrega: 'programada'
        },
        {
          id: 2,
          numeroOrden: 'OT-2024-002',
          cliente: 'Comercial XYZ',
          producto: 'Volantes Promocionales',
          cantidad: 5000,
          estado: 'en_transito',
          fechaEmpacado: new Date(Date.now() - 4 * 60 * 60 * 1000),
          fechaEntrega: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          responsableEmpacado: 'Ana Martínez',
          responsableEntrega: 'Pedro Rodríguez',
          direccionEntrega: 'Calle Secundaria 456, Ciudad',
          telefonoCliente: '+1 234-567-8901',
          emailCliente: 'ventas@comercialxyz.com',
          contactoCliente: 'María González',
          tipoEmpaque: 'Sobre grande',
          peso: '1.8 kg',
          dimensiones: '40 x 30 x 2 cm',
          observaciones: 'No doblar',
          tracking: 'TRK001234568',
          costoEnvio: 8.75,
          metodoEnvio: 'Express',
          estadoEntrega: 'en_transito'
        },
        {
          id: 3,
          numeroOrden: 'OT-2024-003',
          cliente: 'Restaurante El Buen Sabor',
          producto: 'Menús',
          cantidad: 200,
          estado: 'entregado',
          fechaEmpacado: new Date(Date.now() - 24 * 60 * 60 * 1000),
          fechaEntrega: new Date(Date.now() - 2 * 60 * 60 * 1000),
          responsableEmpacado: 'Roberto Silva',
          responsableEntrega: 'Laura Sánchez',
          direccionEntrega: 'Plaza Central 789, Ciudad',
          telefonoCliente: '+1 234-567-8902',
          emailCliente: 'gerencia@buensabor.com',
          contactoCliente: 'Carlos Mendoza',
          tipoEmpaque: 'Caja especial',
          peso: '3.2 kg',
          dimensiones: '35 x 25 x 8 cm',
          observaciones: 'Entrega directa al restaurante',
          tracking: 'TRK001234569',
          costoEnvio: 12.00,
          metodoEnvio: 'Local',
          estadoEntrega: 'entregado'
        }
      ];
      
      setOrdenesEmpacado(datosFicticios);
      setCargando(false);
    }, 1000);
  };

  const cambiarEstadoEmpacado = (id, nuevoEstado) => {
    setOrdenesEmpacado(prev => 
      prev.map(orden => 
        orden.id === id 
          ? { 
              ...orden, 
              estado: nuevoEstado,
              fechaEmpacado: nuevoEstado === 'empacado' ? new Date() : orden.fechaEmpacado,
              estadoEntrega: nuevoEstado === 'entregado' ? 'entregado' : orden.estadoEntrega
            }
          : orden
      )
    );

    // Disparar notificación
    const evento = new CustomEvent('nueva-notificacion', {
      detail: {
        tipo: 'success',
        titulo: 'Estado Actualizado',
        mensaje: `Orden ${id} cambiada a ${nuevoEstado}`
      }
    });
    window.dispatchEvent(evento);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      empacado: 'bg-blue-50 border-blue-200 text-blue-800',
      en_transito: 'bg-purple-50 border-purple-200 text-purple-800',
      entregado: 'bg-green-50 border-green-200 text-green-800',
      devuelto: 'bg-red-50 border-red-200 text-red-800'
    };
    return colores[estado] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getEstadoEntregaColor = (estado) => {
    const colores = {
      programada: 'bg-yellow-100 text-yellow-800',
      en_transito: 'bg-blue-100 text-blue-800',
      entregado: 'bg-green-100 text-green-800',
      devuelto: 'bg-red-100 text-red-800',
      retrasado: 'bg-orange-100 text-orange-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getMetodoEnvioColor = (metodo) => {
    const colores = {
      'Estándar': 'bg-blue-100 text-blue-800',
      'Express': 'bg-green-100 text-green-800',
      'Local': 'bg-purple-100 text-purple-800',
      'Urgente': 'bg-red-100 text-red-800'
    };
    return colores[metodo] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No programada';
    return fecha.toLocaleString();
  };

  const calcularTiempoRestante = (fechaEntrega) => {
    const ahora = new Date();
    const diferencia = fechaEntrega - ahora;
    
    if (diferencia <= 0) return 'Tiempo agotado';
    
    const dias = Math.floor(diferencia / (24 * 60 * 60 * 1000));
    const horas = Math.floor((diferencia % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (dias > 0) return `${dias}d ${horas}h`;
    return `${horas}h`;
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaBox className="text-orange-600" />
          Empacado y Entrega
        </h2>
        <button
          onClick={cargarOrdenesEmpacado}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {ordenesEmpacado.filter(o => o.estado === 'empacado').length}
          </div>
          <div className="text-sm text-blue-800">Empacadas</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {ordenesEmpacado.filter(o => o.estado === 'en_transito').length}
          </div>
          <div className="text-sm text-purple-800">En Tránsito</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {ordenesEmpacado.filter(o => o.estado === 'entregado').length}
          </div>
          <div className="text-sm text-green-800">Entregadas</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            ${ordenesEmpacado.reduce((sum, o) => sum + o.costoEnvio, 0).toFixed(2)}
          </div>
          <div className="text-sm text-orange-800">Total Envíos</div>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesEmpacado.map((orden) => (
                <tr key={orden.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {orden.numeroOrden}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.producto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {orden.cantidad.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(orden.estado)}`}>
                      {orden.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-xs">{orden.tracking}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-xs">
                      <div>{formatearFecha(orden.fechaEntrega)}</div>
                      <div className="text-gray-500">
                        {calcularTiempoRestante(orden.fechaEntrega)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${orden.costoEnvio.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {orden.estado === 'pendiente' && (
                        <button
                          onClick={() => cambiarEstadoEmpacado(orden.id, 'empacado')}
                          className="text-blue-600 hover:text-blue-900"
                          title="Empacar"
                        >
                          <FaBox />
                        </button>
                      )}
                      {orden.estado === 'empacado' && (
                        <button
                          onClick={() => cambiarEstadoEmpacado(orden.id, 'en_transito')}
                          className="text-purple-600 hover:text-purple-900"
                          title="Enviar"
                        >
                          <FaTruck />
                        </button>
                      )}
                      {orden.estado === 'en_transito' && (
                        <button
                          onClick={() => cambiarEstadoEmpacado(orden.id, 'entregado')}
                          className="text-green-600 hover:text-green-900"
                          title="Entregar"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalles de empacado y entrega */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de empacado */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaBox className="text-blue-600" />
            Información de Empacado
          </h3>
          <div className="space-y-3">
            {ordenesEmpacado.map((orden) => (
              <div key={orden.id} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">{orden.numeroOrden}</span>
                  <span className="text-sm text-gray-600">- {orden.cliente}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-1 font-medium">{orden.tipoEmpaque}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Peso:</span>
                    <span className="ml-1 font-medium">{orden.peso}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dimensiones:</span>
                    <span className="ml-1 font-medium">{orden.dimensiones}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Responsable:</span>
                    <span className="ml-1 font-medium">{orden.responsableEmpacado}</span>
                  </div>
                </div>
                {orden.observaciones && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Observaciones:</span> {orden.observaciones}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Información de entrega */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaTruck className="text-green-600" />
            Información de Entrega
          </h3>
          <div className="space-y-3">
            {ordenesEmpacado.map((orden) => (
              <div key={orden.id} className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">{orden.numeroOrden}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getEstadoEntregaColor(orden.estadoEntrega)}`}>
                    {orden.estadoEntrega}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-green-600" />
                    <span className="text-gray-700">{orden.direccionEntrega}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUser className="text-green-600" />
                    <span className="text-gray-700">{orden.contactoCliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-green-600" />
                    <span className="text-gray-700">{orden.telefonoCliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-green-600" />
                    <span className="text-gray-700">{orden.emailCliente}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getMetodoEnvioColor(orden.metodoEnvio)}`}>
                      {orden.metodoEnvio}
                    </span>
                    <span className="font-medium text-gray-800">
                      ${orden.costoEnvio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de entregas */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Entregas</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {ordenesEmpacado.filter(o => o.estado === 'entregado').length}
              </div>
              <div className="text-gray-600">Entregas Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {ordenesEmpacado.filter(o => o.estado === 'en_transito').length}
              </div>
              <div className="text-gray-600">En Tránsito</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                ${ordenesEmpacado.reduce((sum, o) => sum + o.costoEnvio, 0).toFixed(2)}
              </div>
              <div className="text-gray-600">Total Costos de Envío</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloEmpacadoEntrega;