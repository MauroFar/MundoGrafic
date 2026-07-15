// Configuración del Sistema de Producción

export const PRODUCCION_CONFIG = {
  ESTADOS: {
    PENDIENTE: "pendiente",
    EN_PREPRENSA: "en_preprensa",
    PREPRENSA_COMPLETADA: "preprensa_completada",
    EN_PRENSA: "en_prensa",
    PRENSA_COMPLETADA: "prensa_completada",
    EN_ACABADOS: "en_acabados",
    ACABADOS_COMPLETADOS: "acabados_completados",
    EN_CONTROL_CALIDAD: "en_control_calidad",
    APROBADA: "aprobada",
    RECHAZADA: "rechazada",
    PENDIENTE_EMPACADO: "pendiente_empacado",
    EMPACADO: "empacado",
    LISTO_ENTREGA: "listo_entrega",
    EN_TRANSITO: "en_transito",
    ENTREGADO: "entregado",
    RECOJO_PENDIENTE: "recojo_pendiente",
  },

  ESTADOS_PREPRENSA: {
    PENDIENTE: "pendiente",
    EN_PROCESO: "en_proceso",
    COMPLETADA: "completada",
    CON_PROBLEMAS: "con_problemas",
  },

  ESTADOS_PRENSA: {
    PENDIENTE: "pendiente",
    ASIGNADA: "asignada",
    EN_IMPRESION: "en_impresion",
    COMPLETADA: "completada",
    CON_PROBLEMAS: "con_problemas",
  },

  ESTADOS_ACABADOS: {
    PENDIENTE: "pendiente",
    EN_PROCESO: "en_proceso",
    COMPLETADA: "completada",
    CON_PROBLEMAS: "con_problemas",
  },

  ESTADOS_CALIDAD: {
    PENDIENTE: "pendiente",
    EN_INSPECCION: "en_inspeccion",
    APROBADA: "aprobada",
    RECHAZADA: "rechazada",
    REQUIERE_REVISION: "requiere_revision",
  },

  ESTADOS_ENTREGA: {
    PENDIENTE: "pendiente",
    EMPACADO: "empacado",
    LISTO_ENTREGA: "listo_entrega",
    EN_TRANSITO: "en_transito",
    ENTREGADO: "entregado",
    RECOJO_PENDIENTE: "recojo_pendiente",
  },

  TIPOS_ACABADO: {
    CORTE: "corte",
    DOBLADO: "doblado",
    ENCUADERNACION: "encuadernacion",
    EMPACADO: "empacado",
  },

  METODOS_ENTREGA: {
    RECOJO_CLIENTE: "recojo_cliente",
    ENVIO_DOMICILIO: "envio_domicilio",
    ENVIO_OFICINA: "envio_oficina",
    COURIER: "courier",
  },

  TIPOS_EMPAQUE: {
    CAJA_CARTON: "caja_carton",
    SOBRE: "sobre",
    BOLSA_PLASTICO: "bolsa_plastico",
    TUBO: "tubo",
    PERSONALIZADO: "personalizado",
  },

  PRENSAS: {
    GTO52: "GTO52",
    PM52: "PM52",
    CD102: "CD102",
  },

  CRITERIOS_CALIDAD: {
    IMPRESION: "impresion",
    CORTE: "corte",
    DOBLADO: "doblado",
    ENCUADERNACION: "encuadernacion",
    EMPACADO: "empacado",
    CANTIDAD: "cantidad",
  },

  COLORES_ESTADO: {
    pendiente: "yellow",
    en_proceso: "blue",
    completada: "green",
    aprobada: "green",
    rechazada: "red",
    con_problemas: "red",
    requiere_revision: "orange",
    en_transito: "purple",
    entregado: "green",
    recojo_pendiente: "orange",
  } as Record<string, string>,

  NOTIFICACIONES: {
    TIEMPO_VISIBLE: 5000,
    TIPOS: {
      SUCCESS: "success",
      ERROR: "error",
      WARNING: "warning",
      INFO: "info",
    },
  },

  PAGINACION: {
    ELEMENTOS_POR_PAGINA: 20,
    PAGINAS_VISIBLES: 5,
  },

  ARCHIVOS: {
    TIPOS_PERMITIDOS: ["pdf", "ai", "psd", "eps", "jpg", "png", "tiff"],
    TAMAÑO_MAXIMO: 50 * 1024 * 1024, // 50 MB
    RUTA_UPLOADS: "/uploads/produccion/",
  },

  TIEMPOS: {
    REFRESH_DASHBOARD: 30_000,
    TIMEOUT_API: 10_000,
    DEBOUNCE_BUSQUEDA: 500,
  },
} as const;

// ── Utilidades ────────────────────────────────────────────────────────────────

type EstadoKey = keyof typeof PRODUCCION_CONFIG.COLORES_ESTADO;

const FLUJO_ESTADOS = [
  PRODUCCION_CONFIG.ESTADOS.PENDIENTE,
  PRODUCCION_CONFIG.ESTADOS.EN_PREPRENSA,
  PRODUCCION_CONFIG.ESTADOS.PREPRENSA_COMPLETADA,
  PRODUCCION_CONFIG.ESTADOS.EN_PRENSA,
  PRODUCCION_CONFIG.ESTADOS.PRENSA_COMPLETADA,
  PRODUCCION_CONFIG.ESTADOS.EN_ACABADOS,
  PRODUCCION_CONFIG.ESTADOS.ACABADOS_COMPLETADOS,
  PRODUCCION_CONFIG.ESTADOS.EN_CONTROL_CALIDAD,
  PRODUCCION_CONFIG.ESTADOS.APROBADA,
  PRODUCCION_CONFIG.ESTADOS.PENDIENTE_EMPACADO,
  PRODUCCION_CONFIG.ESTADOS.EMPACADO,
  PRODUCCION_CONFIG.ESTADOS.LISTO_ENTREGA,
  PRODUCCION_CONFIG.ESTADOS.ENTREGADO,
] as const;

const ICONOS_ESTADO: Record<string, string> = {
  pendiente: "⏳",
  en_proceso: "🔄",
  completada: "✅",
  aprobada: "✅",
  rechazada: "❌",
  con_problemas: "⚠️",
  requiere_revision: "🔍",
  en_transito: "🚚",
  entregado: "📦",
  recojo_pendiente: "📍",
};

export const PRODUCCION_UTILS = {
  getEstadoColor: (estado: string): string =>
    PRODUCCION_CONFIG.COLORES_ESTADO[estado as EstadoKey] ?? "gray",

  getSiguienteEstado: (estadoActual: string): string | null => {
    const idx = FLUJO_ESTADOS.indexOf(estadoActual as (typeof FLUJO_ESTADOS)[number]);
    return idx >= 0 && idx < FLUJO_ESTADOS.length - 1 ? FLUJO_ESTADOS[idx + 1] : null;
  },

  calcularTiempoTranscurrido: (
    fechaInicio: string | Date,
    fechaFin: string | Date | null = null,
  ): { horas: number; minutos: number; totalMinutos: number } => {
    const inicio = new Date(fechaInicio).getTime();
    const fin = fechaFin ? new Date(fechaFin).getTime() : Date.now();
    const diff = fin - inicio;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { horas, minutos, totalMinutos: Math.floor(diff / (1000 * 60)) };
  },

  formatearTiempo: (minutos: number): string => {
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  },

  getIconoEstado: (estado: string): string => ICONOS_ESTADO[estado] ?? "❓",
};

export default PRODUCCION_CONFIG;
