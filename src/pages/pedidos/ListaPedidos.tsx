import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChevronDown, FaPlus } from "react-icons/fa";

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

type FilaPedido = Record<ColumnaKey, string> & { id: number };

const CACHE_KEY = "mg_lista_pedidos_cache_v1";

type CacheListaPedidos = {
  filas: FilaPedido[];
  guardados: Record<number, boolean>;
};

const crearFilaVacia = (id: number): FilaPedido => ({
  id,
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

const leerCache = (): CacheListaPedidos | null => {
  if (typeof window === "undefined") return null;
  try {
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    if (!cacheRaw) return null;

    const cache = JSON.parse(cacheRaw) as CacheListaPedidos;
    if (!Array.isArray(cache?.filas)) return null;

    return {
      filas: cache.filas,
      guardados: cache.guardados || {},
    };
  } catch {
    return null;
  }
};

const ListaPedidos: React.FC = () => {
  const navigate = useNavigate();
  const [filas, setFilas] = useState<FilaPedido[]>(() => {
    const cache = leerCache();
    if (cache?.filas?.length) return cache.filas;
    return [crearFilaVacia(Date.now())];
  });
  const [dropdownAbierto, setDropdownAbierto] = useState<{ id: number; campo: CampoConDropdown } | null>(null);
  const [guardados, setGuardados] = useState<Record<number, boolean>>(() => {
    const cache = leerCache();
    return cache?.guardados || {};
  });

  useEffect(() => {
    try {
      const payload: CacheListaPedidos = { filas, guardados };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Cache best-effort: si falla almacenamiento local, la UI sigue funcionando.
    }
  }, [filas, guardados]);

  const agregarFila = () => {
    setFilas((actuales) => [...actuales, crearFilaVacia(Date.now())]);
  };

  const actualizarFila = (id: number, campo: ColumnaKey, valor: string) => {
    setFilas((actuales) =>
      actuales.map((fila) => (fila.id === id ? { ...fila, [campo]: valor } : fila))
    );
    setGuardados((actuales) => ({ ...actuales, [id]: false }));
  };

  const guardarFilaTemporal = (id: number) => {
    setGuardados((actuales) => ({ ...actuales, [id]: true }));
  };

  const estaDropdownAbierto = (id: number, campo: CampoConDropdown) => {
    return dropdownAbierto?.id === id && dropdownAbierto.campo === campo;
  };

  const toggleDropdown = (id: number, campo: CampoConDropdown) => {
    setDropdownAbierto((actual) => {
      if (actual?.id === id && actual.campo === campo) return null;
      return { id, campo };
    });
  };

  const cerrarDropdown = () => {
    setDropdownAbierto(null);
  };

  const obtenerResponsablesFiltrados = (valorActual: string) => {
    const texto = valorActual.trim().toLowerCase();
    if (!texto) return responsablesSugeridos;
    return responsablesSugeridos.filter((nombre) => nombre.toLowerCase().includes(texto));
  };

  const inputClassName =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100";
  const columnasGrid = "repeat(12, minmax(0, 1fr)) 132px";

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
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Registro de pedidos</h2>
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

          <div className="space-y-2 p-4 sm:p-5">
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

            {filas.map((fila, index) => (
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
                      <div className="relative">
                        <input
                          type="text"
                          value={fila.responsable}
                          onFocus={() => setDropdownAbierto({ id: fila.id, campo: "responsable" })}
                          onBlur={() => setTimeout(cerrarDropdown, 120)}
                          onChange={(event) => {
                            actualizarFila(fila.id, "responsable", event.target.value);
                            setDropdownAbierto({ id: fila.id, campo: "responsable" });
                          }}
                          className={`${inputClassName} pr-8`}
                        />
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => toggleDropdown(fila.id, "responsable")}
                          className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 hover:text-cyan-600"
                        >
                          <FaChevronDown className="h-3 w-3" />
                        </button>

                        {estaDropdownAbierto(fila.id, "responsable") && (
                          <div className="absolute z-30 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                            {obtenerResponsablesFiltrados(fila.responsable).length === 0 ? (
                              <div className="px-2 py-1 text-xs text-slate-500">Sin coincidencias</div>
                            ) : (
                              obtenerResponsablesFiltrados(fila.responsable).map((nombre) => (
                                <button
                                  key={nombre}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    actualizarFila(fila.id, "responsable", nombre);
                                    cerrarDropdown();
                                  }}
                                  className="w-full rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-cyan-50 hover:text-cyan-700"
                                >
                                  {nombre}
                                </button>
                              ))
                            )}
                          </div>
                        )}
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
                        rows={1}
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

                <div className="flex items-start justify-center">
                  <button
                    type="button"
                    onClick={() => guardarFilaTemporal(fila.id)}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      guardados[fila.id]
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-cyan-500 text-white hover:bg-cyan-400"
                    }`}
                  >
                    {guardados[fila.id] ? "Guardado" : "Guardar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListaPedidos;
