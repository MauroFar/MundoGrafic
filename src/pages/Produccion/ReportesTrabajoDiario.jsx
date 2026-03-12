import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const ReportesTrabajoDiario = () => {
  const navigate = useNavigate();

  // Catálogos
  const [areas, setAreas] = useState([]);
  const [operadores, setOperadores] = useState([]);

  // Filtros / formulario
  const [areaId, setAreaId] = useState("");
  const [operadorId, setOperadorId] = useState("");
  const [proceso, setProceso] = useState("");
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");

  const hoy = new Date().toISOString().split("T")[0];

  // Datos tabla
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});

  // ── Cargar catálogos al montar ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(buildApiUrl("/api/areasReporte"), { headers: authHeaders() }).then(r => r.json()),
      fetch(buildApiUrl("/api/operadoresReporte"), { headers: authHeaders() }).then(r => r.json()),
    ]).then(([areasData, opsData]) => {
      setAreas(areasData.filter(a => a.activo));
      setOperadores(opsData.filter(o => o.activo));
    }).catch(() => setError("Error al cargar catálogos"));
  }, []);

  // Operadores filtrados según el área seleccionada
  const operadoresFiltrados = areaId
    ? operadores.filter(o => String(o.area_id) === String(areaId))
    : [];

  // ── Cargar reportes cuando cambia el área seleccionada ──────────────────────
  useEffect(() => {
    if (!areaId) { setReportes([]); return; }
    setCargando(true);
    setError("");
    const params = new URLSearchParams({ area_id: areaId });
    fetch(buildApiUrl(`/api/reportesTrabajo?${params}`), { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Error al cargar reportes"); return r.json(); })
      .then(data => setReportes(data))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, [areaId]);

  // ── Validación ──────────────────────────────────────────────────────────────
  const validar = () => {
    const e = {};
    if (!areaId)      e.areaId      = "Selecciona un área";
    if (!operadorId)  e.operadorId  = "Selecciona un operador";
    if (!proceso.trim()) e.proceso  = "Ingresa el proceso";
    if (!inicio)      e.inicio      = "Hora inicio requerida";
    if (!fin)         e.fin         = "Hora final requerida";
    if (inicio && fin && fin <= inicio) e.fin = "La hora final debe ser mayor a la de inicio";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Agregar reporte ─────────────────────────────────────────────────────────
  const agregarReporte = async () => {
    if (!validar()) return;
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(buildApiUrl("/api/reportesTrabajo"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          area_id: Number(areaId),
          operador_id: Number(operadorId),
          proceso: proceso.trim(),
          solicitado_por: solicitadoPor.trim() || null,
          inicio,
          fin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      setReportes(prev => [data, ...prev]);
      setProceso("");
      setSolicitadoPor("");
      setInicio("");
      setFin("");
      setErrores({});
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = (campo) =>
    `w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      errores[campo] ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"
    }`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/welcome")}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al menú principal
      </button>
      <h1 className="text-3xl font-bold mb-6 text-blue-700">Reportes de Trabajo Diario</h1>

      {/* ── Selector de área ── */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="font-semibold text-gray-700 whitespace-nowrap">Seleccionar área:</label>
        <div>
          <select
            className={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 min-w-[180px] ${
              errores.areaId ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"
            }`}
            value={areaId}
            onChange={e => { setAreaId(e.target.value); setOperadorId(""); setErrores({}); }}
          >
            <option value="">-- Elegir área --</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          {errores.areaId && <p className="text-red-500 text-xs mt-1">{errores.areaId}</p>}
        </div>
      </div>

      {/* ── Error general ── */}
      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      {/* ── Formulario de ingreso ── */}
      {areaId && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5">

          {/* Fila 1: Operador | Proceso | Solicitado por */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

            {/* Operador */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Operador <span className="text-red-500">*</span></label>
              <select
                className={inputClass("operadorId")}
                value={operadorId}
                onChange={e => { setOperadorId(e.target.value); setErrores(p => ({ ...p, operadorId: "" })); }}
                disabled={operadoresFiltrados.length === 0}
              >
                <option value="">
                  {operadoresFiltrados.length === 0 ? "Sin operadores en esta área" : "-- Seleccionar --"}
                </option>
                {operadoresFiltrados.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </select>
              {errores.operadorId && <p className="text-red-500 text-xs mt-1">{errores.operadorId}</p>}
            </div>

            {/* Proceso */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Proceso <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={inputClass("proceso")}
                value={proceso}
                onChange={e => { setProceso(e.target.value); setErrores(p => ({ ...p, proceso: "" })); }}
                placeholder="Descripción del proceso"
              />
              {errores.proceso && <p className="text-red-500 text-xs mt-1">{errores.proceso}</p>}
            </div>

            {/* Solicitado por */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Solicitado por</label>
              <input
                type="text"
                className={inputClass("solicitadoPor")}
                value={solicitadoPor}
                onChange={e => setSolicitadoPor(e.target.value)}
                placeholder="Quién lo solicitó"
              />
            </div>
          </div>

          {/* Fila 2: Hora inicio | Hora final | Fecha | Botón */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

            {/* Hora inicio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
              <input
                type="time"
                className={inputClass("inicio")}
                value={inicio}
                onChange={e => { setInicio(e.target.value); setErrores(p => ({ ...p, inicio: "", fin: "" })); }}
              />
              {errores.inicio && <p className="text-red-500 text-xs mt-1">{errores.inicio}</p>}
            </div>

            {/* Hora final */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hora final <span className="text-red-500">*</span></label>
              <input
                type="time"
                className={inputClass("fin")}
                value={fin}
                onChange={e => { setFin(e.target.value); setErrores(p => ({ ...p, fin: "" })); }}
              />
              {errores.fin && <p className="text-red-500 text-xs mt-1">{errores.fin}</p>}
            </div>

            {/* Fecha (solo lectura) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
              <input
                type="text"
                readOnly
                value={hoy}
                className="w-full border border-gray-200 bg-gray-100 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Botón agregar */}
            <div>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md text-sm transition-colors"
                onClick={agregarReporte}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Agregar registro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de reportes ── */}
      {areaId && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="py-2 px-4 text-left">Área</th>
                <th className="py-2 px-4 text-left">Operador</th>
                <th className="py-2 px-4 text-left">Proceso</th>
                <th className="py-2 px-4 text-left">Solicitado por</th>
                <th className="py-2 px-4 text-left">Hora inicio</th>
                <th className="py-2 px-4 text-left">Hora final</th>
                <th className="py-2 px-4 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">Cargando...</td></tr>
              ) : reportes.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-500">No hay procesos registrados para esta área.</td></tr>
              ) : (
                reportes.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{d.area}</td>
                    <td className="py-2 px-4">{d.operador}</td>
                    <td className="py-2 px-4">{d.proceso}</td>
                    <td className="py-2 px-4">{d.solicitado_por || <span className="text-gray-300">—</span>}</td>
                    <td className="py-2 px-4">{d.inicio}</td>
                    <td className="py-2 px-4">{d.fin}</td>
                    <td className="py-2 px-4 text-gray-500">{d.fecha ? String(d.fecha).split("T")[0] : "—"}</td>
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
