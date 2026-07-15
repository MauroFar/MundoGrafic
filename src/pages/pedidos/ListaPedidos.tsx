import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChevronDown, FaPlus } from "react-icons/fa";
import { buildApiUrl } from "../../config/api";

const columnas = [
  { key: "fecha_ingreso_pedido", label: "Fecha ingreso pedido", type: "date" },
  { key: "fecha_entrega", label: "Fecha entrega", type: "date" },
  { key: "responsable", label: "Responsable", type: "text" },
  { key: "cliente", label: "Cliente", type: "text" },
  { key: "descripcion_producto", label: "Descripción producto", type: "text" },
  { key: "cantidad", label: "Cantidad", type: "number" },
  { key: "no_oc", label: "No.Oc", type: "text" },
  { key: "no_op", label: "No.Op", type: "text" },
  { key: "estado", label: "Estado", type: "text" },
  { key: "fase", label: "Fase", type: "text" },
  { key: "no_factura", label: "No.Factura", type: "text" },
  { key: "observaciones", label: "Observaciones", type: "text" },
] as const;

const responsablesSugeridos = [
  "Andres Rivera",
  "Oscar Rivadeneira",
  "Marco Calvache",
  "Xavier Nuñez",
  "Patricio Nuñez",
  "Geovanny Simbaña",
  "Escarlet Guambuguete",
];

const estadosSugeridos = [
  "Sin empezar",
  "En proceso",
  "Atrasado",
  "Completo",
  "Rechazado",
];

const fasesSugeridas = [
  "Aprobación de ficha técnica",
  "Preprensa",
  "Guillotinado",
  "Prensa",
  "Barnizado",
  "Plastificado",
  "Troquelado",
  "Pegado",
  "Terminados MG",
  "Terminados externos",
  "Empaque",
  "Liberado",
  "Facturado",
  "Entregado",
  "Entrega incompleta",
];

type ColumnaKey = typeof columnas[number]["key"];

type CampoConDropdown = "responsable" | "estado" | "fase";

type FilaPedido = Record<ColumnaKey, string> & {
  id: number;
  servidor_id: number | null;
};

const crearFilaVacia = (id: number): FilaPedido => ({
  id,
  servidor_id: null,
  fecha_ingreso_pedido: "",
  fecha_entrega: "",
  responsable: "",
  cliente: "",
  descripcion_producto: "",
  cantidad: "",
  no_oc: "",
  no_op: "",
  estado: "",
  fase: "",
  no_factura: "",
  observaciones: "",
});

const mapPedidoBackendAFila = (pedido: unknown): FilaPedido => {
  const row = (pedido ?? {}) as Record<string, unknown>;
  const servidorId = Number(row.id);
  return {
    id: Number.isFinite(servidorId) ? servidorId : Date.now() + Math.floor(Math.random() * 10000),
    servidor_id: Number.isFinite(servidorId) ? servidorId : null,
    fecha_ingreso_pedido: row.fecha_ingreso_pedido ? String(row.fecha_ingreso_pedido).slice(0, 10) : "",
    fecha_entrega: row.fecha_entrega ? String(row.fecha_entrega).slice(0, 10) : "",
    responsable: row.responsable_nombre ? String(row.responsable_nombre) : "",
    cliente: row.cliente ? String(row.cliente) : "",
    descripcion_producto: row.descripcion_producto ? String(row.descripcion_producto) : "",
    cantidad: row.cantidad === 0 || row.cantidad ? String(row.cantidad) : "",
    no_oc: row.no_oc ? String(row.no_oc) : "",
    no_op: row.no_op ? String(row.no_op) : "",
    estado: row.estado ? String(row.estado) : "",
    fase: row.fase ? String(row.fase) : "",
    no_factura: row.no_factura ? String(row.no_factura) : "",
    observaciones: row.observaciones ? String(row.observaciones) : "",
  };
};

type FiltroActividad = "todas" | "sin_empezar" | "en_proceso" | "atrasado" | "completo" | "rechazo";

const ListaPedidos: React.FC = () => {
  const navigate = useNavigate();
  const [filas, setFilas] = useState<FilaPedido[]>([]);
  const [dropdownAbierto, setDropdownAbierto] = useState<{ id: number; campo: CampoConDropdown } | null>(null);
  const [dropdownFiltroTexto, setDropdownFiltroTexto] = useState<string | null>(null);
  const [guardados, setGuardados] = useState<Record<number, boolean>>({});
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [guardandoFilaId, setGuardandoFilaId] = useState<number | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroActividad>("todas");
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [confirmacionGuardar, setConfirmacionGuardar] = useState<{ abierta: boolean; filaId: number | null }>({
    abierta: false,
    filaId: null,
  });
  const [modalExito, setModalExito] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const agregarFila = () => {
    setFilas((actuales) => [...actuales, crearFilaVacia(Date.now())]);
  };

  useEffect(() => {
    let isMounted = true;

    const cargarPedidos = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(buildApiUrl("/api/lista-pedidos"), {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "No se pudo cargar la lista de pedidos.");
        }

        if (!isMounted) return;

        const pedidos: unknown[] = Array.isArray(data?.pedidos) ? data.pedidos : [];
        if (pedidos.length === 0) {
          setFilas([]);
          setGuardados({});
          setLoadingInicial(false);
          return;
        }

        const filasBackend: FilaPedido[] = pedidos.map(mapPedidoBackendAFila);
        setFilas(filasBackend);
        const guardadosIniciales: Record<number, boolean> = {};
        filasBackend.forEach((fila) => {
          guardadosIniciales[fila.id] = true;
        });
        setGuardados(guardadosIniciales);
        setLoadingInicial(false);
      } catch (error: any) {
        console.error("Error cargando pedidos:", error);
        if (!isMounted) return;
        setFilas([]);
        setGuardados({});
        setModalError(error?.message || "No se pudo cargar la lista de pedidos.");
        setLoadingInicial(false);
      }
    };

    void cargarPedidos();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!dropdownAbierto) return;
    const handleClickFuera = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Si el click fue dentro del dropdown portal o dentro de un wrapper de responsable, no cerrar
      if (target.closest('[data-dropdown-portal]') || target.closest('.responsable-wrapper')) return;
      setDropdownAbierto(null);
      setDropdownFiltroTexto(null);
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, [dropdownAbierto]);

  const actualizarFila = (id: number, campo: ColumnaKey, valor: string) => {
    setFilas((actuales) =>
      actuales.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila))
    );
    setGuardados((actuales) => ({ ...actuales, [id]: false }));
  };

  const guardarFilaTemporal = async (id: number) => {
    const fila = filas.find((item) => item.id === id);
    if (!fila) return;

    if (!fila.fecha_ingreso_pedido || !fila.responsable || !fila.cliente || !fila.descripcion_producto) {
      setModalError("Completa los campos obligatorios: Fecha ingreso pedido, Responsable, Cliente y Descripción producto.");
      return;
    }

    const token = localStorage.getItem("token");
    const payload = {
      fecha_ingreso_pedido: fila.fecha_ingreso_pedido,
      fecha_entrega: fila.fecha_entrega || null,
      responsable_nombre: fila.responsable,
      cliente: fila.cliente,
      descripcion_producto: fila.descripcion_producto,
      cantidad: fila.cantidad,
      no_oc: fila.no_oc,
      no_op: fila.no_op,
      estado: fila.estado || "Sin empezar",
      fase: fila.fase || null,
      no_factura: fila.no_factura,
      observaciones: fila.observaciones,
    };

    const endpoint = fila.servidor_id
      ? buildApiUrl(`/api/lista-pedidos/${fila.servidor_id}`)
      : buildApiUrl("/api/lista-pedidos");
    const method = fila.servidor_id ? "PUT" : "POST";

    try {
      setGuardandoFilaId(id);
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detalle = Array.isArray(data?.detalles) ? `\n${data.detalles.join("\n")}` : "";
        throw new Error((data?.error || "No se pudo guardar el registro.") + detalle);
      }

      const pedidoGuardado = data?.pedido;
      const filaNormalizada = pedidoGuardado ? mapPedidoBackendAFila(pedidoGuardado) : null;
      const servidorId = filaNormalizada?.servidor_id || fila.servidor_id;
      setFilas((actuales) =>
        actuales.map((item) =>
          item.id === id
            ? {
                ...(filaNormalizada || item),
                id,
                servidor_id: servidorId,
              }
            : item
        )
      );
      setGuardados((actuales) => ({ ...actuales, [id]: true }));
      setModalExito("Registro guardado exitosamente.");
    } catch (error: any) {
      console.error("Error guardando pedido:", error);
      setModalError(error?.message || "No se pudo guardar el registro.");
    } finally {
      setGuardandoFilaId(null);
    }
  };

  const eliminarFila = async (id: number) => {
    const fila = filas.find((item) => item.id === id);
    if (!fila) return;

    if (fila.servidor_id) {
      const confirmar = window.confirm("Confirma que deseas eliminar este registro.");
      if (!confirmar) return;

      const token = localStorage.getItem("token");
      try {
        const response = await fetch(buildApiUrl(`/api/lista-pedidos/${fila.servidor_id}`), {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || "No se pudo eliminar el registro.");
        }
      } catch (error: any) {
        console.error("Error eliminando pedido:", error);
        setModalError(error?.message || "No se pudo eliminar el registro.");
        return;
      }
    }

    setFilas((actuales) => {
      const restantes = actuales.filter((fila) => fila.id !== id);
      return restantes;
    });

    setGuardados((actuales) => {
      const siguiente = { ...actuales };
      delete siguiente[id];
      return siguiente;
    });

    setDropdownAbierto((actual) => {
      if (actual?.id === id) return null;
      return actual;
    });
  };

  const estaDropdownAbierto = (id: number, campo: CampoConDropdown) => {
    return dropdownAbierto?.id === id && dropdownAbierto.campo === campo;
  };

  const toggleDropdown = (id: number, campo: CampoConDropdown, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      // Calcular posición del input para el dropdown fijo
      const inputEl = (event.currentTarget as HTMLElement).closest('.responsable-wrapper')?.querySelector('input');
      if (inputEl) {
        const rect = inputEl.getBoundingClientRect();
        const alturaSugerida = 220;
        const espacioAbajo = window.innerHeight - rect.bottom;
        const abrirArriba = espacioAbajo < alturaSugerida && rect.top > alturaSugerida;
        const top = abrirArriba
          ? rect.top + window.scrollY - alturaSugerida - 4
          : rect.bottom + window.scrollY + 4;
        setDropdownCoords({ top, left: rect.left + window.scrollX, width: rect.width });
      }
    }
    setDropdownAbierto((actual) => {
      if (actual?.id === id && actual.campo === campo) return null;
      return { id, campo };
    });
  };

  const cerrarDropdown = () => {
    setDropdownAbierto(null);
    setDropdownFiltroTexto(null);
  };

  const abrirDropdownDesdeInput = (id: number, campo: CampoConDropdown, inputEl: HTMLInputElement, filtrarPorTexto = false) => {
    const rect = inputEl.getBoundingClientRect();
    const alturaSugerida = 220; // altura estimada del dropdown
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abrirArriba = espacioAbajo < alturaSugerida && rect.top > alturaSugerida;
    const top = abrirArriba
      ? rect.top + window.scrollY - alturaSugerida - 4
      : rect.bottom + window.scrollY + 4;
    setDropdownCoords({ top, left: rect.left + window.scrollX, width: rect.width });
    setDropdownAbierto({ id, campo });
    // Solo filtrar por texto si viene de escritura manual; al abrir por click/focus mostrar todos
    setDropdownFiltroTexto(filtrarPorTexto ? inputEl.value : null);
  };

  const obtenerResponsablesFiltrados = (valorActual: string) => {
    // Si hay un texto de filtro activo (escritura manual), filtrar; si no, mostrar todos
    const texto = (dropdownFiltroTexto ?? "").trim().toLowerCase();
    if (!texto) return responsablesSugeridos;
    return responsablesSugeridos.filter((nombre) => nombre.toLowerCase().includes(texto));
  };

  const inputBaseClassName =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const inputClassName = `w-full ${inputBaseClassName}`;
  const columnasGrid =
    "170px 170px 220px 220px 560px 120px 120px 120px 170px 230px 160px 320px 132px";

  const filasConDatos = filas.filter((fila) =>
    Object.entries(fila).some(([clave, valor]) => !["id", "servidor_id"].includes(clave) && String(valor).trim() !== "")
  );

  const normalizarEstado = (estado: string) => estado.toLowerCase().trim();

  const totalActividades = filasConDatos.length;
  const totalSinEmpezar = filasConDatos.filter((fila) => {
    const estado = normalizarEstado(fila.estado);
    return estado === "sin empezar" || estado === "";
  }).length;
  const totalEnProceso = filasConDatos.filter((fila) => normalizarEstado(fila.estado) === "en proceso").length;
  const totalAtrasado = filasConDatos.filter((fila) => normalizarEstado(fila.estado) === "atrasado").length;
  const totalCompleto = filasConDatos.filter((fila) => normalizarEstado(fila.estado) === "completo").length;
  const totalRechazo = filasConDatos.filter((fila) => {
    const estado = normalizarEstado(fila.estado);
    return estado === "rechazado" || estado === "rechazo";
  }).length;
  const porcentajeAvance = totalActividades > 0
    ? Math.round((totalCompleto / totalActividades) * 100)
    : 0;

  const filasFiltradas = (() => {
    switch (filtroActivo) {
      case "sin_empezar":
        return filas.filter((f) => {
          const e = normalizarEstado(f.estado);
          return e === "sin empezar" || e === "";
        });
      case "en_proceso":
        return filas.filter((f) => normalizarEstado(f.estado) === "en proceso");
      case "atrasado":
        return filas.filter((f) => normalizarEstado(f.estado) === "atrasado");
      case "completo":
        return filas.filter((f) => normalizarEstado(f.estado) === "completo");
      case "rechazo":
        return filas.filter((f) => {
          const e = normalizarEstado(f.estado);
          return e === "rechazado" || e === "rechazo";
        });
      default:
        return filas;
    }
  })();

  const toggleFiltro = (filtro: FiltroActividad) => {
    setFiltroActivo((actual) => (actual === filtro ? "todas" : filtro));
  };

  return (
    <div className="-m-4 min-h-[calc(100vh-2rem)] w-full bg-white text-slate-900">
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="relative flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
              <FaArrowLeft className="h-4 w-4" />
              Atrás
            </button>
          </div>

          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Lista de Pedidos
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {/* Actividades — muestra todas */}
            <button
              type="button"
              onClick={() => setFiltroActivo("todas")}
              className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${
                filtroActivo === "todas"
                  ? "border-blue-600 bg-blue-400/80 ring-2 ring-blue-300 scale-[1.03] shadow-md"
                  : "border-blue-400 bg-blue-200/60 hover:bg-blue-300/70 hover:scale-[1.02]"
              }`}
            >
              <p className="text-sm text-slate-700">Actividades</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{totalActividades}</p>
              {filtroActivo === "todas" && <p className="mt-0.5 text-[10px] font-semibold text-blue-800 uppercase tracking-wide">Activo</p>}
            </button>

            {/* Sin Empezar */}
            <button
              type="button"
              onClick={() => toggleFiltro("sin_empezar")}
              className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${
                filtroActivo === "sin_empezar"
                  ? "border-slate-700 bg-slate-400/80 ring-2 ring-slate-300 scale-[1.03] shadow-md"
                  : "border-slate-500 bg-slate-300/70 hover:bg-slate-400/60 hover:scale-[1.02]"
              }`}
            >
              <p className="text-sm text-slate-700">Sin Empezar</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{totalSinEmpezar}</p>
              {filtroActivo === "sin_empezar" && <p className="mt-0.5 text-[10px] font-semibold text-slate-800 uppercase tracking-wide">Activo</p>}
            </button>

            {/* En Proceso */}
            <button
              type="button"
              onClick={() => toggleFiltro("en_proceso")}
              className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${
                filtroActivo === "en_proceso"
                  ? "border-yellow-600 bg-yellow-400/90 ring-2 ring-yellow-300 scale-[1.03] shadow-md"
                  : "border-yellow-500 bg-yellow-300/80 hover:bg-yellow-400/70 hover:scale-[1.02]"
              }`}
            >
              <p className="text-sm text-slate-700">En Proceso</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{totalEnProceso}</p>
              {filtroActivo === "en_proceso" && <p className="mt-0.5 text-[10px] font-semibold text-yellow-900 uppercase tracking-wide">Activo</p>}
            </button>

            {/* Atrasado */}
            <button
              type="button"
              onClick={() => toggleFiltro("atrasado")}
              className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${
                filtroActivo === "atrasado"
                  ? "border-orange-600 bg-orange-400/90 ring-2 ring-orange-300 scale-[1.03] shadow-md"
                  : "border-orange-400 bg-orange-300/80 hover:bg-orange-400/70 hover:scale-[1.02]"
              }`}
            >
              <p className="text-sm text-slate-700">Atrasado</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{totalAtrasado}</p>
              {filtroActivo === "atrasado" && <p className="mt-0.5 text-[10px] font-semibold text-orange-900 uppercase tracking-wide">Activo</p>}
            </button>

            {/* Completo */}
            <button
              type="button"
              onClick={() => toggleFiltro("completo")}
              className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${
                filtroActivo === "completo"
                  ? "border-green-600 bg-green-400/80 ring-2 ring-green-300 scale-[1.03] shadow-md"
                  : "border-green-400 bg-green-300/70 hover:bg-green-400/60 hover:scale-[1.02]"
              }`}
            >
              <p className="text-sm text-slate-700">Completo</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{totalCompleto}</p>
              {filtroActivo === "completo" && <p className="mt-0.5 text-[10px] font-semibold text-green-900 uppercase tracking-wide">Activo</p>}
            </button>

            {/* % Avance — solo informativo, no filtra */}
            <div className="border-2 border-amber-200 bg-amber-100 p-2 text-center rounded">
              <p className="text-sm text-slate-700">% Avance</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{porcentajeAvance}%</p>
            </div>

            {/* Rechazo */}
            <button
              type="button"
              onClick={() => toggleFiltro("rechazo")}
              className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${
                filtroActivo === "rechazo"
                  ? "border-red-700 bg-red-500/90 ring-2 ring-red-300 scale-[1.03] shadow-md"
                  : "border-red-500 bg-red-400/80 hover:bg-red-500/70 hover:scale-[1.02]"
              }`}
            >
              <p className="text-sm text-slate-700">Rechazo</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{totalRechazo}</p>
              {filtroActivo === "rechazo" && <p className="mt-0.5 text-[10px] font-semibold text-red-900 uppercase tracking-wide">Activo</p>}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-2 py-3 sm:px-4">
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50" style={{ minHeight: 'calc(100vh - 280px)' }}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Registro de pedidos</h2>
              {filtroActivo !== "todas" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                  Filtro: {filtroActivo === "sin_empezar" ? "Sin Empezar" : filtroActivo === "en_proceso" ? "En Proceso" : filtroActivo === "atrasado" ? "Atrasado" : filtroActivo === "completo" ? "Completo" : "Rechazo"}
                  <button
                    type="button"
                    onClick={() => setFiltroActivo("todas")}
                    className="ml-0.5 text-cyan-500 hover:text-cyan-800 font-bold leading-none"
                    title="Quitar filtro"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={agregarFila}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-400"
            >
              <FaPlus className="h-4 w-4" />
              Agregar registro
            </button>
          </div>

          <div className="flex-1 overflow-x-auto p-3 sm:p-4">
            <div className="min-w-max space-y-2">
              {filasFiltradas.length > 0 && (
                <>
                  <div
                    className="grid gap-2 rounded-lg bg-slate-100 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                    style={{ gridTemplateColumns: columnasGrid }}
                  >
                    {columnas.map((columna) => (
                      <div key={columna.key} className="truncate">
                        {columna.label}
                      </div>
                    ))}
                    <div className="truncate text-center">Accion</div>
                  </div>

                  {filasFiltradas.map((fila, index) => (
                    <div
                      key={fila.id}
                      className={`grid gap-2 rounded-lg border px-2 py-2 ${
                        index % 2 === 0 ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                      }`}
                      style={{ gridTemplateColumns: columnasGrid }}
                    >
                {columnas.map((columna) => (
                  <div key={`${fila.id}-${columna.key}`} className="relative">
                    {columna.key === "responsable" ? (
                      <div className="relative responsable-wrapper">
                        <input
                          type="text"
                          value={fila.responsable}
                          onFocus={(e) => abrirDropdownDesdeInput(fila.id, "responsable", e.currentTarget, false)}
                          onChange={(event) => {
                            actualizarFila(fila.id, "responsable", event.target.value);
                            abrirDropdownDesdeInput(fila.id, "responsable", event.currentTarget, true);
                          }}
                          className={`${inputBaseClassName} w-full pr-8`}
                        />
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(e) => toggleDropdown(fila.id, "responsable", e)}
                          className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 hover:text-cyan-600"
                        >
                          <FaChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    ) : columna.key === "estado" ? (
                      <select
                        value={fila.estado}
                        onChange={(event) => actualizarFila(fila.id, "estado", event.target.value)}
                        className={inputClassName}
                      >
                        <option value="">Seleccionar</option>
                        {estadosSugeridos.map((estado) => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                    ) : columna.key === "fase" ? (
                      <select
                        value={fila.fase}
                        onChange={(event) => actualizarFila(fila.id, "fase", event.target.value)}
                        className={inputClassName}
                      >
                        <option value="">Seleccionar</option>
                        {fasesSugeridas.map((fase) => (
                          <option key={fase} value={fase}>{fase}</option>
                        ))}
                      </select>
                    ) : columna.key === "observaciones" ? (
                      <textarea
                        value={fila.observaciones}
                        onChange={(event) => actualizarFila(fila.id, "observaciones", event.target.value)}
                        className={inputClassName}
                        rows={2}
                      />
                    ) : (
                      <input
                        type={columna.type}
                        min={columna.key === "cantidad" ? 0 : undefined}
                        value={fila[columna.key]}
                        onChange={(event) => actualizarFila(fila.id, columna.key, event.target.value)}
                        className={inputClassName}
                      />
                    )}
                  </div>
                ))}

                <div className="flex flex-col items-stretch justify-start gap-2">
                  <button
                    type="button"
                    disabled={guardandoFilaId === fila.id}
                    onClick={() => {
                      setConfirmacionGuardar({ abierta: true, filaId: fila.id });
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      guardados[fila.id]
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-cyan-500 text-white hover:bg-cyan-400"
                    }`}
                  >
                    {guardandoFilaId === fila.id ? "Guardando..." : guardados[fila.id] ? "Guardado" : "Guardar"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { void eliminarFila(fila.id); }}
                    className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
                    </div>
                  ))}
                </>
              )}

              {filasFiltradas.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500" style={{ minHeight: 'calc(100vh - 380px)' }}>
                  <div className="text-center px-6 py-12">
                    {loadingInicial ? (
                      <>
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                        <p>Cargando pedidos...</p>
                      </>
                    ) : filtroActivo !== "todas" ? (
                      <>
                        <p className="text-base font-medium text-slate-600 mb-1">Sin resultados</p>
                        <p>No hay pedidos con estado <span className="font-semibold text-slate-700">"{filtroActivo === "sin_empezar" ? "Sin Empezar" : filtroActivo === "en_proceso" ? "En Proceso" : filtroActivo === "atrasado" ? "Atrasado" : filtroActivo === "completo" ? "Completo" : "Rechazo"}"</span>.</p>
                        <button type="button" onClick={() => setFiltroActivo("todas")} className="mt-3 text-xs text-cyan-600 hover:underline">Ver todos los pedidos</button>
                      </>
                    ) : (
                      <>
                        <p className="text-base font-medium text-slate-600 mb-1">No hay pedidos registrados</p>
                        <p>Haz clic en <span className="font-semibold text-slate-700">"Agregar registro"</span> para crear el primero.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portal del dropdown de responsable — fixed para saltar cualquier overflow */}
      {dropdownAbierto?.campo === "responsable" && (() => {
        const filaActiva = filas.find((f) => f.id === dropdownAbierto.id);
        const opciones = obtenerResponsablesFiltrados(filaActiva?.responsable ?? "");
        return (
          <div
            data-dropdown-portal
            className="fixed z-[9999] rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
            style={{ top: dropdownCoords.top, left: dropdownCoords.left, width: Math.max(dropdownCoords.width, 200) }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {opciones.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400">Sin coincidencias</div>
            ) : (
              opciones.map((nombre) => (
                <button
                  key={nombre}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    actualizarFila(dropdownAbierto.id, "responsable", nombre);
                    cerrarDropdown();
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                >
                  {nombre}
                </button>
              ))
            )}
          </div>
        );
      })()}

      {confirmacionGuardar.abierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirmar guardado</h3>
            <p className="mt-2 text-sm text-slate-600">¿Deseas guardar este registro en la base de datos?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmacionGuardar({ abierta: false, filaId: null })}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const filaId = confirmacionGuardar.filaId;
                  setConfirmacionGuardar({ abierta: false, filaId: null });
                  if (filaId !== null) {
                    void guardarFilaTemporal(filaId);
                  }
                }}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-emerald-700">Guardado exitoso</h3>
            <p className="mt-2 text-sm text-slate-600">{modalExito}</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setModalExito(null)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-700">No se pudo guardar</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{modalError}</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setModalError(null)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaPedidos;
