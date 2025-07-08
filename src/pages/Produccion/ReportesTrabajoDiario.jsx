import React, { useState } from "react";

const AREAS = [
  "Impresión",
  "Corte",
  "Acabados",
  "Diseño",
  "Montaje",
];

// Datos simulados: 3 operadores por área
const OPERADORES = {
  "Impresión": ["Juan Pérez", "Ana Torres", "Luis Gómez"],
  "Corte": ["Carlos Ruiz", "Marta Díaz", "Pedro Sánchez"],
  "Acabados": ["Lucía Fernández", "Jorge Herrera", "Sofía Castro"],
  "Diseño": ["Elena López", "Miguel Ramos", "Patricia Vega"],
  "Montaje": ["Raúl Morales", "Gabriela Silva", "Andrés Paredes"],
};

// Datos simulados de reportes
const DATA = [
  // Impresión
  { area: "Impresión", operador: "Juan Pérez", proceso: "Impresión de lonas", inicio: "08:00", fin: "10:00" },
  { area: "Impresión", operador: "Juan Pérez", proceso: "Pruebas de color", inicio: "10:15", fin: "11:00" },
  { area: "Impresión", operador: "Ana Torres", proceso: "Impresión de vinil", inicio: "08:00", fin: "09:30" },
  { area: "Impresión", operador: "Luis Gómez", proceso: "Mantenimiento de máquina", inicio: "09:45", fin: "10:30" },
  // Corte
  { area: "Corte", operador: "Carlos Ruiz", proceso: "Corte de vinil", inicio: "08:30", fin: "09:30" },
  { area: "Corte", operador: "Marta Díaz", proceso: "Corte de lona", inicio: "09:45", fin: "10:30" },
  { area: "Corte", operador: "Pedro Sánchez", proceso: "Ajuste de guillotina", inicio: "10:40", fin: "11:20" },
  // Acabados
  { area: "Acabados", operador: "Lucía Fernández", proceso: "Laminado", inicio: "08:00", fin: "09:00" },
  { area: "Acabados", operador: "Jorge Herrera", proceso: "Montaje de bastidor", inicio: "09:10", fin: "10:00" },
  { area: "Acabados", operador: "Sofía Castro", proceso: "Empaque", inicio: "10:15", fin: "11:00" },
  // Diseño
  { area: "Diseño", operador: "Elena López", proceso: "Ajuste de archivos", inicio: "08:00", fin: "09:00" },
  { area: "Diseño", operador: "Miguel Ramos", proceso: "Diseño de banner", inicio: "09:10", fin: "10:00" },
  { area: "Diseño", operador: "Patricia Vega", proceso: "Revisión de pruebas", inicio: "10:15", fin: "11:00" },
  // Montaje
  { area: "Montaje", operador: "Raúl Morales", proceso: "Montaje en sitio", inicio: "08:00", fin: "10:00" },
  { area: "Montaje", operador: "Gabriela Silva", proceso: "Instalación de vinil", inicio: "10:15", fin: "12:00" },
  { area: "Montaje", operador: "Andrés Paredes", proceso: "Supervisión", inicio: "12:10", fin: "13:00" },
];

const ReportesTrabajoDiario = () => {
  const [area, setArea] = useState("");
  const [operador, setOperador] = useState("");

  // Operadores disponibles según área
  const operadoresArea = area ? OPERADORES[area] : [];

  // Filtrar datos por área y operador
  const filteredData = DATA.filter(d =>
    (!area || d.area === area) &&
    (!operador || d.operador === operador)
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Reportes de Trabajo Diario</h1>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="font-semibold text-gray-700">Filtrar por área:</label>
        <select
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={area}
          onChange={e => { setArea(e.target.value); setOperador(""); }}
        >
          <option value="">Todas las áreas</option>
          {AREAS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      {area && (
        <div className="mb-6">
          <div className="font-semibold text-gray-700 mb-2">Operadores:</div>
          <div className="flex flex-wrap gap-3">
            {operadoresArea.map(op => (
              <button
                key={op}
                className={`px-4 py-2 rounded-md border border-blue-400 text-blue-700 bg-white hover:bg-blue-100 transition-all duration-200 ${operador === op ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setOperador(op)}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      )}
      {operador && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="py-2 px-4 text-left">Operador</th>
                <th className="py-2 px-4 text-left">Proceso</th>
                <th className="py-2 px-4 text-left">Hora de inicio</th>
                <th className="py-2 px-4 text-left">Hora de final</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">No hay procesos registrados para este operador.</td>
                </tr>
              ) : (
                filteredData.map((d, idx) => (
                  <tr key={idx} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{d.operador}</td>
                    <td className="py-2 px-4">{d.proceso}</td>
                    <td className="py-2 px-4">{d.inicio}</td>
                    <td className="py-2 px-4">{d.fin}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportesTrabajoDiario; 