import React, { useEffect, useState } from "react";
import { buildApiUrl } from "../../config/api";
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi";

const token = () => localStorage.getItem("token");
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

// ─── Panel Áreas ──────────────────────────────────────────────────────────────
const PanelAreas = ({ areas, cargando, error, onAgregar, onEditar, onEliminar, onToggleActivo }) => {
  const [nuevo, setNuevo] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");

  const iniciarEdicion = (item) => { setEditId(item.id); setEditNombre(item.nombre); };
  const cancelar = () => { setEditId(null); setEditNombre(""); };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Áreas</h2>
      {error && <div className="mb-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Nombre del área"
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && nuevo.trim()) { onAgregar(nuevo.trim()); setNuevo(""); } }}
        />
        <button
          disabled={!nuevo.trim() || cargando}
          onClick={() => { if (nuevo.trim()) { onAgregar(nuevo.trim()); setNuevo(""); } }}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 font-semibold"
        >
          <FiPlus /> Agregar
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {cargando && <p className="text-gray-400 text-sm py-4 text-center">Cargando...</p>}
        {!cargando && areas.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No hay áreas aún.</p>}
        {areas.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-3">
            {editId === item.id ? (
              <>
                <input autoFocus type="text"
                  className="flex-1 border border-blue-400 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editNombre} onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && editNombre.trim()) { onEditar(item.id, editNombre.trim(), item.activo); cancelar(); }
                    if (e.key === "Escape") cancelar();
                  }}
                />
                <button onClick={() => { if (editNombre.trim()) { onEditar(item.id, editNombre.trim(), item.activo); cancelar(); } }} className="text-green-600 hover:text-green-800 p-1"><FiCheck /></button>
                <button onClick={cancelar} className="text-gray-400 hover:text-gray-600 p-1"><FiX /></button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-sm font-medium ${!item.activo ? "text-gray-400 line-through" : "text-gray-800"}`}>{item.nombre}</span>
                <button onClick={() => onToggleActivo(item.id, item.nombre, !item.activo)}
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${item.activo ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100" : "border-gray-300 text-gray-500 bg-gray-50 hover:bg-gray-100"}`}>
                  {item.activo ? "Activa" : "Inactiva"}
                </button>
                <button onClick={() => iniciarEdicion(item)} className="text-blue-500 hover:text-blue-700 p-1"><FiEdit2 /></button>
                <button onClick={() => onEliminar(item.id)} className="text-red-400 hover:text-red-600 p-1"><FiTrash2 /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Panel Operadores ─────────────────────────────────────────────────────────
const PanelOperadores = ({ areas, operadores, cargando, error, onAgregar, onEditar, onEliminar, onToggleActivo }) => {
  const [nombre, setNombre] = useState("");
  const [areaId, setAreaId] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editAreaId, setEditAreaId] = useState("");

  const iniciarEdicion = (item) => { setEditId(item.id); setEditNombre(item.nombre); setEditAreaId(item.area_id ?? ""); };
  const cancelar = () => { setEditId(null); setEditNombre(""); setEditAreaId(""); };

  const operadoresFiltrados = filtroArea
    ? operadores.filter(o => String(o.area_id) === String(filtroArea))
    : operadores;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Operadores</h2>
      {error && <div className="mb-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      {/* Formulario agregar */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex gap-2">
          <select
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[150px]"
            value={areaId}
            onChange={e => setAreaId(e.target.value)}
          >
            <option value="">-- Área --</option>
            {areas.filter(a => a.activo).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Nombre del operador"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && nombre.trim() && areaId) {
                onAgregar(nombre.trim(), areaId); setNombre(""); setAreaId("");
              }
            }}
          />
          <button
            disabled={!nombre.trim() || !areaId || cargando}
            onClick={() => { if (nombre.trim() && areaId) { onAgregar(nombre.trim(), areaId); setNombre(""); setAreaId(""); } }}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 font-semibold"
          >
            <FiPlus /> Agregar
          </button>
        </div>
      </div>

      {/* Filtro por área */}
      <div className="mb-4">
        <select
          className="border border-gray-200 bg-gray-50 rounded-md px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
          value={filtroArea}
          onChange={e => setFiltroArea(e.target.value)}
        >
          <option value="">Mostrar todos los operadores</option>
          {areas.map(a => <option key={a.id} value={a.id}>Solo {a.nombre}</option>)}
        </select>
      </div>

      <div className="divide-y divide-gray-100">
        {cargando && <p className="text-gray-400 text-sm py-4 text-center">Cargando...</p>}
        {!cargando && operadoresFiltrados.length === 0 && <p className="text-gray-400 text-sm py-4 text-center">No hay operadores.</p>}
        {operadoresFiltrados.map(item => (
          <div key={item.id} className="flex items-center gap-2 py-3">
            {editId === item.id ? (
              <>
                <select
                  className="border border-blue-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[130px]"
                  value={editAreaId}
                  onChange={e => setEditAreaId(e.target.value)}
                >
                  <option value="">-- Área --</option>
                  {areas.filter(a => a.activo).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
                <input autoFocus type="text"
                  className="flex-1 border border-blue-400 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editNombre} onChange={e => setEditNombre(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && editNombre.trim()) { onEditar(item.id, editNombre.trim(), item.activo, editAreaId); cancelar(); }
                    if (e.key === "Escape") cancelar();
                  }}
                />
                <button onClick={() => { if (editNombre.trim()) { onEditar(item.id, editNombre.trim(), item.activo, editAreaId); cancelar(); } }} className="text-green-600 hover:text-green-800 p-1"><FiCheck /></button>
                <button onClick={cancelar} className="text-gray-400 hover:text-gray-600 p-1"><FiX /></button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-sm ${!item.activo ? "text-gray-400 line-through" : "text-gray-800"}`}>{item.nombre}</span>
                {item.area_nombre && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">{item.area_nombre}</span>
                )}
                <button onClick={() => onToggleActivo(item.id, item.nombre, !item.activo, item.area_id)}
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${item.activo ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100" : "border-gray-300 text-gray-500 bg-gray-50 hover:bg-gray-100"}`}>
                  {item.activo ? "Activo" : "Inactivo"}
                </button>
                <button onClick={() => iniciarEdicion(item)} className="text-blue-500 hover:text-blue-700 p-1"><FiEdit2 /></button>
                <button onClick={() => onEliminar(item.id)} className="text-red-400 hover:text-red-600 p-1"><FiTrash2 /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const GestionReportes = () => {
  const [areas, setAreas] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [errorAreas, setErrorAreas] = useState("");
  const [errorOps, setErrorOps] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const [resA, resO] = await Promise.all([
        fetch(buildApiUrl("/api/areasReporte"), { headers: hdrs() }),
        fetch(buildApiUrl("/api/operadoresReporte"), { headers: hdrs() }),
      ]);
      setAreas(resA.ok ? await resA.json() : []);
      setOperadores(resO.ok ? await resO.json() : []);
    } catch { /* silencioso */ }
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  // ── Áreas ──
  const agregarArea = async (nombre) => {
    setErrorAreas("");
    const res = await fetch(buildApiUrl("/api/areasReporte"), { method: "POST", headers: hdrs(), body: JSON.stringify({ nombre }) });
    const data = await res.json();
    if (!res.ok) return setErrorAreas(data.error);
    setAreas(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };
  const editarArea = async (id, nombre, activo) => {
    setErrorAreas("");
    const res = await fetch(buildApiUrl(`/api/areasReporte/${id}`), { method: "PUT", headers: hdrs(), body: JSON.stringify({ nombre, activo }) });
    const data = await res.json();
    if (!res.ok) return setErrorAreas(data.error);
    setAreas(prev => prev.map(a => a.id === id ? data : a).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };
  const eliminarArea = async (id) => {
    if (!confirm("¿Eliminar esta área? También afectará a los operadores asociados.")) return;
    setErrorAreas("");
    const res = await fetch(buildApiUrl(`/api/areasReporte/${id}`), { method: "DELETE", headers: hdrs() });
    const data = await res.json();
    if (!res.ok) return setErrorAreas(data.error);
    setAreas(prev => prev.filter(a => a.id !== id));
  };

  // ── Operadores ──
  const agregarOp = async (nombre, area_id) => {
    setErrorOps("");
    const res = await fetch(buildApiUrl("/api/operadoresReporte"), { method: "POST", headers: hdrs(), body: JSON.stringify({ nombre, area_id: Number(area_id) }) });
    const data = await res.json();
    if (!res.ok) return setErrorOps(data.error);
    setOperadores(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };
  const editarOp = async (id, nombre, activo, area_id) => {
    setErrorOps("");
    const res = await fetch(buildApiUrl(`/api/operadoresReporte/${id}`), { method: "PUT", headers: hdrs(), body: JSON.stringify({ nombre, activo, area_id: area_id ? Number(area_id) : null }) });
    const data = await res.json();
    if (!res.ok) return setErrorOps(data.error);
    setOperadores(prev => prev.map(o => o.id === id ? data : o).sort((a, b) => a.nombre.localeCompare(b.nombre)));
  };
  const eliminarOp = async (id) => {
    if (!confirm("¿Eliminar este operador?")) return;
    setErrorOps("");
    const res = await fetch(buildApiUrl(`/api/operadoresReporte/${id}`), { method: "DELETE", headers: hdrs() });
    const data = await res.json();
    if (!res.ok) return setErrorOps(data.error);
    setOperadores(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Reportes</h1>
        <p className="text-gray-500 mt-1 text-sm">Administra las áreas y operadores utilizados en los Reportes de Trabajo Diario.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PanelAreas
          areas={areas}
          cargando={cargando}
          error={errorAreas}
          onAgregar={agregarArea}
          onEditar={editarArea}
          onEliminar={eliminarArea}
          onToggleActivo={(id, nombre, activo) => editarArea(id, nombre, activo)}
        />
        <PanelOperadores
          areas={areas}
          operadores={operadores}
          cargando={cargando}
          error={errorOps}
          onAgregar={agregarOp}
          onEditar={editarOp}
          onEliminar={eliminarOp}
          onToggleActivo={(id, nombre, activo, area_id) => editarOp(id, nombre, activo, area_id)}
        />
      </div>
    </div>
  );
};

export default GestionReportes;
