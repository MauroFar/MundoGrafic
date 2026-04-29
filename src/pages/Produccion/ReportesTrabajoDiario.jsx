import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl, API_CONFIG } from "../../config/api";
import jsPDF from "jspdf";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const normalizeTimeDraft = (raw) => {
  const value = String(raw || "").replace(/[^\d:]/g, "");
  if (value.includes(":")) {
    const [h = "", m = ""] = value.split(":");
    const hh = h.slice(0, 2);
    const mm = m.slice(0, 2);
    return m.length > 0 ? `${hh}:${mm}` : hh;
  }
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const to24hTime = (raw) => {
  const value = String(raw || "").trim();
  if (!value) return "";

  let hh = "";
  let mm = "";

  const withColon = value.match(/^(\d{1,2}):(\d{1,2})$/);
  if (withColon) {
    hh = withColon[1];
    mm = withColon[2];
  } else {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 3) {
      hh = digits.slice(0, 1);
      mm = digits.slice(1);
    } else if (digits.length === 4) {
      hh = digits.slice(0, 2);
      mm = digits.slice(2);
    } else {
      return "";
    }
  }

  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return "";
  if (h < 0 || h > 23 || m < 0 || m > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const TimeInput24 = ({ value, onChange, className }) => (
  <input
    type="text"
    inputMode="numeric"
    autoComplete="off"
    placeholder="HH:mm"
    className={className}
    value={value}
    onChange={(e) => onChange(normalizeTimeDraft(e.target.value))}
    onBlur={(e) => onChange(to24hTime(e.target.value))}
    pattern="^([01]\\d|2[0-3]):([0-5]\\d)$"
    title="Formato 24 horas (HH:mm)"
  />
);

const normalizarFechaISO = (valor) => {
  if (!valor) return "";
  const str = String(valor).trim();

  // Caso esperado: YYYY-MM-DD o timestamp que inicia con esa fecha.
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  // Fallback defensivo si llega otro formato parseable.
  const dt = new Date(str);
  if (Number.isNaN(dt.getTime())) return "";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const nombreOperador = (operador) => {
  if (!operador) return "";
  if (operador.nombre_completo) return operador.nombre_completo;
  return [operador.nombre, operador.apellido].filter(Boolean).join(" ") || operador.nombre || "";
};

const ReportesTrabajoDiario = ({ modo = "completo" }) => {
  const navigate = useNavigate();
  const soloVisualizacion = modo === "visualizacion";

  const hoy = new Date().toISOString().split("T")[0];

  // Catálogos
  const [areas, setAreas] = useState([]);
  const [operadores, setOperadores] = useState([]);

  // Filtros de tabla
  const [areaId, setAreaId] = useState("");
  const [filtroOperadorId, setFiltroOperadorId] = useState("");
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

  // Filas pendientes en el modal
  const [filasPendientes, setFilasPendientes] = useState([]);

  // Datos tabla
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [contextoUsuarioReporte, setContextoUsuarioReporte] = useState(null);
  const [cargandoContextoUsuario, setCargandoContextoUsuario] = useState(false);
  const [errorContextoUsuario, setErrorContextoUsuario] = useState("");

  // Modal editar
  const [modalEditar, setModalEditar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ operador_id: "", proceso: "", solicitado_por: "", inicio: "", fin: "" });
  const [editErrores, setEditErrores] = useState({});
  const [guardandoEdit, setGuardandoEdit] = useState(false);

  // Vista por operador: lista de fechas
  const [fechasOperador, setFechasOperador] = useState([]);
  const [cargandoFechas, setCargandoFechas] = useState(false);
  const [fechaDetalleActiva, setFechaDetalleActiva] = useState(null);
  const [tarjetasAbiertas, setTarjetasAbiertas] = useState({});

  // Fecha de referencia para mostrar la semana en modo operador
  const [fechaSemanaRef, setFechaSemanaRef] = useState(hoy);
  const fechaRegistro = normalizarFechaISO(
    fechaDetalleActiva || (filtroOperadorId ? fechaSemanaRef : fechaFiltro) || hoy,
  ) || hoy;

  // Calcula lunes y domingo de la semana de una fecha dada
  const calcularSemana = (fechaISO) => {
    const fechaNormalizada = normalizarFechaISO(fechaISO);
    const base = fechaNormalizada ? new Date(`${fechaNormalizada}T00:00:00`) : new Date();
    // día de la semana en lunes=0 … domingo=6
    const dow = (base.getDay() + 6) % 7;
    const lunes = new Date(base);
    lunes.setDate(base.getDate() - dow);
    lunes.setHours(0, 0, 0, 0);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { lunes, domingo, lunesISO: toISO(lunes), domingoISO: toISO(domingo) };
  };

  const semanaActual = calcularSemana(fechaSemanaRef);

  const moverSemana = (deltaDias) => {
    const base = new Date(`${fechaSemanaRef}T00:00:00`);
    base.setDate(base.getDate() + deltaDias);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const dd = String(base.getDate()).padStart(2, "0");
    setFechaSemanaRef(`${yyyy}-${mm}-${dd}`);
    setFechaDetalleActiva(null);
  };

  // Fechas del operador filtradas a la semana visible
  const fechasDeLaSemana = fechasOperador
    .filter(f => f.fecha >= semanaActual.lunesISO && f.fecha <= semanaActual.domingoISO)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // ── Cargar catálogos al montar ──────────────────────────────────────────────
  useEffect(() => {
    fetch(buildApiUrl("/api/reportesTrabajo/catalogos"), { headers: authHeaders() })
      .then(r => {
        if (!r.ok) throw new Error("Error al cargar catálogos");
        return r.json();
      })
      .then((data) => {
      const activas = (data.areas || []).filter(a => a.activo);
      setAreas(activas);
      setOperadores((data.operadores || []).filter(o => o.activo));
    }).catch(() => setError("Error al cargar catálogos"));
  }, [soloVisualizacion]);

  useEffect(() => {
    if (soloVisualizacion) return;

    setCargandoContextoUsuario(true);
    setErrorContextoUsuario("");

    fetch(buildApiUrl("/api/reportesTrabajo/mi-contexto"), { headers: authHeaders() })
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudo cargar la asignación del usuario");
        return r.json();
      })
      .then((data) => {
        setContextoUsuarioReporte(data || null);
        if (data?.area_id && data?.operador_id) {
          const areaAsignada = String(data.area_id);
          const operadorAsignado = String(data.operador_id);
          setAreaId(areaAsignada);
          setFiltroOperadorId(operadorAsignado);
          setModalAreaId(areaAsignada);
          setOperadorId(operadorAsignado);
        }
      })
      .catch((e) => {
        setContextoUsuarioReporte(null);
        setErrorContextoUsuario(e.message || "No se pudo cargar la asignación del usuario");
      })
      .finally(() => setCargandoContextoUsuario(false));
  }, [soloVisualizacion]);

  // Operadores del área seleccionada en la tabla (para el filtro principal)
  const operadoresDelArea = areaId
    ? operadores.filter(o => String(o.area_id) === String(areaId))
    : [];

  // Operadores filtrados para el modal según el área elegida en el modal
  const operadoresFiltrados = modalAreaId
    ? operadores.filter(o => String(o.area_id) === String(modalAreaId))
    : [];

  const ingresoBloqueadoPorAsignacion = !soloVisualizacion && !cargandoContextoUsuario && !contextoUsuarioReporte;

  // ── Cargar fechas con reportes cuando se selecciona un operador ────────────
  useEffect(() => {
    if (!filtroOperadorId) {
      setFechasOperador([]);
      setFechaDetalleActiva(null);
      return;
    }
    setCargandoFechas(true);
    const params = new URLSearchParams({ operador_id: filtroOperadorId });
    if (areaId) params.append("area_id", areaId);
    // En vista por operador no aplicamos rango por defecto (hoy),
    // para mostrar todas las fechas históricas y navegar por semanas.
    fetch(buildApiUrl(`/api/reportesTrabajo/fechas?${params}`), { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const normalizadas = (Array.isArray(data) ? data : [])
          .map((item) => ({
            ...item,
            fecha: normalizarFechaISO(item.fecha),
            total: Number(item.total) || 0,
          }))
          .filter((item) => Boolean(item.fecha));
        setFechasOperador(normalizadas);
        setFechaDetalleActiva(null);
      })
      .catch(() => setFechasOperador([]))
      .finally(() => setCargandoFechas(false));
  }, [filtroOperadorId, areaId]);

  // ── Cargar reportes cuando cambia área o fecha ──────────────────────────────
  useEffect(() => {
    if (!soloVisualizacion && !areaId) { setReportes([]); return; }
    // En modo detalle de operador, sólo cargamos cuando hay fecha activa
    if (!soloVisualizacion && filtroOperadorId && !fechaDetalleActiva) { setReportes([]); return; }
    const fechaUsada = !soloVisualizacion && filtroOperadorId ? fechaDetalleActiva : null;
    setCargando(true);
    setError("");
    const params = new URLSearchParams();
    if (areaId) params.append("area_id", areaId);
    if (!soloVisualizacion && filtroOperadorId) params.append("operador_id", filtroOperadorId);
    if (fechaUsada) {
      params.append("fecha", fechaUsada);
    } else {
      if (fechaFiltro) params.append("fecha", fechaFiltro);
    }
    fetch(buildApiUrl(`/api/reportesTrabajo?${params}`), { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error("Error al cargar reportes"); return r.json(); })
      .then(data => setReportes(data))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, [soloVisualizacion, areaId, fechaFiltro, filtroOperadorId, fechaDetalleActiva]);

  useEffect(() => {
    setTarjetasAbiertas({});
  }, [fechaFiltro]);

  // Filtro client-side (búsqueda de texto + operador)
  const reportesFiltrados = useMemo(() => {
    let lista = reportes;
    if (filtroOperadorId) {
      lista = lista.filter(r => String(r.operador_id) === String(filtroOperadorId));
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(r =>
        r.operador?.toLowerCase().includes(q) ||
        r.proceso?.toLowerCase().includes(q) ||
        r.solicitado_por?.toLowerCase().includes(q)
      );
    }
    return lista;
  }, [reportes, filtroOperadorId, busqueda]);

  const columnasPorArea = useMemo(() => {
    return areas.map((area) => {
      const registrosArea = reportesFiltrados.filter(
        (r) => String(r.area_id) === String(area.id),
      );

      const operadoresMap = new Map();
      registrosArea.forEach((r) => {
        const key = String(r.operador_id);
        if (!operadoresMap.has(key)) {
          operadoresMap.set(key, {
            operador_id: r.operador_id,
            operador: r.operador,
            registros: [],
          });
        }
        operadoresMap.get(key).registros.push(r);
      });

      const operadoresArea = Array.from(operadoresMap.values())
        .map((op) => ({
          ...op,
          registros: [...op.registros].sort((a, b) => (a.inicio || "").localeCompare(b.inicio || "")),
        }))
        .sort((a, b) => (a.operador || "").localeCompare(b.operador || ""));

      return {
        areaId: String(area.id),
        areaNombre: area.nombre,
        total: registrosArea.length,
        operadores: operadoresArea,
      };
    });
  }, [areas, reportesFiltrados]);

  const toggleTarjetaOperador = (areaKey, operadorKey) => {
    const key = `${areaKey}-${operadorKey}`;
    setTarjetasAbiertas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Validación fila actual ───────────────────────────────────────────────────
  const validarFila = () => {
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

  // ── Añadir fila a la lista pendiente ────────────────────────────────────────
  const agregarALista = () => {
    if (!validarFila()) return;
    const areaNombre = areas.find(a => String(a.id) === String(modalAreaId))?.nombre || "";
    const opNombre   = nombreOperador(operadores.find(o => String(o.id) === String(operadorId)));
    setFilasPendientes(prev => [
      ...prev,
      {
        _key: Date.now(),
        area_id: Number(modalAreaId),
        areaNombre,
        operador_id: Number(operadorId),
        opNombre,
        proceso: proceso.trim(),
        solicitado_por: solicitadoPor.trim() || null,
        inicio,
        fin,
      },
    ]);
    // Limpiar solo los campos que cambian entre filas; mantener área y operador
    // La hora de inicio del siguiente proceso se pre-llena con la hora final del anterior
    setProceso(""); setSolicitadoPor(""); setInicio(fin); setFin("");
    setErrores({});
  };

  // ── Cerrar formulario y limpiar ─────────────────────────────────────────────
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setModalAreaId(contextoUsuarioReporte?.area_id ? String(contextoUsuarioReporte.area_id) : "");
    setOperadorId(contextoUsuarioReporte?.operador_id ? String(contextoUsuarioReporte.operador_id) : "");
    setProceso(""); setSolicitadoPor("");
    setInicio(""); setFin(""); setErrores({});
    setFilasPendientes([]);
  };

  const abrirFormulario = () => {
    setModalAreaId(contextoUsuarioReporte?.area_id ? String(contextoUsuarioReporte.area_id) : areaId);
    setOperadorId(contextoUsuarioReporte?.operador_id ? String(contextoUsuarioReporte.operador_id) : operadorId);
    // Pre-llenar inicio con la hora final del último proceso guardado en el área.
    // Si no hay registros del día (primer registro), arrange a las 08:00.
    const ultimoFin = reportes
      .map(r => r.fin)
      .filter(Boolean)
      .sort()
      .at(-1) || "08:00";
    setInicio(ultimoFin);
    setMostrarFormulario(true);
  };

  // ── Guardar todas las filas pendientes ──────────────────────────────────────
  const guardarTodos = async () => {
    if (filasPendientes.length === 0) return;
    setGuardando(true);
    setError("");
    try {
      const resultados = await Promise.all(
        filasPendientes.map(f =>
          fetch(buildApiUrl("/api/reportesTrabajo"), {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
              area_id: f.area_id,
              operador_id: f.operador_id,
              proceso: f.proceso,
              solicitado_por: f.solicitado_por,
              inicio: f.inicio,
              fin: f.fin,
              fecha: fechaRegistro,
            }),
          }).then(r => r.json().then(d => ({ ok: r.ok, data: d })))
        )
      );
      const fallidos = resultados.filter(r => !r.ok);
      if (fallidos.length > 0) throw new Error(fallidos[0].data?.error || "Error al guardar uno o más registros");
      const guardados = resultados.map(r => r.data);

      // Refrescar tarjetas de fechas en caliente para no depender de recargar la página.
      if (filtroOperadorId) {
        setFechasOperador(prev => {
          const acumulado = new Map(
            prev.map(f => [f.fecha, { ...f, total: Number(f.total) || 0 }]),
          );

          guardados.forEach((row) => {
            if (String(row.operador_id) !== String(filtroOperadorId)) return;
            if (areaId && String(row.area_id) !== String(areaId)) return;

            const fechaFila = normalizarFechaISO(row.fecha);
            if (!fechaFila) return;

            const actual = acumulado.get(fechaFila);
            if (actual) {
              actual.total += 1;
            } else {
              acumulado.set(fechaFila, { fecha: fechaFila, total: 1 });
            }
          });

          return Array.from(acumulado.values()).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
        });
      }

      if (filtroOperadorId) {
        setFechaSemanaRef(fechaRegistro);
        setFechaDetalleActiva(fechaRegistro);
      }

      // Agregar a la tabla y reordenar igual que el backend: operador ASC, inicio ASC
      const nuevos = guardados.filter(d => String(d.area_id) === String(areaId));
      if (nuevos.length > 0) {
        setReportes(prev => {
          const combinado = [...prev, ...nuevos];
          combinado.sort((a, b) => {
            const cmpOp = (a.operador || "").localeCompare(b.operador || "");
            if (cmpOp !== 0) return cmpOp;
            return (a.inicio || "").localeCompare(b.inicio || "");
          });
          return combinado;
        });
      }
      cerrarFormulario();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Editar registro ────────────────────────────────────────────────────────
  const abrirEditar = (r) => {
    setEditando(r);
    setEditForm({
      operador_id: String(r.operador_id),
      proceso: r.proceso,
      solicitado_por: r.solicitado_por || "",
      inicio: r.inicio,
      fin: r.fin,
    });
    setEditErrores({});
    setModalEditar(true);
  };
  const cerrarEditar = () => { setModalEditar(false); setEditando(null); };
  const guardarEdicion = async () => {
    const e = {};
    if (!editForm.operador_id) e.operador_id = "Requerido";
    if (!editForm.proceso.trim()) e.proceso = "Requerido";
    if (!editForm.inicio) e.inicio = "Requerido";
    if (!editForm.fin) e.fin = "Requerido";
    if (editForm.inicio && editForm.fin && editForm.fin <= editForm.inicio) e.fin = "Debe ser mayor al inicio";
    if (Object.keys(e).length > 0) return setEditErrores(e);
    setGuardandoEdit(true);
    try {
      const res = await fetch(buildApiUrl(`/api/reportesTrabajo/${editando.id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          area_id: editando.area_id,
          operador_id: editForm.operador_id,
          proceso: editForm.proceso.trim(),
          solicitado_por: editForm.solicitado_por.trim() || null,
          inicio: editForm.inicio,
          fin: editForm.fin,
          fecha: editando.fecha,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setEditErrores({ general: data.error });
      setReportes(prev => {
        const actualizado = prev.map(r => r.id === editando.id ? { ...r, ...data } : r);
        actualizado.sort((a, b) => {
          const cmpOp = (a.operador || "").localeCompare(b.operador || "");
          if (cmpOp !== 0) return cmpOp;
          return (a.inicio || "").localeCompare(b.inicio || "");
        });
        return actualizado;
      });
      cerrarEditar();
    } catch { setEditErrores({ general: "Error de conexión" }); }
    finally { setGuardandoEdit(false); }
  };
  const eliminarReporte = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      const res = await fetch(buildApiUrl(`/api/reportesTrabajo/${id}`), { method: "DELETE", headers: authHeaders() });
      if (!res.ok) { const d = await res.json(); return alert(d.error); }
      setReportes(prev => prev.filter(r => r.id !== id));
    } catch { alert("Error al eliminar"); }
  };

  const inputClass = (campo) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      errores[campo] ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"
    }`;

  // Formatea "2026-04-25" → { diaNombre: "Viernes", fechaDisplay: "25 abr 2026" }
  const formatearFecha = (fechaStr) => {
    const fechaISO = normalizarFechaISO(fechaStr);
    if (!fechaISO) {
      return { diaNombre: "Fecha inválida", fechaDisplay: String(fechaStr || "") };
    }
    const [y, m, d] = fechaISO.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const diaNombre = dt.toLocaleDateString("es-ES", { weekday: "long" });
    const fechaDisplay = dt.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    return {
      diaNombre: diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1),
      fechaDisplay,
    };
  };

  // ── Generar PDF ─────────────────────────────────────────────────────────────
  const generarPDF = async () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth(); // 210 mm
    const areaNombre = areas.find(a => String(a.id) === String(areaId))?.nombre || "";
    const opNombre   = filtroOperadorId
      ? nombreOperador(operadoresDelArea.find(o => String(o.id) === String(filtroOperadorId)))
      : "Todos";

    // ── Logo ──
    const logoUrl = `${API_CONFIG.BASE_URL}/images/logo-mundografic.png`;
    try {
      const resp = await fetch(logoUrl);
      if (resp.ok) {
        const blob = await resp.blob();
        const b64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        doc.addImage(b64, "PNG", 14, 12, 48, 0); // alto=0 → mantiene proporción
      }
    } catch (_) { /* sin logo si falla */ }

    // ── Título (sin fondo) ──
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Trabajo Diario", W / 2, 16, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(
      `MundoGrafic — Generado el ${new Date().toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" })}`,
      W / 2, 22, { align: "center" }
    );

    // Línea divisoria
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(14, 26, W - 14, 26);

    // ── Info del filtro ──
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("Área:", 14, 33);
    doc.setFont("helvetica", "normal");
    doc.text(areaNombre, 26, 33);
    doc.setFont("helvetica", "bold");
    doc.text("Operador:", 90, 33);
    doc.setFont("helvetica", "normal");
    doc.text(opNombre, 110, 33);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", 14, 39);
    doc.setFont("helvetica", "normal");
    const etiquetaFecha = filtroOperadorId
      ? (fechaDetalleActiva || "Selecciona una fecha")
      : (fechaFiltro || "Todas");
    doc.text(etiquetaFecha, 26, 39);

    // ── Tabla ──
    // Ancho total usable: 210 - 14*2 = 182 mm
    const cols = [
      { label: "#",              w: 8  },
      { label: "Operador",       w: 36 },
      { label: "Proceso",        w: 58 },
      { label: "Solicitado por", w: 36 },
      { label: "H. Inicio",      w: 22 },
      { label: "H. Final",       w: 22 },
    ];
    const totalW = cols.reduce((s, c) => s + c.w, 0); // 182

    let x = 14;
    let y = 44;
    const rowH  = 7;
    const headH = 8;

    // Cabecera
    doc.setFillColor(239, 246, 255);
    doc.rect(x, y, totalW, headH, "F");
    doc.setDrawColor(180, 200, 230);
    doc.setLineWidth(0.3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 64, 175);
    let cx = x;
    cols.forEach(c => {
      doc.rect(cx, y, c.w, headH);
      doc.text(c.label, cx + 2, y + 5.5);
      cx += c.w;
    });
    y += headH;

    // Filas de datos
    const lineH = 4.2; // alto de cada línea de texto en mm
    const cellPadV = 2.5; // padding vertical dentro de celda
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);

    reportesFiltrados.forEach((d, idx) => {
      const vals = [
        String(idx + 1),
        d.operador || "",
        d.proceso || "",
        d.solicitado_por || "—",
        d.inicio || "",
        d.fin || "",
      ];

      // Calcular las líneas de texto de cada celda respetando el ancho
      const cellLines = cols.map((c, i) => {
        const txt = String(vals[i]);
        return doc.splitTextToSize(txt, c.w - 4); // 2mm padding c/lado
      });

      // La altura de la fila la determina la celda con más líneas
      const maxLines = Math.max(...cellLines.map(l => l.length));
      const dynRowH = Math.max(rowH, cellPadV * 2 + maxLines * lineH);

      // Salto de página si no cabe la fila completa
      if (y + dynRowH > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        y = 15;
      }

      // Fondo alternado
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y, totalW, dynRowH, "F");
      }

      doc.setDrawColor(220, 225, 235);
      cx = x;
      cols.forEach((c, i) => {
        doc.rect(cx, y, c.w, dynRowH);
        doc.text(cellLines[i], cx + 2, y + cellPadV + lineH * 0.85);
        cx += c.w;
      });
      y += dynRowH;
    });

    // ── Pie de página ──
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      const pH = doc.internal.pageSize.getHeight();
      doc.text(`Total: ${reportesFiltrados.length} registro${reportesFiltrados.length !== 1 ? "s" : ""}`, 14, pH - 5);
      doc.text(`Página ${i} de ${pages}`, W - 14, pH - 5, { align: "right" });
    }

    const etiquetaArchivo = filtroOperadorId
      ? (fechaDetalleActiva || "sin_fecha")
      : `${fechaFiltro || "sin_fecha"}`;
    const nombreArchivo = `reporte_${areaNombre.replace(/\s+/g, "_")}_${etiquetaArchivo}.pdf`;
    doc.save(nombreArchivo);
  };

  return (
    <div className="min-h-screen bg-gray-50" lang="es-EC">

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
              <p className="text-xs text-gray-500 mt-0.5">
                {soloVisualizacion ? "Consulta de reportes cargados por los usuarios" : "Registro y consulta de procesos por área"}
              </p>
            </div>
          </div>
          {!soloVisualizacion && areas.length > 0 && !ingresoBloqueadoPorAsignacion && (
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

        {!soloVisualizacion && cargandoContextoUsuario && (
          <div className="mb-4 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3">
            Resolviendo tu área y operador asignados...
          </div>
        )}

        {!soloVisualizacion && ingresoBloqueadoPorAsignacion && (
          <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
            No tienes un operador de reportes vinculado a tu usuario. Pide a administración que haga la asignación en Gestión de Reportes.
          </div>
        )}

        {!soloVisualizacion && errorContextoUsuario && !ingresoBloqueadoPorAsignacion && (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
            {errorContextoUsuario}
          </div>
        )}

        {/* ── Selectores: Área + Operador ── */}
        {!soloVisualizacion && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          {!soloVisualizacion && contextoUsuarioReporte ? (
            <>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Área de trabajo:</span>
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 text-sm font-medium">
                {contextoUsuarioReporte.area}
              </span>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">Operador:</span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-sm font-medium">
                {contextoUsuarioReporte.operador}
              </span>
            </>
          ) : (
            <>
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Área de trabajo:</label>
              <select
                value={areaId}
                onChange={e => { setAreaId(e.target.value); setFiltroOperadorId(""); setBusqueda(""); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
              >
                <option value="">-- Seleccionar área --</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>

              {areaId && (
                <>
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Operador:</label>
                  <select
                    value={filtroOperadorId}
                    onChange={e => setFiltroOperadorId(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
                  >
                    <option value="">Todos los operadores</option>
                    {operadoresDelArea.map(o => (
                      <option key={o.id} value={o.id}>{nombreOperador(o)}</option>
                    ))}
                  </select>
                </>
              )}
            </>
          )}
        </div>
        )}

        {/* ── Error general ── */}
        {error && (
          <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>
        )}

        {soloVisualizacion ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm">
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

              <div className="flex items-center gap-2 flex-wrap">
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

            {cargando ? (
              <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center text-gray-400">
                Cargando reportes...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {columnasPorArea.map((col) => (
                  <div key={col.areaId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="text-sm font-bold text-gray-800">{col.areaNombre}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {col.total} registro{col.total !== 1 ? "s" : ""}
                      </div>
                    </div>

                    <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
                      {col.operadores.length === 0 ? (
                        <div className="text-xs text-gray-400 py-3 text-center">Sin reportes en esta fecha.</div>
                      ) : (
                        col.operadores.map((op) => {
                          const key = `${col.areaId}-${op.operador_id}`;
                          const abierto = Boolean(tarjetasAbiertas[key]);
                          return (
                            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleTarjetaOperador(col.areaId, op.operador_id)}
                                className="w-full px-3 py-2.5 bg-white hover:bg-blue-50 text-left transition-colors"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-semibold text-gray-800">{op.operador}</span>
                                  <span className="text-xs text-gray-500">{op.registros.length}</span>
                                </div>
                              </button>

                              {abierto && (
                                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-1.5">
                                  {op.registros.map((r) => (
                                    <div key={r.id} className="text-xs text-gray-700 bg-white border border-gray-200 rounded-md px-2.5 py-2">
                                      <div className="font-semibold text-blue-700">{r.inicio} - {r.fin}</div>
                                      <div className="font-medium text-gray-800 mt-0.5">{r.proceso}</div>
                                      {r.solicitado_por && (
                                        <div className="text-gray-500 mt-0.5">Solicitado por: {r.solicitado_por}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : areaId && filtroOperadorId ? (
          /* ── Modo: Operador seleccionado → lista de fechas + detalle ── */
          <>
            {/* Lista de fechas con reportes */}
            <div className="mb-5">

              {/* Filtro de semana por fecha */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <label className="text-sm font-semibold text-gray-600 whitespace-nowrap">Fecha de referencia:</label>
                <input
                  type="date"
                  value={fechaSemanaRef}
                  onChange={e => { setFechaSemanaRef(e.target.value); setFechaDetalleActiva(null); }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {fechaSemanaRef !== hoy && (
                  <button
                    onClick={() => { setFechaSemanaRef(hoy); setFechaDetalleActiva(null); }}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Hoy
                  </button>
                )}
              </div>

              {/* Encabezado de semana con navegación */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => moverSemana(-7)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Semana anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="text-sm font-semibold text-gray-700">
                  {semanaActual.lunes.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                  {" — "}
                  {semanaActual.domingo.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                </div>

                <button
                  onClick={() => moverSemana(7)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 transition-colors"
                  title="Semana siguiente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Tarjetas de fechas */}
              {cargandoFechas ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando fechas...
                </div>
              ) : fechasDeLaSemana.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">
                  {fechasOperador.length === 0
                    ? "Este operador no tiene reportes registrados."
                    : "Sin reportes en esta semana."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[...fechasDeLaSemana].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).map(item => {
                    const { diaNombre, fechaDisplay } = formatearFecha(item.fecha);
                    const activa = fechaDetalleActiva === item.fecha;
                    return (
                      <button
                        key={item.fecha}
                        onClick={() => {
                          const fechaTarjeta = normalizarFechaISO(item.fecha) || hoy;
                          setFechaSemanaRef(fechaTarjeta);
                          setFechaDetalleActiva(activa ? null : fechaTarjeta);
                        }}
                        className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all shadow-sm ${
                          activa
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <span className={`text-xs font-semibold uppercase tracking-wide ${activa ? "text-blue-100" : "text-blue-500"}`}>{diaNombre}</span>
                        <span className="text-sm font-medium mt-0.5">{fechaDisplay}</span>
                        <span className={`text-xs mt-0.5 ${activa ? "text-blue-200" : "text-gray-400"}`}>
                          {item.total} registro{item.total !== 1 ? "s" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detalle al seleccionar fecha */}
            {fechaDetalleActiva && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 text-sm">
                    {(() => { const { diaNombre, fechaDisplay } = formatearFecha(fechaDetalleActiva); return `${diaNombre} ${fechaDisplay}`; })()}
                    <span className="ml-2 text-gray-400 font-normal">
                      — {nombreOperador(operadoresDelArea.find(o => String(o.id) === String(filtroOperadorId)))}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {reportes.length} registro{reportes.length !== 1 ? "s" : ""}
                    </span>
                    {reportes.length > 0 && (
                      <button
                        onClick={generarPDF}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        Descargar PDF
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                        <th className="py-3 px-4 text-left font-semibold">Proceso</th>
                        <th className="py-3 px-4 text-left font-semibold">Solicitado por</th>
                        <th className="py-3 px-4 text-left font-semibold">Hora inicio</th>
                        <th className="py-3 px-4 text-left font-semibold">Hora final</th>
                        {!soloVisualizacion && <th className="py-3 px-4 text-left font-semibold"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cargando ? (
                        <tr>
                          <td colSpan={soloVisualizacion ? 4 : 5} className="text-center py-8 text-gray-400">
                            <div className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Cargando registros...
                            </div>
                          </td>
                        </tr>
                      ) : reportes.length === 0 ? (
                        <tr>
                          <td colSpan={soloVisualizacion ? 4 : 5} className="text-center py-8 text-gray-400">No hay registros para esta fecha.</td>
                        </tr>
                      ) : (
                        reportes.map(d => (
                          <tr key={d.id} className="hover:bg-blue-50 transition-colors">
                            <td className="py-3 px-4 text-gray-700">{d.proceso}</td>
                            <td className="py-3 px-4 text-gray-500">{d.solicitado_por || <span className="text-gray-300">—</span>}</td>
                            <td className="py-3 px-4 text-gray-600">{d.inicio}</td>
                            <td className="py-3 px-4 text-gray-600">{d.fin}</td>
                            {!soloVisualizacion && (
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => abrirEditar(d)} title="Editar" className="text-blue-400 hover:text-blue-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                                    </svg>
                                  </button>
                                  <button onClick={() => eliminarReporte(d.id)} title="Eliminar" className="text-red-400 hover:text-red-600 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Modo normal: filtros por fecha ── */
          <>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm">
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

            {/* Filtro de rango de fechas */}
            <div className="flex items-center gap-2 flex-wrap">
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {reportesFiltrados.length} registro{reportesFiltrados.length !== 1 ? "s" : ""}
                </span>
                {reportesFiltrados.length > 0 && (
                  <>
                    <button
                      onClick={generarPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      Descargar PDF
                    </button>
                    <button
                      disabled
                      title="Próximamente disponible"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg opacity-60 cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Enviar por correo
                    </button>
                  </>
                )}
              </div>
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
                    {!soloVisualizacion && <th className="py-3 px-4 text-left font-semibold"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cargando ? (
                    <tr>
                      <td colSpan={soloVisualizacion ? 5 : 6} className="text-center py-10 text-gray-400">
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
                      <td colSpan={soloVisualizacion ? 5 : 6} className="text-center py-10 text-gray-400">
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
                        {!soloVisualizacion && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => abrirEditar(d)} title="Editar" className="text-blue-400 hover:text-blue-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                                </svg>
                              </button>
                              <button onClick={() => eliminarReporte(d.id)} title="Eliminar" className="text-red-400 hover:text-red-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1m-4 0h10" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* ── Modal: Editar registro ── */}
      {!soloVisualizacion && modalEditar && editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarEditar} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 z-10">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Editar registro</h2>
              <button onClick={cerrarEditar} className="text-gray-400 hover:text-gray-600 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {/* Operador */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Operador <span className="text-red-500">*</span></label>
                <select
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrores.operador_id ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"}`}
                  value={editForm.operador_id}
                  onChange={e => setEditForm(p => ({ ...p, operador_id: e.target.value }))}
                >
                  <option value="">-- Seleccionar --</option>
                  {operadores.filter(o => String(o.area_id) === String(editando.area_id)).map(o => (
                    <option key={o.id} value={o.id}>{nombreOperador(o)}</option>
                  ))}
                </select>
                {editErrores.operador_id && <p className="text-red-500 text-xs mt-1">{editErrores.operador_id}</p>}
              </div>
              {/* Proceso */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proceso <span className="text-red-500">*</span></label>
                <input type="text" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrores.proceso ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"}`}
                  value={editForm.proceso} onChange={e => setEditForm(p => ({ ...p, proceso: e.target.value }))} />
                {editErrores.proceso && <p className="text-red-500 text-xs mt-1">{editErrores.proceso}</p>}
              </div>
              {/* Solicitado por */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Solicitado por</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editForm.solicitado_por} onChange={e => setEditForm(p => ({ ...p, solicitado_por: e.target.value }))} />
              </div>
              {/* Horas */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
                  <TimeInput24
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrores.inicio ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"}`}
                    value={editForm.inicio}
                    onChange={(v) => setEditForm(p => ({ ...p, inicio: v }))}
                  />
                  {editErrores.inicio && <p className="text-red-500 text-xs mt-1">{editErrores.inicio}</p>}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hora final <span className="text-red-500">*</span></label>
                  <TimeInput24
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${editErrores.fin ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"}`}
                    value={editForm.fin}
                    onChange={(v) => setEditForm(p => ({ ...p, fin: v }))}
                  />
                  {editErrores.fin && <p className="text-red-500 text-xs mt-1">{editErrores.fin}</p>}
                </div>
              </div>
              {editErrores.general && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editErrores.general}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={cerrarEditar} className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={guardarEdicion} disabled={guardandoEdit}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors">
                {guardandoEdit ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Agregar registros ── */}
      {!soloVisualizacion && mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarFormulario} />
          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 z-10 flex flex-col max-h-[90vh]">

            {/* Encabezado fijo */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Agregar registros</h2>
                <p className="text-xs text-gray-500 mt-0.5">Llena los campos y pulsa <span className="font-semibold text-blue-600">Añadir a la lista</span>. Al terminar pulsa <span className="font-semibold text-green-600">Guardar todos</span>.</p>
              </div>
              <button onClick={cerrarFormulario} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo scrolleable */}
            <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">

              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-blue-800">
                Fecha de guardado: <span className="font-semibold">{fechaRegistro}</span>
              </div>

              {/* Formulario nueva fila */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">

                {contextoUsuarioReporte ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Área asignada</label>
                      <div className="w-full border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium">
                        {contextoUsuarioReporte.area}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Operador asignado</label>
                      <div className="w-full border border-emerald-200 bg-emerald-50 rounded-lg px-3 py-2 text-sm text-emerald-700 font-medium">
                        {contextoUsuarioReporte.operador}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Área */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Área <span className="text-red-500">*</span></label>
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Operador <span className="text-red-500">*</span></label>
                      <select
                        className={inputClass("operadorId")}
                        value={operadorId}
                        onChange={e => { setOperadorId(e.target.value); setErrores(p => ({ ...p, operadorId: "" })); }}
                        disabled={operadoresFiltrados.length === 0}
                      >
                        <option value="">{operadoresFiltrados.length === 0 ? "Sin operadores en esta área" : "-- Seleccionar operador --"}</option>
                        {operadoresFiltrados.map(o => <option key={o.id} value={o.id}>{nombreOperador(o)}</option>)}
                      </select>
                      {errores.operadorId && <p className="text-red-500 text-xs mt-1">{errores.operadorId}</p>}
                    </div>
                  </>
                )}

                {/* Proceso */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Proceso <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className={inputClass("proceso")}
                    value={proceso}
                    onChange={e => { setProceso(e.target.value); setErrores(p => ({ ...p, proceso: "" })); }}
                    placeholder="Descripción del proceso"
                    onKeyDown={e => e.key === "Enter" && agregarALista()}
                  />
                  {errores.proceso && <p className="text-red-500 text-xs mt-1">{errores.proceso}</p>}
                </div>

                {/* Solicitado por */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Solicitado por</label>
                  <input
                    type="text"
                    className={inputClass("solicitadoPor")}
                    value={solicitadoPor}
                    onChange={e => setSolicitadoPor(e.target.value)}
                    placeholder="Quién lo solicitó (opcional)"
                  />
                </div>

                {/* Horas + botón añadir */}
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hora inicio <span className="text-red-500">*</span></label>
                    <TimeInput24
                      className={inputClass("inicio")}
                      value={inicio}
                      onChange={(v) => { setInicio(v); setErrores(p => ({ ...p, inicio: "", fin: "" })); }}
                    />
                    {errores.inicio && <p className="text-red-500 text-xs mt-1">{errores.inicio}</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Hora final <span className="text-red-500">*</span></label>
                    <TimeInput24
                      className={inputClass("fin")}
                      value={fin}
                      onChange={(v) => { setFin(v); setErrores(p => ({ ...p, fin: "" })); }}
                    />
                    {errores.fin && <p className="text-red-500 text-xs mt-1">{errores.fin}</p>}
                  </div>
                  <button
                    onClick={agregarALista}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir a la lista
                  </button>
                </div>
              </div>

              {/* Lista de filas pendientes */}
              {filasPendientes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Pendientes de guardar ({filasPendientes.length})
                  </p>
                  <div className="space-y-2">
                    {filasPendientes.map((f, idx) => (
                      <div key={f._key} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-gray-800">{f.areaNombre}</span>
                            <span className="text-gray-500">·</span>
                            <span className="text-gray-700">{f.opNombre}</span>
                            <span className="text-gray-500">·</span>
                            <span className="text-gray-600">{f.proceso}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {f.inicio} – {f.fin}
                            {f.solicitado_por && <span className="ml-2 text-gray-400">Solicitado por: {f.solicitado_por}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => setFilasPendientes(prev => prev.filter(r => r._key !== f._key))}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error modal */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
              )}
            </div>

            {/* Pie fijo */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={cerrarFormulario}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTodos}
                disabled={guardando || filasPendientes.length === 0}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {guardando
                  ? "Guardando..."
                  : filasPendientes.length === 0
                    ? "Añade registros a la lista"
                    : `Guardar ${filasPendientes.length} registro${filasPendientes.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesTrabajoDiario;
