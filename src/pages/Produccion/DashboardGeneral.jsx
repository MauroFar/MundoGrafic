import React from 'react';

const DashboardGeneral = () => {
  const orders = [
    { id: 1, codigo: 'OT001', cliente: 'Cliente A', area: 'Diseño', estado: 'Pendiente', fechaInicio: '2025-05-12', fechaFin: '-' },
    { id: 2, codigo: 'OT002', cliente: 'Cliente B', area: 'Impresión', estado: 'En Proceso', fechaInicio: '2025-05-11', fechaFin: '-' },
    { id: 3, codigo: 'OT003', cliente: 'Cliente C', area: 'Acabado', estado: 'Completado', fechaInicio: '2025-05-10', fechaFin: '2025-05-12' },
  ];

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-500';
      case 'En Proceso':
        return 'bg-blue-500';
      case 'Completado':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Dashboard General - Producción</h1>

      <div className="mb-4">
        <label className="mr-2">Filtrar por área:</label>
        <select className="border p-2 rounded">
          <option value="">Todas</option>
          <option value="Diseño">Diseño</option>
          <option value="Impresión">Impresión</option>
          <option value="Acabado">Acabado</option>
          <option value="Empaque">Empaque</option>
          <option value="Entrega">Entrega</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Área Actual</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Fecha Inicio</th>
              <th className="py-3 px-4">Fecha Fin</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-100">
                <td className="py-3 px-4">{order.codigo}</td>
                <td className="py-3 px-4">{order.cliente}</td>
                <td className="py-3 px-4">{order.area}</td>
                <td className="py-3 px-4">
                  <span className={`text-white px-2 py-1 rounded ${getStatusColor(order.estado)}`}>{order.estado}</span>
                </td>
                <td className="py-3 px-4">{order.fechaInicio}</td>
                <td className="py-3 px-4">{order.fechaFin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardGeneral;
