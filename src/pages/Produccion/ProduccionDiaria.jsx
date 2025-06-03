import React, { useState } from 'react';

const produccionDiaria = [
  {
    id: 1,
    area: 'Troquelados',
    cantidad: 500,
    horaInicio: '08:00',
    horaFin: '16:30',
    fecha: '2025-06-03',
    observacion: 'Producción sin retrasos.',
  },
  {
    id: 2,
    area: 'Impresión',
    cantidad: 1200,
    horaInicio: '07:45',
    horaFin: '17:00',
    fecha: '2025-06-03',
    observacion: '',
  },
  {
    id: 3,
    area: 'Acabados',
    cantidad: 800,
    horaInicio: '08:15',
    horaFin: '16:00',
    fecha: '2025-06-03',
    observacion: 'Falta material al inicio.',
  },
  {
    id: 4,
    area: 'Empaque',
    cantidad: 700,
    horaInicio: '09:00',
    horaFin: '17:30',
    fecha: '2025-06-03',
    observacion: '',
  },
];

const ResumenProduccionDiaria = () => {
  const [datosProduccion, setDatosProduccion] = useState(produccionDiaria);
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().slice(0, 10));

  // Filtrar datos según fecha seleccionada
  const produccionFiltrada = datosProduccion.filter(d => d.fecha === filtroFecha);

  // Permitir editar observaciones localmente
  const handleObservacionChange = (id, nuevoTexto) => {
    setDatosProduccion(prev =>
      prev.map(reg => (reg.id === id ? { ...reg, observacion: nuevoTexto } : reg))
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Producción Diaria</h1>

      {/* Filtro por fecha */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <label htmlFor="filtroFecha" className="font-semibold">
          Filtrar por fecha:
        </label>
        <input
          id="filtroFecha"
          type="date"
          value={filtroFecha}
          onChange={e => setFiltroFecha(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>

      {/* Tabla de producción */}
      <div className="overflow-x-auto">
        {produccionFiltrada.length === 0 ? (
          <p className="text-center text-gray-500">No hay producción registrada para esta fecha.</p>
        ) : (
          <table className="w-full border border-gray-300 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Área</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Cantidad</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Hora Inicio</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Hora Fin</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Observación</th>
              </tr>
            </thead>
            <tbody>
              {produccionFiltrada.map(({ id, area, cantidad, horaInicio, horaFin, observacion }) => (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{area}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{cantidad.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{horaInicio}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{horaFin}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="text"
                      value={observacion}
                      onChange={e => handleObservacionChange(id, e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      placeholder="Agregar/Editar observación"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResumenProduccionDiaria;
