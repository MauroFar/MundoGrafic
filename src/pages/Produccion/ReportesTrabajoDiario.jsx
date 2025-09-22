import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../../config/api";

const AREAS = [
  "Impresión",
  "Corte",
  "Acabados",
  "Diseño",
  "Montaje",
  "Sistemas",
];

const ReportesTrabajoDiario = () => {
  const [area, setArea] = useState("Sistemas");
  const [operador, setOperador] = useState("Mauro Farinango");
  const [proceso, setProceso] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Prefijar operador para Sistemas cuando se seleccione el área
  const onChangeArea = (value) => {
    setArea(value);
    if (value === "Sistemas") {
      setOperador("Mauro Farinango");
    } else {
      setOperador("");
    }
  };

  const agregarReporte = () => {
    if (!area || !proceso || !inicio || !fin) return;
    setCargando(true);
    setError("");
    fetch(buildApiUrl("/api/reportesTrabajo"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area, operador: operador || null, proceso, inicio, fin })
    })
      .then(r => {
        if (!r.ok) throw new Error("Error al guardar reporte");
        return r.json();
      })
      .then(nuevo => {
        setReportes(prev => [nuevo, ...prev]);
        setProceso("");
        setInicio("");
        setFin("");
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  };

  const filteredData = reportes.filter(d =>
    (!area || d.area === area) &&
    (!operador || d.operador === operador)
  );

  // Cargar datos al iniciar y cuando cambien filtros por defecto
  useEffect(() => {
    setCargando(true);
    setError("");
    const params = new URLSearchParams();
    if (area) params.append("area", area);
    if (operador) params.append("operador", operador);
    fetch(buildApiUrl(`/api/reportesTrabajo?${params.toString()}`))
      .then(r => {
        if (!r.ok) throw new Error("Error al cargar reportes");
        return r.json();
      })
      .then(data => setReportes(data))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, [area, operador]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Reportes de Trabajo Diario</h1>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="font-semibold text-gray-700">Seleccionar área:</label>
        <select
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={area}
          onChange={e => onChangeArea(e.target.value)}
        >
          <option value="">Elegir área</option>
          {AREAS.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {area && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Operador</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={operador}
              onChange={e => setOperador(e.target.value)}
              placeholder="Nombre del operador"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Proceso</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={proceso}
              onChange={e => setProceso(e.target.value)}
              placeholder="Descripción del proceso"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hora inicio</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={inicio}
              onChange={e => setInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hora final</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={fin}
              onChange={e => setFin(e.target.value)}
            />
          </div>
          <div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md"
              onClick={agregarReporte}
            >
              {cargando ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </div>
      )}

      {area && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="py-2 px-4 text-left">Área</th>
                <th className="py-2 px-4 text-left">Operador</th>
                <th className="py-2 px-4 text-left">Proceso</th>
                <th className="py-2 px-4 text-left">Hora de inicio</th>
                <th className="py-2 px-4 text-left">Hora de final</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">No hay procesos registrados para esta área.</td>
                </tr>
              ) : (
                filteredData.map((d, idx) => (
                  <tr key={idx} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{d.area}</td>
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