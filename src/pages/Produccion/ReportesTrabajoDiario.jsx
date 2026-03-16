import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const ReportesTrabajoDiario = () => {
  const navigate = useNavigate();

  const hoy = new Date().toISOString().split("T")[0];

  // Catálogos
  const [areas, setAreas] = useState([]);
  const [operadores, setOperadores] = useState([]);

  // Filtros de tabla
  const [areaId, setAreaId] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState(hoy);
  const [busqueda, setBusqueda] = useState("");

  // Formulario (modal)
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modalAreaId, setModalAreaId] = useState("");
  const [operadorId, setOperadorId] = useState("");
  const [proceso, setProceso] = useState("");
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [errores, setErrores] = useState({});

  // Datos tabla
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // ── Cargar catálogos al montar ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch(buildApiUrl("/api/areasReporte"), { headers: authHeaders() }).then(r => r.json()),
      fetch(buildApiUrl("/api/operadoresReporte"), { headers: authHeaders() }).then(r => r.json()),
    ]).then(([areasData, opsData]) => {
      const activas = areasData.filter(a => a.activo);
      setAreas(activas);
      setOperadores(opsData.filter(o => o.activo));
      // Auto-seleccionar área "Sistemas"
      const sistemas = activas.find(a => a.nombre.toLowerCase().includes("sistema"));
      if (sistemas) setAreaId(String(sistemas.id));
    }).catch(() => setError("Error al cargar catálogos"));
  }, []);

  // Operadores filtrados para el modal según el área elegida en el modal
  const operadoresFiltrados = modalAreaId
    ? operadores.filter(o => String(o.area_id) === String(modalAreaId))
    : [];

  // ── Cargar reportes cuando cambia área o fecha ──────────────────────────────
  useEffect(() => {
    if (!areaId) { setReportes([]); return; }
    setCargando(true);
    setError("");
    const params = new URLSearchParams({ area_id: areaId });
    if (fechaFiltro) params.append("fecha", fechaFiltro);
    fetch(buildApiUrl(`/api/reportesTrabajo?${params}`), { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Error al cargar reportes"); return r.json(); })
      .then(data => setReportes(data))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, [areaId, fechaFiltro]);

  // Filtro de búsqueda client-side
  const reportesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return reportes;
    const q = busqueda.toLowerCase();
    return reportes.filter(r =>
      r.operador?.toLowerCase().includes(q) ||
      r.proceso?.toLowerCase().includes(q) ||
      r.solicitado_por?.toLowerCase().includes(q)
    );
  }, [reportes, busqueda]);

  // ── Validación ──────────────────────────────────────────────────────────────
  const validar = () => {
    const e = {};
    if (!modalAreaId)    e.modalAreaId = "Selecciona un área";
    if (!operadorId)     e.operadorId  = "Selecciona un operador";
    if (!proceso.trim()) e.proceso     = "Ingresa el proceso";
    if (!inicio)         e.inicio      = "Hora inicio requerida";
    if (!fin)            e.fin         = "Hora final requerida";
    if (inicio && fin && fin <= inicio) e.fin = "La hora final debe ser mayor a la de inicio";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  // ── Cerrar formulario y limpiar ─────────────────────────────────────────────
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setModalAreaId(""); setOperadorId(""); setProceso(""); setSolicitadoPor("");
    setInicio(""); setFin(""); setErrores({});
  };

  const abrirFormulario = () => {
    setModalAreaId(areaId);
    setMostrarFormulario(true);
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
          area_id: Number(modalAreaId),
          operador_id: Number(operadorId),
          proceso: proceso.trim(),
          solicitado_por: solicitadoPor.trim() || null,
          inicio,
          fin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      // Recargar tabla si el área del registro coincide con el área visible
      if (String(modalAreaId) === String(areaId)) {
        setReportes(prev => [data, ...prev]);
      }
      cerrarFormulario();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const inputClass = (campo) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      errores[campo] ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header sticky ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/welcome")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Reportes de Trabajo Diario</h1>
              <p className="text-xs text-gray-500 mt-0.5">Registro y consulta de procesos por área</p>
            </div>
          </div>
          {areas.length > 0 && (
            <button
              onClick={abrirFormulario}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar registro
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ── Selector de área (desplegable) ── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Área de trabajo:</label>
          <select
            value={areaId}
            onChange={e => { setAreaId(e.target.value); setBusqueda(""); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
          >
            <option value="">-- Seleccionar área --</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        {/* ── Error general ── */}
        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>
        )}

        {/* ── Barra de filtros ── */}
        {areaId && (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm">

            {/* Búsqueda */}
            <div className="relative flex-1 max-w-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar operador, proceso..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Filtro de fecha */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Fecha:</label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={e => setFechaFiltro(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {fechaFiltro !== hoy && (
                <button
                  onClick={() => setFechaFiltro(hoy)}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                >
                  Hoy
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tabla de reportes ── */}
        {areaId && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-700 text-sm">
                {areas.find(a => String(a.id) === String(areaId))?.nombre}
                {fechaFiltro && (
                  <span className="ml-2 text-gray-400 font-normal">— {fechaFiltro}</span>
                )}
              </span>
              <span className="text-xs text-gray-400">
                {reportesFiltrados.length} registro{reportesFiltrados.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="py-3 px-4 text-left font-semibold">Operador</th>
                    <th className="py-3 px-4 text-left font-semibold">Proceso</th>
                    <th className="py-3 px-4 text-left font-semibold">Solicitado por</th>
                    <th className="py-3 px-4 text-left font-semibold">Hora inicio</th>
                    <th className="py-3 px-4 text-left font-semibold">Hora final</th>
                    <th className="py-3 px-4 text-left font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cargando ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Cargando registros...
                        </div>
                      </td>
                    </tr>
                  ) : reportesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        No hay registros para esta fecha y área.
                      </td>
                    </tr>
                  ) : (
                    reportesFiltrados.map(d => (
                      <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-800">{d.operador}</td>
                        <td className="py-3 px-4 text-gray-700">{d.proceso}</td>
                        <td className="py-3 px-4 text-gray-500">{d.solicitado_por || <span className="text-gray-300">—</span>}</td>
                        <td className="py-3 px-4 text-gray-600">{d.inicio}</td>
                        <td className="py-3 px-4 text-gray-600">{d.fin}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs">{d.fecha ? String(d.fecha).split("T")[0] : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Agregar registro ── */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={cerrarFormulario}
          />
          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-6 z-10">

            {/* Encabezado */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Agregar registro</h2>
                <p className="text-xs text-gray-500 mt-0.5">Fecha: {hoy}</p>
              </div>
              <button
                onClick={cerrarFormulario}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">

              {/* Área */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Área <span className="text-red-500">*</span>
                </label>
                <select
                  className={inputClass("modalAreaId")}
                  value={modalAreaId}
                  onChange={e => { setModalAreaId(e.target.value); setOperadorId(""); setErrores(p => ({ ...p, modalAreaId: "", operadorId: "" })); }}
                >
                  <option value="">-- Seleccionar área --</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
                {errores.modalAreaId && <p className="text-red-500 text-xs mt-1">{errores.modalAreaId}</p>}
              </div>

              {/* Operador */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Operador <span className="text-red-500">*</span>
                </label>
                <select
                  className={inputClass("operadorId")}
                  value={operadorId}
                  onChange={e => { setOperadorId(e.target.value); setErrores(p => ({ ...p, operadorId: "" })); }}
                  disabled={operadoresFiltrados.length === 0}
                >
                  <option value="">
                    {operadoresFiltrados.length === 0 ? "Sin operadores en esta área" : "-- Seleccionar operador --"}
                  </option>
                  {operadoresFiltrados.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
                {errores.operadorId && <p className="text-red-500 text-xs mt-1">{errores.operadorId}</p>}
              </div>

              {/* Proceso */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Proceso <span className="text-red-500">*</span>
                </label>
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
                  placeholder="Quién lo solicitó (opcional)"
                />
              </div>

              {/* Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Hora inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className={inputClass("inicio")}
                    value={inicio}
                    onChange={e => { setInicio(e.target.value); setErrores(p => ({ ...p, inicio: "", fin: "" })); }}
                  />
                  {errores.inicio && <p className="text-red-500 text-xs mt-1">{errores.inicio}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Hora final <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className={inputClass("fin")}
                    value={fin}
                    onChange={e => { setFin(e.target.value); setErrores(p => ({ ...p, fin: "" })); }}
                  />
                  {errores.fin && <p className="text-red-500 text-xs mt-1">{errores.fin}</p>}
                </div>
              </div>
            </div>

            {/* Error modal */}
            {error && (
              <div className="mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={cerrarFormulario}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={agregarReporte}
                disabled={guardando}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {guardando ? "Guardando..." : "Guardar registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesTrabajoDiario;
