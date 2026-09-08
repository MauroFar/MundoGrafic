import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChevronDown, FaEllipsisV, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { buildApiUrl } from "../../config/api";

type TipoPedido = "offset" | "digital";
type FiltroActividad = "todas" | "sin_empezar" | "en_proceso" | "atrasado" | "completo" | "rechazo";
type CampoConDropdown = "responsable";

const columnas = [
  { key: "fecha_ingreso_pedido", label: "Fecha ingreso pedido", type: "date" },
  { key: "fecha_aprobacion",     label: "Fecha aprobación",     type: "date" },
  { key: "fecha_entrega",        label: "Fecha entrega",        type: "date" },
  { key: "responsable",          label: "Responsable",          type: "text" },
  { key: "cliente",              label: "Cliente",              type: "text" },
  { key: "descripcion_producto", label: "Descripción producto", type: "text" },
  { key: "cantidad",             label: "Cantidad",             type: "number" },
  { key: "no_oc",                label: "No.Oc",                type: "text" },
  { key: "no_op",                label: "No.Op",                type: "text" },
  { key: "estado",               label: "Estado",               type: "text" },
  { key: "fase",                 label: "Fase",                 type: "text" },
  { key: "no_factura",           label: "No.Factura",           type: "text" },
  { key: "observaciones",        label: "Observaciones",        type: "text" },
] as const;

type ColumnaKey = typeof columnas[number]["key"];

type ClienteCatalogo = {
  id: number;
  nombre_cliente?: string | null;
  empresa_cliente?: string | null;
  empresa?: string | null;
  nombre?: string | null;
  email_cliente?: string | null;
  email?: string | null;
  telefono?: string | null;
};

type FilaPedido = Record<ColumnaKey, string> & {
  id: number;
  servidor_id: number | null;
  cliente_id: number | null;
  tipo: TipoPedido;
};

const responsablesSugeridos = [
  "Andres Rivera", "Oscar Rivadeneira", "Marco Calvache",
  "Xavier Nuñez", "Patricio Nuñez", "Geovanny Simbaña", "Escarlet Guambuguete",
  "Juan Carlos Panchi", "Henry Calderon", "Gustavo Calderon",
];
const estadosSugeridos = ["Sin empezar", "En proceso", "Atrasado", "Completo", "Rechazado"];

const crearFilaVacia = (id: number, tipo: TipoPedido): FilaPedido => ({
  id, servidor_id: null, cliente_id: null, tipo,
  fecha_ingreso_pedido: new Date().toISOString().slice(0, 10),
  fecha_aprobacion: "", fecha_entrega: "", responsable: "", cliente: "",
  descripcion_producto: "", cantidad: "", no_oc: "", no_op: "",
  estado: "", fase: "", no_factura: "", observaciones: "",
});

const mapPedidoBackendAFila = (pedido: unknown): FilaPedido => {
  const row = (pedido ?? {}) as Record<string, unknown>;
  const sid = Number(row.id);
  const clienteId = row.cliente_id != null && row.cliente_id !== '' ? Number(row.cliente_id) : null;
  return {
    id: Number.isFinite(sid) ? sid : Date.now() + Math.floor(Math.random() * 10000),
    servidor_id: Number.isFinite(sid) ? sid : null,
    cliente_id: Number.isFinite(clienteId) ? clienteId : null,
    tipo: row.tipo === "digital" ? "digital" : "offset",
    fecha_ingreso_pedido: row.fecha_ingreso_pedido ? String(row.fecha_ingreso_pedido).slice(0, 10) : "",
    fecha_aprobacion:     row.fecha_aprobacion     ? String(row.fecha_aprobacion).slice(0, 10) : "",
    fecha_entrega:        row.fecha_entrega        ? String(row.fecha_entrega).slice(0, 10) : "",
    responsable:          row.responsable_nombre   ? String(row.responsable_nombre) : "",
    cliente:              row.cliente              ? String(row.cliente) : "",
    descripcion_producto: row.descripcion_producto ? String(row.descripcion_producto) : "",
    cantidad:     row.cantidad === 0 || row.cantidad ? String(row.cantidad) : "",
    no_oc:        row.no_oc       ? String(row.no_oc) : "",
    no_op:        row.no_op       ? String(row.no_op) : "",
    estado:       row.estado      ? String(row.estado) : "",
    fase:         row.fase        ? String(row.fase) : "",
    no_factura:   row.no_factura  ? String(row.no_factura) : "",
    observaciones: row.observaciones ? String(row.observaciones) : "",
  };
};

const ListaPedidos: React.FC = () => {
  const navigate = useNavigate();
  const [tipoPedido, setTipoPedido]           = useState<TipoPedido>("offset");
  const [filas, setFilas]                     = useState<FilaPedido[]>([]);
  const [guardados, setGuardados]             = useState<Record<number, boolean>>({});
  const [loadingInicial, setLoadingInicial]   = useState(true);
  const [loadingActualizar, setLoadingActualizar] = useState(false);
  const [guardandoFilaId, setGuardandoFilaId] = useState<number | null>(null);
  const [filtroActivo, setFiltroActivo]       = useState<FiltroActividad>("todas");
  const [dropdownAbierto, setDropdownAbierto] = useState<{ id: number; campo: CampoConDropdown } | null>(null);
  const [dropdownFiltroTexto, setDropdownFiltroTexto] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords]   = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [clienteDropdownFilaId, setClienteDropdownFilaId] = useState<number | null>(null);
  const [clienteDropdownCoords, setClienteDropdownCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [menuAccionAbierto, setMenuAccionAbierto] = useState<number | null>(null);
  const [menuAccionCoords, setMenuAccionCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const [confirmacionGuardar, setConfirmacionGuardar] = useState<{ abierta: boolean; filaId: number | null }>({ abierta: false, filaId: null });
  const [modalExito, setModalExito]           = useState<string | null>(null);
  const [modalError, setModalError]           = useState<string | null>(null);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>("");
  const [filtroBusqueda, setFiltroBusqueda]     = useState<string>("");
  const [clientesSugeridosPorFila, setClientesSugeridosPorFila] = useState<Record<number, ClienteCatalogo[]>>({});
  const [clienteModalFilaId, setClienteModalFilaId] = useState<number | null>(null);
  const [clienteModalBusqueda, setClienteModalBusqueda] = useState<string>("");
  const [clienteModalClientes, setClienteModalClientes] = useState<ClienteCatalogo[]>([]);
  const [clienteModalLoading, setClienteModalLoading] = useState(false);

  // Refs para scroll horizontal sincronizado (arriba ↔ abajo ↔ header sticky)
  const scrollTopRef    = useRef<HTMLDivElement>(null);
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const scrollHeaderRef = useRef<HTMLDivElement>(null);
  const syncingRef      = useRef(false);

  // Ref del header principal para medir su altura dinámica
  const mainHeaderRef = useRef<HTMLDivElement>(null);
  const [mainHeaderHeight, setMainHeaderHeight] = useState(0);
  useEffect(() => {
    const el = mainHeaderRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setMainHeaderHeight(el.offsetHeight));
    obs.observe(el);
    setMainHeaderHeight(el.offsetHeight);
    return () => obs.disconnect();
  }, []);

  // Sincroniza el ancho del div fantasma superior y el header sticky con el contenido real.
  const ghostTopRef = useRef<HTMLDivElement>(null);
  const ghostHeaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const syncWidth = () => {
      const w = scrollBottomRef.current?.scrollWidth ?? 0;
      if (ghostTopRef.current)    ghostTopRef.current.style.width    = `${w}px`;
      if (ghostHeaderRef.current) ghostHeaderRef.current.style.width = `${w}px`;
    };
    syncWidth();
    const observer = new ResizeObserver(syncWidth);
    if (scrollBottomRef.current) observer.observe(scrollBottomRef.current);
    return () => observer.disconnect();
  });

  const cargarListaPedidos = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(buildApiUrl(`/api/lista-pedidos?tipo=${tipoPedido}`), {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo cargar la lista de pedidos.");
      const pedidos: unknown[] = Array.isArray(data?.pedidos) ? data.pedidos : [];
      const fb: FilaPedido[] = pedidos.map(mapPedidoBackendAFila);
      setFilas((prev) => {
        const localesNoGuardados = prev.filter((f) => f.servidor_id === null);
        return [...localesNoGuardados, ...fb];
      });
      const g: Record<number, boolean> = {};
      fb.forEach((f) => { g[f.id] = true; });
      setGuardados(g);
      return fb;
    } catch (err: any) {
      setModalError(err?.message || "No se pudo cargar la lista de pedidos.");
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoadingInicial(true);
    setFilas([]);
    setGuardados({});
    setFiltroActivo("todas");
    void (async () => {
      try {
        await cargarListaPedidos();
      } finally {
        if (isMounted) setLoadingInicial(false);
      }
    })();
    return () => { isMounted = false; };
  }, [tipoPedido]);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    if (!dropdownAbierto && clienteDropdownFilaId === null) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-dropdown-portal]') || t.closest('.responsable-wrapper') || t.closest('.cliente-wrapper')) return;
      setDropdownAbierto(null);
      setDropdownFiltroTexto(null);
      setClienteDropdownFilaId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownAbierto, clienteDropdownFilaId]);

  useEffect(() => {
    if (menuAccionAbierto === null) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-accion-menu]') || t.closest('.accion-menu-trigger')) return;
      setMenuAccionAbierto(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuAccionAbierto]);

  const agregarFila = () => setFilas((prev) => [...prev, crearFilaVacia(Date.now(), tipoPedido)]);

  const actualizarFila = (id: number, campo: ColumnaKey, valor: string) => {
    setFilas((prev) => prev.map((f) => f.id === id ? { ...f, [campo]: valor } : f));
    setGuardados((prev) => ({ ...prev, [id]: false }));
  };

  const resolverClienteId = async (nombre: string): Promise<number | null> => {
    const texto = nombre.trim();
    if (!texto) return null;
    const resultados = await buscarClientesApi(texto);
    if (!resultados.length) return null;
    const clave = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const match = resultados.find((cliente) => {
      const nombreCliente = cliente.empresa_cliente || cliente.empresa || cliente.nombre_cliente || cliente.nombre || "";
      return clave(nombreCliente) === clave(texto);
    }) ?? resultados[0];
    return match ? Number(match.id) : null;
  };

  const guardarFila = async (id: number) => {
    const fila = filas.find((f) => f.id === id);
    if (!fila) return;
    if (!fila.fecha_ingreso_pedido || !fila.responsable || !fila.cliente || !fila.descripcion_producto) {
      setModalError("Completa los campos obligatorios: Fecha ingreso pedido, Responsable, Cliente y Descripción producto.");
      return;
    }

    let clienteId = fila.cliente_id ?? null;
    if (!clienteId && fila.cliente.trim()) {
      clienteId = await resolverClienteId(fila.cliente);
      if (clienteId) {
        setFilas((prev) => prev.map((f) => f.id === id ? { ...f, cliente_id: clienteId } : f));
      }
    }

    const token = localStorage.getItem("token");
    const payload = {
      tipo: fila.tipo,
      fecha_ingreso_pedido: fila.fecha_ingreso_pedido,
      fecha_aprobacion: fila.fecha_aprobacion || null,
      fecha_entrega: fila.fecha_entrega || null,
      responsable_nombre: fila.responsable,
      cliente: fila.cliente,
      cliente_id: clienteId ?? null,
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
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data?.error || "No se pudo guardar.") + (Array.isArray(data?.detalles) ? `\n${data.detalles.join("\n")}` : ""));
      const fn = data?.pedido ? mapPedidoBackendAFila(data.pedido) : null;
      const sid = fn?.servidor_id || fila.servidor_id;
      setFilas((prev) => prev.map((f) => f.id === id ? { ...(fn || f), id, servidor_id: sid } : f));
      setGuardados((prev) => ({ ...prev, [id]: true }));
      setModalExito("Registro guardado exitosamente.");
    } catch (err: any) {
      setModalError(err?.message || "No se pudo guardar el registro.");
    } finally {
      setGuardandoFilaId(null);
    }
  };

  const eliminarFila = async (id: number) => {
    const fila = filas.find((f) => f.id === id);
    if (!fila) return;
    if (fila.servidor_id) {
      if (!window.confirm("Confirma que deseas eliminar este registro.")) return;
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(buildApiUrl(`/api/lista-pedidos/${fila.servidor_id}`), {
          method: "DELETE",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "No se pudo eliminar.");
      } catch (err: any) {
        setModalError(err?.message || "No se pudo eliminar.");
        return;
      }
    }
    setFilas((prev) => prev.filter((f) => f.id !== id));
    setGuardados((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setDropdownAbierto((prev) => prev?.id === id ? null : prev);
  };

  const abrirDropdown = (id: number, campo: CampoConDropdown, inputEl: HTMLInputElement, filtrarPorTexto = false) => {
    const rect = inputEl.getBoundingClientRect();
    const h = 220;
    const abrirArriba = (window.innerHeight - rect.bottom) < h && rect.top > h;
    setDropdownCoords({
      top: abrirArriba ? rect.top + window.scrollY - h - 4 : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    setDropdownAbierto({ id, campo });
    setDropdownFiltroTexto(filtrarPorTexto ? inputEl.value : null);
  };

  const abrirClienteDropdown = (id: number, inputEl: HTMLInputElement) => {
    const rect = inputEl.getBoundingClientRect();
    const h = 220;
    const abrirArriba = (window.innerHeight - rect.bottom) < h && rect.top > h;
    setClienteDropdownCoords({
      top: abrirArriba ? rect.top + window.scrollY - h - 4 : rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    setClienteDropdownFilaId(id);
  };

  const normalizarCliente = (cliente: any): ClienteCatalogo => ({
    id: Number(cliente.id),
    nombre_cliente: cliente.nombre_cliente ?? cliente.nombre ?? null,
    empresa_cliente: cliente.empresa_cliente ?? cliente.empresa ?? null,
    empresa: cliente.empresa ?? cliente.empresa_cliente ?? null,
    nombre: cliente.nombre ?? cliente.nombre_cliente ?? null,
    email_cliente: cliente.email_cliente ?? cliente.email ?? null,
    email: cliente.email ?? cliente.email_cliente ?? null,
    telefono: cliente.telefono ?? cliente.telefono_cliente ?? null,
  });

  const cargarTodosLosClientes = async (): Promise<ClienteCatalogo[]> => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(buildApiUrl("/api/clientes"), {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || "No se pudo cargar clientes");
      return Array.isArray(data) ? data.map(normalizarCliente) : [];
    } catch (err) {
      console.error("Error cargando clientes:", err);
      return [];
    }
  };

  const buscarClientesApi = async (query: string): Promise<ClienteCatalogo[]> => {
    const texto = query.trim();
    const token = localStorage.getItem("token");
    try {
      if (!texto) {
        return await cargarTodosLosClientes();
      }
      const res = await fetch(buildApiUrl(`/api/clientes/buscar?q=${encodeURIComponent(texto)}`), {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || "No se pudo buscar clientes");
      return Array.isArray(data) ? data.map(normalizarCliente) : [];
    } catch (err) {
      console.error("Error buscando clientes:", err);
      return [];
    }
  };

  const buscarClientesEnFila = async (id: number, valor: string) => {
    const q = valor.trim();
    const resultados = await buscarClientesApi(q);
    setClientesSugeridosPorFila((prev) => ({ ...prev, [id]: resultados.slice(0, 6) }));
  };

  const abrirModalClientes = async (id: number, valorActual: string) => {
    setClienteModalFilaId(id);
    setClienteModalBusqueda(valorActual);
    setClienteModalLoading(true);
    setClienteModalClientes([]);
    const resultados = await buscarClientesApi(valorActual.trim() || "");
    setClienteModalClientes(resultados.slice(0, 30));
    setClienteModalLoading(false);
  };

  const aplicarClienteSeleccionado = (id: number, cliente: ClienteCatalogo) => {
    const nombre = cliente.empresa_cliente || cliente.empresa || cliente.nombre_cliente || cliente.nombre || "";
    actualizarFila(id, "cliente", nombre);
    setFilas((prev) => prev.map((fila) => fila.id === id ? { ...fila, cliente_id: Number(cliente.id) || null } : fila));
    setClientesSugeridosPorFila((prev) => ({ ...prev, [id]: [] }));
    setClienteDropdownFilaId(null);
    setClienteModalFilaId(null);
    setClienteModalBusqueda("");
    setClienteModalClientes([]);
    setClienteModalLoading(false);
  };

  const manejarActualizarLista = async () => {
    setLoadingActualizar(true);
    try {
      await cargarListaPedidos();
      setModalExito("Lista actualizada desde la base de datos.");
    } catch {
      // El error ya se muestra en el modal de error.
    } finally {
      setLoadingActualizar(false);
    }
  };

  const abrirMenuAccion = (id: number, triggerEl: HTMLButtonElement) => {
    const rect = triggerEl.getBoundingClientRect();
    const h = 110;
    const abrirArriba = (window.innerHeight - rect.bottom) < h && rect.top > h;
    setMenuAccionCoords({
      top: abrirArriba ? rect.top + window.scrollY - h - 8 : rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
    setMenuAccionAbierto((prev) => (prev === id ? null : id));
  };

  const toggleDropdown = (id: number, campo: CampoConDropdown, e: React.MouseEvent<HTMLButtonElement>) => {
    const inputEl = (e.currentTarget as HTMLElement).closest('.responsable-wrapper')?.querySelector('input') as HTMLInputElement | null;
    if (inputEl) {
      const rect = inputEl.getBoundingClientRect();
      const h = 220;
      const abrirArriba = (window.innerHeight - rect.bottom) < h && rect.top > h;
      setDropdownCoords({
        top: abrirArriba ? rect.top + window.scrollY - h - 4 : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setDropdownAbierto((prev) => (prev?.id === id && prev.campo === campo) ? null : { id, campo });
    setDropdownFiltroTexto(null);
  };

  const cerrarDropdown = () => { setDropdownAbierto(null); setDropdownFiltroTexto(null); };

  const abrirOrdenTrabajo = (fila: FilaPedido) => {
    const tipoOrden = fila.tipo === "digital" ? "digital" : "offset";
    navigate(`/ordendeTrabajo/crear?tipo=${tipoOrden}`, {
      state: {
        tipoOrden,
        pedidoId: fila.servidor_id,
        clienteId: fila.cliente_id,
        pedidoCliente: fila.cliente,
        pedidoDescripcion: fila.descripcion_producto,
        pedidoCantidad: fila.cantidad,
      },
    });
  };

  const obtenerResponsablesFiltrados = () => {
    const texto = (dropdownFiltroTexto ?? "").trim().toLowerCase();
    return texto ? responsablesSugeridos.filter((n) => n.toLowerCase().includes(texto)) : responsablesSugeridos;
  };

  const norm = (e: string) => e.toLowerCase().trim();

  // ── Base filtrada: fecha_entrega + búsqueda (sin filtro de estado, para que los indicadores reflejen todos los estados del rango)
  // Solo incluye filas con datos para los contadores de los indicadores
  const filasBaseFiltradas = (() => {
    let resultado = filas.filter((f) =>
      Object.entries(f).some(([k, v]) => !["id", "servidor_id", "tipo"].includes(k) && String(v).trim() !== "")
    );

    if (filtroFechaDesde) {
      resultado = resultado.filter((f) => f.fecha_entrega && f.fecha_entrega >= filtroFechaDesde);
    }
    if (filtroFechaHasta) {
      resultado = resultado.filter((f) => f.fecha_entrega && f.fecha_entrega <= filtroFechaHasta);
    }
    if (filtroBusqueda.trim()) {
      const q = filtroBusqueda.trim().toLowerCase();
      resultado = resultado.filter((f) =>
        f.cliente.toLowerCase().includes(q) ||
        f.descripcion_producto.toLowerCase().includes(q)
      );
    }

    return resultado;
  })();

  // ── Indicadores calculados sobre la base filtrada
  const totalActividades = filasBaseFiltradas.length;
  const totalSinEmpezar  = filasBaseFiltradas.filter((f) => { const e = norm(f.estado); return e === "sin empezar" || e === ""; }).length;
  const totalEnProceso   = filasBaseFiltradas.filter((f) => norm(f.estado) === "en proceso").length;
  const totalAtrasado    = filasBaseFiltradas.filter((f) => norm(f.estado) === "atrasado").length;
  const totalCompleto    = filasBaseFiltradas.filter((f) => norm(f.estado) === "completo").length;
  const totalRechazo     = filasBaseFiltradas.filter((f) => { const e = norm(f.estado); return e === "rechazado" || e === "rechazo"; }).length;
  const porcentajeAvance = totalActividades > 0 ? Math.round((totalCompleto / totalActividades) * 100) : 0;

  const toggleFiltro = (filtro: FiltroActividad) => setFiltroActivo((prev) => prev === filtro ? "todas" : filtro);
  const labelFiltro  = (f: FiltroActividad): string => {
    const mapa: Partial<Record<FiltroActividad, string>> = {
      sin_empezar: "Sin Empezar", en_proceso: "En Proceso",
      atrasado: "Atrasado", completo: "Completo", rechazo: "Rechazo",
    };
    return mapa[f] ?? "";
  };

  // ── Filas para la tabla: aplica todos los filtros sobre el total de filas,
  //    incluyendo filas vacías recién creadas (para que "Agregar registro" funcione)
  const filasFiltradas = (() => {
    let resultado = filas;

    // Filtro por estado
    if (filtroActivo === "sin_empezar") resultado = resultado.filter((f) => { const e = norm(f.estado); return e === "sin empezar" || e === ""; });
    else if (filtroActivo === "en_proceso")  resultado = resultado.filter((f) => norm(f.estado) === "en proceso");
    else if (filtroActivo === "atrasado")    resultado = resultado.filter((f) => norm(f.estado) === "atrasado");
    else if (filtroActivo === "completo")    resultado = resultado.filter((f) => norm(f.estado) === "completo");
    else if (filtroActivo === "rechazo")     resultado = resultado.filter((f) => { const e = norm(f.estado); return e === "rechazado" || e === "rechazo"; });

    // Filtro por fecha_entrega: solo aplica a filas que ya tienen fecha_entrega asignada
    if (filtroFechaDesde) {
      resultado = resultado.filter((f) => !f.fecha_entrega || f.fecha_entrega >= filtroFechaDesde);
    }
    if (filtroFechaHasta) {
      resultado = resultado.filter((f) => !f.fecha_entrega || f.fecha_entrega <= filtroFechaHasta);
    }

    // Filtro por búsqueda: solo aplica a filas que ya tienen cliente o descripción
    if (filtroBusqueda.trim()) {
      const q = filtroBusqueda.trim().toLowerCase();
      resultado = resultado.filter((f) =>
        (!f.cliente && !f.descripcion_producto) ||
        f.cliente.toLowerCase().includes(q) ||
        f.descripcion_producto.toLowerCase().includes(q)
      );
    }

    return resultado;
  })();

  const inputBase = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const inputFull = `w-full ${inputBase}`;
  const colsGrid  = "170px 170px 170px 220px 220px 560px 120px 120px 120px 170px 230px 160px 320px 132px";
  const esOffset  = tipoPedido === "offset";

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">

      {/* ── HEADER fixed ── se queda fijo mientras se hace scroll vertical ── */}
      <div ref={mainHeaderRef} className="fixed left-0 right-0 z-20 bg-white shadow-sm" style={{ top: 56 }}>
        <div className="relative flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:px-10 border-b border-slate-200">

          {/* Fila superior: atrás | título + botones tipo (centrado) */}
          <div className="relative flex items-center justify-between gap-3">
            <button type="button" onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300">
              <FaArrowLeft className="h-4 w-4" /> Atrás
            </button>

            {/* Centro absoluto: título + botones */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Lista de Pedidos</h1>
              {/* Botones Offset / Digital */}
              <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <button type="button" onClick={() => setTipoPedido("offset")}
                  className={`px-5 py-2 text-sm font-semibold transition ${esOffset ? "bg-cyan-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                  Offset
                </button>
                <button type="button" onClick={() => setTipoPedido("digital")}
                  className={`px-5 py-2 text-sm font-semibold transition border-l border-slate-200 ${!esOffset ? "bg-violet-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
                  Digital
                </button>
              </div>
            </div>

            {/* Espacio espejo para equilibrar el botón Atrás */}
            <div className="invisible inline-flex items-center gap-2 px-4 py-2 text-sm">
              <FaArrowLeft className="h-4 w-4" /> Atrás
            </div>
          </div>

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              { label: "Actividades", valor: totalActividades, filtro: "todas"       as FiltroActividad, ca: "border-blue-600 bg-blue-400/80 ring-2 ring-blue-300",       ci: "border-blue-400 bg-blue-200/60 hover:bg-blue-300/70",      ta: "text-blue-800"   },
              { label: "Sin Empezar", valor: totalSinEmpezar,  filtro: "sin_empezar" as FiltroActividad, ca: "border-slate-700 bg-slate-400/80 ring-2 ring-slate-300",    ci: "border-slate-500 bg-slate-300/70 hover:bg-slate-400/60",   ta: "text-slate-800"  },
              { label: "En Proceso",  valor: totalEnProceso,   filtro: "en_proceso"  as FiltroActividad, ca: "border-yellow-600 bg-yellow-400/90 ring-2 ring-yellow-300", ci: "border-yellow-500 bg-yellow-300/80 hover:bg-yellow-400/70", ta: "text-yellow-900" },
              { label: "Atrasado",    valor: totalAtrasado,    filtro: "atrasado"    as FiltroActividad, ca: "border-orange-600 bg-orange-400/90 ring-2 ring-orange-300", ci: "border-orange-400 bg-orange-300/80 hover:bg-orange-400/70", ta: "text-orange-900" },
              { label: "Completo",    valor: totalCompleto,    filtro: "completo"    as FiltroActividad, ca: "border-green-600 bg-green-400/80 ring-2 ring-green-300",    ci: "border-green-400 bg-green-300/70 hover:bg-green-400/60",   ta: "text-green-900"  },
            ].map(({ label, valor, filtro, ca, ci, ta }) => (
              <button key={filtro} type="button"
                onClick={() => filtro === "todas" ? setFiltroActivo("todas") : toggleFiltro(filtro)}
                className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${filtroActivo === filtro ? `${ca} scale-[1.03] shadow-md` : ci}`}>
                <p className="text-sm text-slate-700">{label}</p>
                <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{valor}</p>
                {filtroActivo === filtro && <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${ta}`}>Activo</p>}
              </button>
            ))}
            <div className="border-2 border-amber-200 bg-amber-100 p-2 text-center rounded">
              <p className="text-sm text-slate-700">% Avance</p>
              <p className="text-5xl font-light leading-none text-amber-600 drop-shadow-sm">{porcentajeAvance}%</p>
            </div>
            <button type="button" onClick={() => toggleFiltro("rechazo")}
              className={`p-2 text-center transition-all border-2 rounded focus:outline-none ${filtroActivo === "rechazo" ? "border-red-700 bg-red-500/90 ring-2 ring-red-300 scale-[1.03] shadow-md" : "border-red-500 bg-red-400/80 hover:bg-red-500/70"}`}>
              <p className="text-sm text-slate-700">Rechazo</p>
              <p className="text-5xl font-light leading-none text-white drop-shadow-sm">{totalRechazo}</p>
              {filtroActivo === "rechazo" && <p className="mt-0.5 text-[10px] font-semibold text-red-900 uppercase tracking-wide">Activo</p>}
            </button>
          </div>

          {/* ── FILTROS ── */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            {/* Fecha desde */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fecha entrega desde</label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* Fecha hasta */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fecha entrega hasta</label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* Búsqueda por cliente o descripción */}
            <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cliente o descripción de producto</label>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente o producto..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                />
                {filtroBusqueda && (
                  <button
                    type="button"
                    onClick={() => setFiltroBusqueda("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                    aria-label="Limpiar búsqueda"
                  >
                    <FaTimes className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Botón limpiar todo */}
            {(filtroFechaDesde || filtroFechaHasta || filtroBusqueda) && (
              <button
                type="button"
                onClick={() => { setFiltroFechaDesde(""); setFiltroFechaHasta(""); setFiltroBusqueda(""); }}
                className="self-end inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:border-slate-400"
              >
                <FaTimes className="h-3 w-3" /> Limpiar filtros
              </button>
            )}
          </div>

        </div>

        {/* ── Barra "Registro de pedidos + Agregar registro" ── */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Registro de pedidos
              <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${esOffset ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"}`}>
                {esOffset ? "Offset" : "Digital"}
              </span>
            </h2>
            {filtroActivo !== "todas" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                Filtro: {labelFiltro(filtroActivo)}
                <button type="button" onClick={() => setFiltroActivo("todas")} className="ml-0.5 text-cyan-500 hover:text-cyan-800 font-bold">✕</button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={manejarActualizarLista} disabled={loadingActualizar}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              {loadingActualizar ? "Actualizando..." : "Actualizar"}
            </button>
            <button type="button" onClick={agregarFila}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${esOffset ? "bg-cyan-500 hover:bg-cyan-400" : "bg-violet-500 hover:bg-violet-400"}`}>
              <FaPlus className="h-4 w-4" /> Agregar registro
            </button>
          </div>
        </div>

        {/* ── Barra de scroll SUPERIOR ── */}
        <div
          ref={scrollTopRef}
          className="overflow-x-auto px-3 sm:px-4 pt-1 pb-0"
          style={{ overflowY: "hidden" }}
          onScroll={() => {
            if (syncingRef.current) return;
            syncingRef.current = true;
            const left = scrollTopRef.current!.scrollLeft;
            if (scrollBottomRef.current) scrollBottomRef.current.scrollLeft = left;
            if (scrollHeaderRef.current) scrollHeaderRef.current.scrollLeft = left;
            syncingRef.current = false;
          }}
        >
          <div ref={ghostTopRef} className="h-[1px]" aria-hidden="true" />
        </div>

        {/* ── Encabezado de columnas ── */}
        <div
          ref={scrollHeaderRef}
          className="overflow-x-hidden border-b border-slate-200 bg-slate-100"
        >
          <div ref={ghostHeaderRef} className="px-3 sm:px-4 py-0">
            <div
              className="grid gap-2 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
              style={{ gridTemplateColumns: colsGrid }}
            >
              {columnas.map((col) => <div key={col.key} className="truncate">{col.label}</div>)}
              <div className="truncate text-center">Acción</div>
            </div>
          </div>
        </div>

      </div>{/* fin sticky */}

      {/* ── TABLA – solo filas ── */}
      <div className="px-2 py-3 sm:px-4" style={{ paddingTop: mainHeaderHeight > 0 ? `${mainHeaderHeight + 8}px` : '12px' }}>
        <div
          ref={scrollBottomRef}
          className="overflow-x-auto overflow-y-visible p-3 sm:p-4"
          onScroll={() => {
            if (syncingRef.current) return;
            syncingRef.current = true;
            const left = scrollBottomRef.current!.scrollLeft;
            if (scrollTopRef.current)    scrollTopRef.current.scrollLeft    = left;
            if (scrollHeaderRef.current) scrollHeaderRef.current.scrollLeft = left;
            syncingRef.current = false;
          }}
        >
          <div className="min-w-max space-y-2 overflow-visible">
              {filasFiltradas.length > 0 && (
                <>
                  {/* Filas */}
                  {filasFiltradas.map((fila, index) => (
                    <div key={fila.id}
                      className={`grid gap-2 rounded-lg border px-2 py-2 ${index % 2 === 0 ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"}`}
                      style={{ gridTemplateColumns: colsGrid }}>
                      {columnas.map((col) => (
                        <div key={`${fila.id}-${col.key}`} className="relative">
                          {col.key === "responsable" ? (
                            <div className="relative responsable-wrapper">
                              <input type="text" value={fila.responsable}
                                onFocus={(e) => abrirDropdown(fila.id, "responsable", e.currentTarget, false)}
                                onChange={(e) => { actualizarFila(fila.id, "responsable", e.target.value); abrirDropdown(fila.id, "responsable", e.currentTarget, true); }}
                                className={`${inputBase} w-full pr-8`} />
                              <button type="button" onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => toggleDropdown(fila.id, "responsable", e)}
                                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 hover:text-cyan-600">
                                <FaChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          ) : col.key === "cliente" ? (
                            <div className="relative cliente-wrapper">
                              <input
                                type="text"
                                value={fila.cliente}
                                onChange={async (e) => {
                                  const valor = e.target.value;
                                  actualizarFila(fila.id, "cliente", valor);
                                  setClienteDropdownFilaId(fila.id);
                                  abrirClienteDropdown(fila.id, e.currentTarget);
                                  await buscarClientesEnFila(fila.id, valor);
                                }}
                                onFocus={async (e) => {
                                  setClienteDropdownFilaId(fila.id);
                                  abrirClienteDropdown(fila.id, e.currentTarget);
                                  await buscarClientesEnFila(fila.id, fila.cliente);
                                }}
                                className={`${inputBase} w-full pr-9`}
                                placeholder="Cliente"
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={async () => {
                                  await abrirModalClientes(fila.id, fila.cliente);
                                }}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-cyan-600"
                                title="Buscar cliente"
                                aria-label="Buscar cliente"
                              >
                                <FaSearch className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : col.key === "estado" ? (
                            <select value={fila.estado} onChange={(e) => actualizarFila(fila.id, "estado", e.target.value)} className={inputFull}>
                              <option value="">Seleccionar</option>
                              {estadosSugeridos.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : col.key === "fase" ? (
                            <input
                              type="text"
                              value={fila.fase}
                              readOnly
                              placeholder="Sin estado"
                              className={`${inputFull} cursor-not-allowed bg-slate-100 text-slate-600`}
                            />
                          ) : col.key === "no_op" ? (
                            <input
                              type="text"
                              value={fila.no_op}
                              readOnly
                              placeholder="Sin OT"
                              className={`${inputFull} cursor-not-allowed bg-slate-100 text-slate-600`}
                            />
                          ) : col.key === "observaciones" ? (
                            <textarea value={fila.observaciones} onChange={(e) => actualizarFila(fila.id, "observaciones", e.target.value)} className={inputFull} rows={2} />
                          ) : (
                            <input type={col.type} min={col.key === "cantidad" ? 0 : undefined}
                              value={fila[col.key]} onChange={(e) => actualizarFila(fila.id, col.key, e.target.value)} className={inputFull} />
                          )}
                        </div>
                      ))}
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <button
                            type="button"
                            className="accion-menu-trigger flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                            onClick={(e) => abrirMenuAccion(fila.id, e.currentTarget)}
                            aria-label="Acciones del pedido"
                          >
                            <FaEllipsisV className="h-3.5 w-3.5" />
                          </button>
                          {menuAccionAbierto === fila.id && (
                            <div
                              data-accion-menu
                              className="fixed z-[9999] w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                              style={{ top: menuAccionCoords.top, left: menuAccionCoords.left, width: Math.max(menuAccionCoords.width, 160) }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setMenuAccionAbierto(null); if (!guardandoFilaId) void guardarFila(fila.id); }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                disabled={!guardados[fila.id] || guardandoFilaId === fila.id}
                                onClick={() => { setMenuAccionAbierto(null); if (guardados[fila.id]) abrirOrdenTrabajo(fila); }}
                                className={`w-full px-3 py-2 text-left text-xs transition ${!guardados[fila.id] || guardandoFilaId === fila.id ? "cursor-not-allowed text-slate-400" : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"}`}
                              >
                                Orden de trabajo
                              </button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setMenuAccionAbierto(null); void eliminarFila(fila.id); }}
                                className="w-full px-3 py-2 text-left text-xs text-red-600 transition hover:bg-red-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Estado vacío */}
              {filasFiltradas.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500" style={{ minHeight: 'calc(100vh - 380px)' }}>
                  <div className="text-center px-6 py-12">
                    {loadingInicial ? (
                      <>
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                        <p>Cargando pedidos {tipoPedido}...</p>
                      </>
                    ) : filtroActivo !== "todas" || filtroFechaDesde || filtroFechaHasta || filtroBusqueda ? (
                      <>
                        <p className="text-base font-medium text-slate-600 mb-1">Sin resultados</p>
                        <p>No hay pedidos <strong>{tipoPedido}</strong> que coincidan con los filtros aplicados.</p>
                        <button type="button" onClick={() => { setFiltroActivo("todas"); setFiltroFechaDesde(""); setFiltroFechaHasta(""); setFiltroBusqueda(""); }} className="mt-3 text-xs text-cyan-600 hover:underline">Limpiar todos los filtros</button>
                      </>
                    ) : (
                      <>
                        <p className="text-base font-medium text-slate-600 mb-1">No hay pedidos {tipoPedido} registrados</p>
                        <p>Haz clic en <strong>"Agregar registro"</strong> para crear el primero.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* ── DROPDOWN RESPONSABLE PORTAL ── */}
      {dropdownAbierto?.campo === "responsable" && (() => {
        const opciones = obtenerResponsablesFiltrados();
        return (
          <div data-dropdown-portal
            className="fixed z-[9999] rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
            style={{ top: dropdownCoords.top, left: dropdownCoords.left, width: Math.max(dropdownCoords.width, 200) }}
            onMouseDown={(e) => e.preventDefault()}>
            {opciones.length === 0
              ? <div className="px-3 py-2 text-xs text-slate-400">Sin coincidencias</div>
              : opciones.map((nombre) => (
                <button key={nombre} type="button" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { actualizarFila(dropdownAbierto.id, "responsable", nombre); cerrarDropdown(); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                  {nombre}
                </button>
              ))}
          </div>
        );
      })()}

      {/* ── DROPDOWN CLIENTES PORTAL ── */}
      {clienteDropdownFilaId !== null && Array.isArray(clientesSugeridosPorFila[clienteDropdownFilaId]) && clientesSugeridosPorFila[clienteDropdownFilaId].length > 0 && (
        <div
          data-dropdown-portal
          className="fixed z-[9999] rounded-lg border border-slate-200 bg-white p-1 shadow-[0_20px_45px_rgba(15,23,42,0.18)]"
          style={{ top: clienteDropdownCoords.top, left: clienteDropdownCoords.left, width: Math.max(clienteDropdownCoords.width, 200) }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {clientesSugeridosPorFila[clienteDropdownFilaId].map((cliente) => {
            const nombre = cliente.empresa_cliente || cliente.empresa || cliente.nombre_cliente || cliente.nombre || "Cliente";
            return (
              <button
                key={`${clienteDropdownFilaId}-${cliente.id}`}
                type="button"
                className="w-full rounded-md px-2 py-1.5 text-left text-[11px] text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => aplicarClienteSeleccionado(clienteDropdownFilaId, cliente)}
              >
                <span className="block font-medium">{nombre}</span>
                {(cliente.nombre_cliente || cliente.nombre) && (
                  <span className="block text-[10px] text-slate-500">Contacto: {cliente.nombre_cliente || cliente.nombre}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── MODAL CONFIRMACIÓN GUARDAR ── */}
      {confirmacionGuardar.abierta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Confirmar guardado</h3>
            <p className="mb-5 text-sm text-slate-600">¿Deseas guardar este registro en la lista de pedidos <strong>{tipoPedido}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button type="button"
                onClick={() => setConfirmacionGuardar({ abierta: false, filaId: null })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                Cancelar
              </button>
              <button type="button"
                onClick={() => {
                  const id = confirmacionGuardar.filaId;
                  setConfirmacionGuardar({ abierta: false, filaId: null });
                  if (id !== null) void guardarFila(id);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${esOffset ? "bg-cyan-500 hover:bg-cyan-400" : "bg-violet-500 hover:bg-violet-400"}`}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ÉXITO ── */}
      {modalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-lg">✓</span>
              <h3 className="text-base font-semibold text-slate-900">Éxito</h3>
            </div>
            <p className="mb-5 text-sm text-slate-600">{modalExito}</p>
            <div className="flex justify-end">
              <button type="button" onClick={() => setModalExito(null)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CLIENTES ── */}
      {clienteModalFilaId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Seleccionar cliente</h3>
              <button type="button" onClick={() => setClienteModalFilaId(null)} className="text-xl text-slate-500 hover:text-slate-800">×</button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={clienteModalBusqueda}
                onChange={async (e) => {
                  const valor = e.target.value;
                  setClienteModalBusqueda(valor);
                  const resultados = await buscarClientesApi(valor);
                  setClienteModalClientes(resultados.slice(0, 30));
                }}
                placeholder="Buscar por nombre, empresa o correo..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
              {clienteModalLoading ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">Cargando clientes...</div>
              ) : clienteModalClientes.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">No se encontraron clientes.</div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Nombre</th>
                      <th className="px-3 py-2 font-semibold">Empresa</th>
                      <th className="px-3 py-2 font-semibold">Correo</th>
                      <th className="px-3 py-2 font-semibold">Teléfono</th>
                      <th className="px-3 py-2 font-semibold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clienteModalClientes.map((cliente) => {
                      const nombre = cliente.nombre_cliente || cliente.nombre || "-";
                      const empresa = cliente.empresa_cliente || cliente.empresa || "-";
                      const email = cliente.email_cliente || cliente.email || "-";
                      const telefono = cliente.telefono || "-";
                      return (
                        <tr key={cliente.id} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="px-3 py-2">{nombre}</td>
                          <td className="px-3 py-2">{empresa}</td>
                          <td className="px-3 py-2">{email}</td>
                          <td className="px-3 py-2">{telefono}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => aplicarClienteSeleccionado(clienteModalFilaId, cliente)}
                              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-400"
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ERROR ── */}
      {modalError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 text-lg">✕</span>
              <h3 className="text-base font-semibold text-slate-900">Error</h3>
            </div>
            <p className="mb-5 whitespace-pre-wrap text-sm text-slate-600">{modalError}</p>
            <div className="flex justify-end">
              <button type="button" onClick={() => setModalError(null)}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ListaPedidos;
