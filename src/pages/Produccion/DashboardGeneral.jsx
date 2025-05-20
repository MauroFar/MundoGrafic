
import React, { useEffect, useState } from 'react';

const DashboardGeneral = () => {
    const [ordenes, setOrdenes] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/ordenTrabajo/listar`);
        const data = await response.json();
        console.log(data);
        setOrdenes(data);
      } catch (error) {
        console.error('Error al obtener órdenes de trabajo:', error);
      }
    };

    fetchOrdenes();
  }, []);
 
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Dashboard General - Producción</h1>

      <div className="mb-4">
        <label className="mr-2">Filtrar por estado:</label>
        <select className="border p-2 rounded">
          <option value="">Pendiente</option>
          <option value="Diseño">En Proceso</option>
          <option value="Impresión">Terminado</option>
          <option value="Acabado">Entregado</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="py-3 px-4">Orden de Trabajo</th>
              <th className="py-3 px-4">Cliente</th>
               <th className="py-3 px-4">Concepto</th>
              <th className="py-3 px-4">Área Actual</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Fecha Inicio</th>
              <th className="py-3 px-4">Fecha Fin</th>
            </tr>
          </thead>
<tbody>
{ordenes.map((orden) => (
  <tr key={orden.id} className="border-b hover:bg-gray-50">
    <td className="py-2 px-4">{orden.numero_orden}</td>
    <td className="py-2 px-4">{orden.nombre_cliente}</td>
    <td className="py-2 px-4">{orden.concepto}</td>
    <td className="py-2 px-4 text-gray-400 italic">--</td>
    <td className="py-2 px-4 text-gray-400 italic">--</td>
    <td className="py-2 px-4 text-gray-400 italic">--</td>
    <td className="py-2 px-4 text-gray-400 italic">--</td>
  </tr>
))}

</tbody>

        </table>
      </div>
    </div>
  );
};

export default DashboardGeneral;
