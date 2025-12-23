// Configuración del Sistema de Producción
export const PRODUCCION_CONFIG = {
  // Estados del flujo de producción
  ESTADOS: {
    PENDIENTE: 'pendiente',
    EN_PREPRENSA: 'en_preprensa',
    PREPRENSA_COMPLETADA: 'preprensa_completada',
    EN_PRENSA: 'en_prensa',
    PRENSA_COMPLETADA: 'prensa_completada',
    EN_ACABADOS: 'en_acabados',
    ACABADOS_COMPLETADOS: 'acabados_completados',
    EN_CONTROL_CALIDAD: 'en_control_calidad',
    APROBADA: 'aprobada',
    RECHAZADA: 'rechazada',
    PENDIENTE_EMPACADO: 'pendiente_empacado',
    EMPACADO: 'empacado',
    LISTO_ENTREGA: 'listo_entrega',
    EN_TRANSITO: 'en_transito',
    ENTREGADO: 'entregado',
    RECOJO_PENDIENTE: 'recojo_pendiente'
  },

  // Estados específicos por área
  ESTADOS_PREPRENSA: {
    PENDIENTE: 'pendiente',
    EN_PROCESO: 'en_proceso',
    COMPLETADA: 'completada',
    CON_PROBLEMAS: 'con_problemas'
  },

  ESTADOS_PRENSA: {
    PENDIENTE: 'pendiente',
    ASIGNADA: 'asignada',
    EN_IMPRESION: 'en_impresion',
    COMPLETADA: 'completada',
    CON_PROBLEMAS: 'con_problemas'
  },

  ESTADOS_ACABADOS: {
    PENDIENTE: 'pendiente',
    EN_PROCESO: 'en_proceso',
    COMPLETADA: 'completada',
    CON_PROBLEMAS: 'con_problemas'
  },

  ESTADOS_CALIDAD: {
    PENDIENTE: 'pendiente',
    EN_INSPECCION: 'en_inspeccion',
    APROBADA: 'aprobada',
    RECHAZADA: 'rechazada',
    REQUIERE_REVISION: 'requiere_revision'
  },

  ESTADOS_ENTREGA: {
    PENDIENTE: 'pendiente',
    EMPACADO: 'empacado',
    LISTO_ENTREGA: 'listo_entrega',
    EN_TRANSITO: 'en_transito',
    ENTREGADO: 'entregado',
    RECOJO_PENDIENTE: 'recojo_pendiente'
  },

  // Tipos de acabado
  TIPOS_ACABADO: {
    CORTE: 'corte',
    DOBLADO: 'doblado',
    ENCUADERNACION: 'encuadernacion',
    EMPACADO: 'empacado'
  },

  // Métodos de entrega
  METODOS_ENTREGA: {
    RECOJO_CLIENTE: 'recojo_cliente',
    ENVIO_DOMICILIO: 'envio_domicilio',
    ENVIO_OFICINA: 'envio_oficina',
    COURIER: 'courier'
  },

  // Tipos de empaque
  TIPOS_EMPAQUE: {
    CAJA_CARTON: 'caja_carton',
    SOBRE: 'sobre',
    BOLSA_PLASTICO: 'bolsa_plastico',
    TUBO: 'tubo',
    PERSONALIZADO: 'personalizado'
  },

  // Prensas disponibles
  PRENSAS: {
    GTO52: 'GTO52',
    PM52: 'PM52',
    CD102: 'CD102'
  },

  // Criterios de calidad
  CRITERIOS_CALIDAD: {
    IMPRESION: 'impresion',
    CORTE: 'corte',
    DOBLADO: 'doblado',
    ENCUADERNACION: 'encuadernacion',
    EMPACADO: 'empacado',
    CANTIDAD: 'cantidad'
  },

  // Colores para estados
  COLORES_ESTADO: {
    pendiente: 'yellow',
    en_proceso: 'blue',
    completada: 'green',
    aprobada: 'green',
    rechazada: 'red',
    con_problemas: 'red',
    requiere_revision: 'orange',
    en_transito: 'purple',
    entregado: 'green',
    recojo_pendiente: 'orange'
  },

  // Configuración de notificaciones
  NOTIFICACIONES: {
    TIEMPO_VISIBLE: 5000, // 5 segundos
    TIPOS: {
      SUCCESS: 'success',
      ERROR: 'error',
      WARNING: 'warning',
      INFO: 'info'
    }
  },

  // Configuración de paginación
  PAGINACION: {
    ELEMENTOS_POR_PAGINA: 20,
    PAGINAS_VISIBLES: 5
  },

  // Configuración de archivos
  ARCHIVOS: {
    TIPOS_PERMITIDOS: ['pdf', 'ai', 'psd', 'eps', 'jpg', 'png', 'tiff'],
    TAMAÑO_MAXIMO: 50 * 1024 * 1024, // 50MB
    RUTA_UPLOADS: '/uploads/produccion/'
  },

  // Configuración de tiempos
  TIEMPOS: {
    REFRESH_DASHBOARD: 30000, // 30 segundos
    TIMEOUT_API: 10000, // 10 segundos
    DEBOUNCE_BUSQUEDA: 500 // 500ms
  }
};

// Utilidades para el sistema de producción
export const PRODUCCION_UTILS = {
  // Obtener color de estado
  getEstadoColor: (estado) => {
    return PRODUCCION_CONFIG.COLORES_ESTADO[estado] || 'gray';
  },

  // Obtener siguiente estado en el flujo
  getSiguienteEstado: (estadoActual) => {
    const flujo = [
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
      PRODUCCION_CONFIG.ESTADOS.ENTREGADO
    ];

    const indiceActual = flujo.indexOf(estadoActual);
    return indiceActual < flujo.length - 1 ? flujo[indiceActual + 1] : null;
  },

  // Calcular tiempo transcurrido
  calcularTiempoTranscurrido: (fechaInicio, fechaFin = null) => {
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const diferencia = fin - inicio;
    
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return { horas, minutos, totalMinutos: Math.floor(diferencia / (1000 * 60)) };
  },

  // Formatear tiempo
  formatearTiempo: (minutos) => {
    if (minutos < 60) {
      return `${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  },

  // Validar estado de transición
  esTransicionValida: (estadoActual, nuevoEstado) => {
    const transicionesValidas = {
      [PRODUCCION_CONFIG.ESTADOS.PENDIENTE]: [
        PRODUCCION_CONFIG.ESTADOS.EN_PREPRENSA,
        PRODUCCION_CONFIG.ESTADOS.EN_PRENSA
      ],
      [PRODUCCION_CONFIG.ESTADOS.EN_PREPRENSA]: [
        PRODUCCION_CONFIG.ESTADOS.PREPRENSA_COMPLETADA,
        PRODUCCION_CONFIG.ESTADOS.CON_PROBLEMAS
      ],
      [PRODUCCION_CONFIG.ESTADOS.PREPRENSA_COMPLETADA]: [
        PRODUCCION_CONFIG.ESTADOS.EN_PRENSA
      ],
      [PRODUCCION_CONFIG.ESTADOS.EN_PRENSA]: [
        PRODUCCION_CONFIG.ESTADOS.PRENSA_COMPLETADA,
        PRODUCCION_CONFIG.ESTADOS.CON_PROBLEMAS
      ],
      [PRODUCCION_CONFIG.ESTADOS.PRENSA_COMPLETADA]: [
        PRODUCCION_CONFIG.ESTADOS.EN_ACABADOS
      ],
      [PRODUCCION_CONFIG.ESTADOS.EN_ACABADOS]: [
        PRODUCCION_CONFIG.ESTADOS.ACABADOS_COMPLETADOS,
        PRODUCCION_CONFIG.ESTADOS.CON_PROBLEMAS
      ],
      [PRODUCCION_CONFIG.ESTADOS.ACABADOS_COMPLETADOS]: [
        PRODUCCION_CONFIG.ESTADOS.EN_CONTROL_CALIDAD
      ],
      [PRODUCCION_CONFIG.ESTADOS.EN_CONTROL_CALIDAD]: [
        PRODUCCION_CONFIG.ESTADOS.APROBADA,
        PRODUCCION_CONFIG.ESTADOS.REQUIERE_REVISION,
        PRODUCCION_CONFIG.ESTADOS.RECHAZADA
      ],
      [PRODUCCION_CONFIG.ESTADOS.APROBADA]: [
        PRODUCCION_CONFIG.ESTADOS.PENDIENTE_EMPACADO
      ],
      [PRODUCCION_CONFIG.ESTADOS.PENDIENTE_EMPACADO]: [
        PRODUCCION_CONFIG.ESTADOS.EMPACADO
      ],
      [PRODUCCION_CONFIG.ESTADOS.EMPACADO]: [
        PRODUCCION_CONFIG.ESTADOS.LISTO_ENTREGA
      ],
      [PRODUCCION_CONFIG.ESTADOS.LISTO_ENTREGA]: [
        PRODUCCION_CONFIG.ESTADOS.EN_TRANSITO,
        PRODUCCION_CONFIG.ESTADOS.RECOJO_PENDIENTE
      ],
      [PRODUCCION_CONFIG.ESTADOS.EN_TRANSITO]: [
        PRODUCCION_CONFIG.ESTADOS.ENTREGADO
      ],
      [PRODUCCION_CONFIG.ESTADOS.RECOJO_PENDIENTE]: [
        PRODUCCION_CONFIG.ESTADOS.ENTREGADO
      ]
    };

    return transicionesValidas[estadoActual]?.includes(nuevoEstado) || false;
  },

  // Generar número de seguimiento
  generarNumeroSeguimiento: (ordenId, estado) => {
    const timestamp = Date.now().toString(36);
    return `SEG-${ordenId}-${estado.toUpperCase()}-${timestamp}`;
  },

  // Obtener icono de estado
  getIconoEstado: (estado) => {
    const iconos = {
      pendiente: '⏳',
      en_proceso: '🔄',
      completada: '✅',
      aprobada: '✅',
      rechazada: '❌',
      con_problemas: '⚠️',
      requiere_revision: '🔍',
      en_transito: '🚚',
      entregado: '📦',
      recojo_pendiente: '📍'
    };
    return iconos[estado] || '❓';
  }
};

export default PRODUCCION_CONFIG;
