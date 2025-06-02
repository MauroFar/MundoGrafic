import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const areasPorDefecto = [
  { area: 'Preprensa', estado: 'Completado', fechaInicio: '01/06/2025', fechaFin: '02/06/2025', responsable: 'Ana Pérez', observaciones: 'Aprobado diseño' },
  { area: 'Impresión', estado: 'En proceso', fechaInicio: '02/06/2025', fechaFin: '', responsable: 'Carlos Ríos', observaciones: '' },
  { area: 'Acabado', estado: 'Pendiente', fechaInicio: '', fechaFin: '', responsable: '', observaciones: '' },
  { area: 'Despacho', estado: 'Pendiente', fechaInicio: '', fechaFin: '', responsable: '', observaciones: '' },
];

const DashboardGeneral = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [seguimiento, setSeguimiento] = useState({});
  const [filtroEstado, setFiltroEstado] = useState('');
  const estadosOpciones = ['', 'Pendiente', 'En proceso', 'Completado', 'Entregado'];

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/ordenTrabajo/listar`);
        const data = await response.json();
        setOrdenes(data);

        const seguimientoInit = {};
        data.forEach((orden) => {
          seguimientoInit[orden.id] = JSON.parse(JSON.stringify(areasPorDefecto));
        });
        setSeguimiento(seguimientoInit);
      } catch (error) {
        console.error('Error al obtener órdenes de trabajo:', error);
      }
    };

    fetchOrdenes();
  }, []);

  const filtrarOrdenes = (ordenes) => {
    if (!filtroEstado) return ordenes;
    return ordenes.filter((orden) => {
      const areas = seguimiento[orden.id] || [];
      return areas.some((area) => area.estado.toLowerCase() === filtroEstado.toLowerCase());
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCampoCambio = (ordenId, areaIndex, campo, valor) => {
    setSeguimiento((prev) => {
      const copia = { ...prev };
      copia[ordenId][areaIndex][campo] = valor;
      return copia;
    });
  };

  const handleFileUpload = (ordenId, areaIndex, e) => {
    const file = e.target.files[0];
    if (!file) return;
    alert(`Archivo "${file.name}" seleccionado para la orden ${ordenId} en área ${areasPorDefecto[areaIndex].area}`);
  };

  const calcularProgreso = (areas) => {
    const total = areas.length;
    const completados = areas.filter((a) => a.estado === 'Completado').length;
    const enProceso = areas.filter((a) => a.estado === 'En proceso').length;
    const pendientes = total - completados - enProceso;
    return [
      { name: 'Pendiente', value: pendientes },
      { name: 'En proceso', value: enProceso },
      { name: 'Completado', value: completados },
    ];
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Dashboard General - Producción</h1>

      {/* Filtro por estado */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Filtrar por estado:</label>
        <select
          className="border p-2 rounded"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          {estadosOpciones.map((estado) => (
            <option key={estado} value={estado}>
              {estado || 'Todos'}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla principal */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-left">
              {['Orden', 'Cliente', 'Concepto', 'Área Actual', 'Estado', 'Inicio', 'Fin', 'Acción'].map((t) => (
                <th key={t} className="py-3 px-4">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrarOrdenes(ordenes).map((orden) => {
              const areas = seguimiento[orden.id] || areasPorDefecto;
              const areaActual = areas.find((a) => a.estado !== 'Completado') || areas[areas.length - 1];

              return (
                <React.Fragment key={orden.id}>
                  <tr
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(orden.id)}
                  >
                    <td className="py-2 px-4">{orden.numero_orden}</td>
                    <td className="py-2 px-4">{orden.nombre_cliente}</td>
                    <td className="py-2 px-4">{orden.concepto}</td>
                    <td className="py-2 px-4">{areaActual.area}</td>
                    <td className="py-2 px-4">{areaActual.estado}</td>
                    <td className="py-2 px-4">{areaActual.fechaInicio || '--'}</td>
                    <td className="py-2 px-4">{areaActual.fechaFin || '--'}</td>
                    <td className="py-2 px-4">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(orden.id); }}
                      >
                        {expandedId === orden.id ? 'Cerrar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>

                  {/* Detalle expandido */}
                  {expandedId === orden.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="p-4">
                      <div className="flex flex-col gap-6">

                          {/* Tabla de seguimiento */}
                          <table className="min-w-full border rounded-lg">
                            <thead>
                              <tr className="bg-gray-300">
                                {['Área', 'Estado', 'Inicio', 'Fin', 'Responsable', 'Observaciones', 'Archivo'].map((h) => (
                                  <th key={h} className="py-2 px-3 border">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {areas.map((areaItem, idx) => (
                                <tr key={idx} className="border-b">
                                  <td className="py-2 px-3 border font-semibold">{areaItem.area}</td>
                                  <td className="py-2 px-3 border">
                                    <select
                                      className="border rounded px-2 py-1 w-full"
                                      value={areaItem.estado}
                                      onChange={(e) => handleCampoCambio(orden.id, idx, 'estado', e.target.value)}
                                    >
                                      <option>Pendiente</option>
                                      <option>En proceso</option>
                                      <option>Completado</option>
                                    </select>
                                  </td>
                                  <td className="py-2 px-3 border">
                                    <input
                                      type="text"
                                      className="border rounded px-2 py-1 w-full"
                                      value={areaItem.fechaInicio ? toISODate(areaItem.fechaInicio) : ''}
                                      onChange={(e) => handleCampoCambio(orden.id, idx, 'fechaInicio', e.target.value)}
                                    />
                                  </td>
                                  <td className="py-2 px-3 border">
                                    <input
                                      type="text"
                                      className="border rounded px-2 py-1 w-full"
                                      value={areaItem.fechaFin ? toISODate(areaItem.fechaFin) : ''}
                                      onChange={(e) => handleCampoCambio(orden.id, idx, 'fechaFin', e.target.value)}
                                    />
                                  </td>
                                  <td className="py-2 px-3 border">
                                    <input
                                      type="text"
                                      className="border rounded px-2 py-1 w-full"
                                      value={areaItem.responsable}
                                      onChange={(e) => handleCampoCambio(orden.id, idx, 'responsable', e.target.value)}
                                    />
                                  </td>
                                  <td className="py-2 px-3 border">
                                    <input
                                      type="text"
                                      className="border rounded px-2 py-1 w-full"
                                      value={areaItem.observaciones}
                                      onChange={(e) => handleCampoCambio(orden.id, idx, 'observaciones', e.target.value)}
                                    />
                                  </td>
                                  <td className="py-2 px-3 border">
                                    <input
                                      type="file"
                                      className="w-full"
                                      onChange={(e) => handleFileUpload(orden.id, idx, e)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Gráfico de progreso */}
                          <div className="h-64 p-4 border bg-white rounded-lg shadow">
                            <h2 className="text-lg font-bold mb-4 text-center">Progreso por área</h2>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={calcularProgreso(areas)}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#4f46e5" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Función para convertir fechas dd/mm/yyyy a yyyy-mm-dd
function toISODate(fechaStr) {
  if (!fechaStr) return '';
  const [day, month, year] = fechaStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export default DashboardGeneral;
