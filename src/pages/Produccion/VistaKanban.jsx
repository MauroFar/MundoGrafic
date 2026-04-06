import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaClock, 
  FaPlay, 
  FaEye, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaArrowRight,
  FaFilter,
  FaSync,
  FaTimes
} from 'react-icons/fa';
import OrdenDetalleModal from '../../components/OrdenDetalleModal';
import ModalRegistroEjecucion from './ModalRegistroEjecucion';

const VistaKanban = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const QA_STORAGE_KEY = 'mg.qa.gates.v1';
  const QA_QUEUE_KEY = 'mg.qa.queue.v1';

  // Refs para sincronizar scroll horizontal arriba y abajo
  const scrollTopRef = useRef(null);
  const scrollBoardRef = useRef(null);
  const scrollInnerRef = useRef(null);
  const mirrorInnerRef = useRef(null); // div fantasma que da el ancho a la barra superior
  const syncingRef = useRef(false);

  // Sincronizar el ancho del espejo directamente en el DOM (sin state → sin delay)
  useEffect(() => {
    const syncWidth = () => {
      if (scrollBoardRef.current && mirrorInnerRef.current) {
        mirrorInnerRef.current.style.width = scrollBoardRef.current.scrollWidth + 'px';
      }
    };
    syncWidth(); // ejecutar de inmediato

    const observer = new ResizeObserver(syncWidth);
    if (scrollBoardRef.current) observer.observe(scrollBoardRef.current);
    if (scrollInnerRef.current)  observer.observe(scrollInnerRef.current);
    return () => observer.disconnect();
  }); // sin dependencias → corre tras cada render, siempre en sync

  const handleScrollTop = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (scrollBoardRef.current) scrollBoardRef.current.scrollLeft = scrollTopRef.current.scrollLeft;
    syncingRef.current = false;
  }, []);

  const handleScrollBoard = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (scrollTopRef.current) scrollTopRef.current.scrollLeft = scrollBoardRef.current.scrollLeft;
    syncingRef.current = false;
  }, []);
  
  const [ordenes, setOrdenes] = useState({
    pendiente: [],
    en_preprensa: [],
    en_prensa: [],
    en_acabados: [],
    en_control_calidad: [],
    entregado: []
  });
  const [ordenesPendientes, setOrdenesPendientes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [filtroResponsable, setFiltroResponsable] = useState('todos');
  const [busquedaNumero, setBusquedaNumero] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState('');

  const [columnas, setColumnas] = useState([
    { id: 'entregado', titulo: 'Entregado', color: 'green', icono: FaCheckCircle, aliases: ['entregado','completado','facturado'] },
    { id: 'pendiente', titulo: 'En Proceso', color: 'yellow', icono: FaClock, aliases: ['en producción','en proceso','pendiente'] },
    { id: 'en_preprensa', titulo: 'Preprensa', color: 'blue', icono: FaPlay, aliases: ['en preprensa','en pre-prensa','preprensa'] },
    { id: 'en_prensa', titulo: 'Impresión', color: 'purple', icono: FaPlay, aliases: ['en prensa','en impresión'] },
    { id: 'en_acabados', titulo: 'Acabados/Empacado', color: 'orange', icono: FaPlay, aliases: ['en acabados','en empacado'] },
    { id: 'en_control_calidad', titulo: 'Listo p/Entrega', color: 'indigo', icono: FaCheckCircle, aliases: ['en control de calidad','listo para entrega'] }
  ]);
  const [workflowType, setWorkflowType] = useState('digital');
  const [avisoKanban, setAvisoKanban] = useState('');
  const [showOrdenModal, setShowOrdenModal] = useState(false);
  const [ordenDetalleModal, setOrdenDetalleModal] = useState(null);
  const [qaGates, setQaGates] = useState({});
  const [selectorProcesoAbierto, setSelectorProcesoAbierto] = useState(null); // key = `${ordenId}:${columnaId}`
  const [registroEjecucion, setRegistroEjecucion] = useState(null); // { orden, etapa }
  const [kanbanDebug, setKanbanDebug] = useState({
    totalRecibidas: 0,
    totalFiltradas: 0,
    workflowType: 'offset',
    conEstadoDigital: 0,
    sinEstadoDigital: 0,
  });

  const gateKey = (ordenId, etapaId) => `${ordenId}:${etapaId}`;

  const getQaState = (ordenId, etapaId) => {
    return qaGates[gateKey(ordenId, etapaId)] || null;
  };

  const saveQaState = (ordenId, etapaId, estado, observacion = '') => {
    // Actualizar caché local para reflejar inmediatamente en la UI
    setQaGates((prev) => {
      const updated = {
        ...prev,
        [gateKey(ordenId, etapaId)]: { estado, observacion, updatedAt: new Date().toISOString() },
      };
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const upsertQaQueue = async (orden, etapa) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${orden.id}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ etapa_id: etapa.id, etapa_titulo: etapa.titulo }),
      });
    } catch (err) {
      console.error('No se pudo crear QA gate en backend', err);
    }
    // Mantener caché local para compatibilidad con GestionCalidadKanban mientras migramos
    try {
      const raw = localStorage.getItem(QA_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      const itemId = `${orden.id}:${etapa.id}`;
      const nextItem = {
        id: itemId, ordenId: orden.id, numeroOrden: orden.numero_orden,
        cliente: orden.nombre_cliente, producto: orden.concepto || '',
        cantidad: orden.cantidad || '', etapaId: etapa.id, etapaTitulo: etapa.titulo,
        estado: 'pendiente', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      const idx = queue.findIndex((q) => q.id === itemId);
      if (idx >= 0) queue[idx] = { ...queue[idx], ...nextItem };
      else queue.unshift(nextItem);
      localStorage.setItem(QA_QUEUE_KEY, JSON.stringify(queue));
      window.dispatchEvent(new Event('qa-queue-updated'));
    } catch (err) {
      console.error('Error actualizando caché QA', err);
    }
  };

  const clearQaState = (ordenId, etapaId) => {
    setQaGates((prev) => {
      const updated = { ...prev };
      delete updated[gateKey(ordenId, etapaId)];
      localStorage.setItem(QA_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const moverOrdenASiguienteColumna = (orden, columnaActualId) => {
    const idxActual = columnas.findIndex((c) => c.id === columnaActualId);
    if (idxActual < 0 || idxActual >= columnas.length - 1) return;
    moverOrdenAColumna(orden, columnaActualId, columnas[idxActual + 1].id);
  };

  const moverOrdenAColumna = (orden, columnaOrigenId, columnaDestinoId) => {
    if (columnaOrigenId === columnaDestinoId) return;
    setOrdenes((prev) => {
      const origen = (prev[columnaOrigenId] || []).filter((o) => o.id !== orden.id);
      const destino = [...(prev[columnaDestinoId] || []), { ...orden, estado: columnaDestinoId }];
      return {
        ...prev,
        [columnaOrigenId]: origen,
        [columnaDestinoId]: destino,
      };
    });
    clearQaState(orden.id, columnaOrigenId);
    setSelectorProcesoAbierto(null);
  };

  const moverPendienteAColumna = (orden, columnaDestinoId) => {
    setOrdenesPendientes((prev) => prev.filter((o) => o.id !== orden.id));
    setOrdenes((prev) => ({
      ...prev,
      [columnaDestinoId]: [...(prev[columnaDestinoId] || []), { ...orden, estado: columnaDestinoId }],
    }));
    setSelectorProcesoAbierto(null);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QA_STORAGE_KEY);
      if (raw) setQaGates(JSON.parse(raw));
    } catch (err) {
      console.error('No se pudo cargar estado de quality gates', err);
    }
  }, []);

  useEffect(() => {
    if (!selectorProcesoAbierto) return;
    const cerrar = () => setSelectorProcesoAbierto(null);
    window.addEventListener('click', cerrar);
    return () => window.removeEventListener('click', cerrar);
  }, [selectorProcesoAbierto]);

  useEffect(() => {
    const refreshQa = () => {
      try {
        const raw = localStorage.getItem(QA_STORAGE_KEY);
        setQaGates(raw ? JSON.parse(raw) : {});
      } catch {
        setQaGates({});
      }
    };
    window.addEventListener('qa-gates-updated', refreshQa);
    return () => window.removeEventListener('qa-gates-updated', refreshQa);
  }, []);

  useEffect(() => {
    const doLoad = async () => {
      const cols = await cargarWorkflow(workflowType);
      await cargarOrdenes(cols);
    };

    // Cargar al montar / cuando cambian filtros/workflow
    doLoad();

    // Volver a cargar cuando la ventana gana foco o la pestaña se hace visible
    const onFocus = () => { doLoad(); };
    const onVisibility = () => { if (document.visibilityState === 'visible') doLoad(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // cleanup
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line
  }, [filtroResponsable, busquedaActiva, workflowType]);

  // Función pública para recargar workflow y órdenes (útil cuando el usuario pulsa el mismo botón)
  const refreshWorkflowAndOrders = async (tipo) => {
    const cols = await cargarWorkflow(tipo || workflowType);
    await cargarOrdenes(cols);
  };

  const cargarWorkflow = async (tipo) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/workflow?tipo=${tipo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.workflow) {
        console.log('🔁 Workflow raw desde backend:', json.workflow);
        // If requesting digital workflow, prefer to use backend-provided workflow exactly
        if ((tipo || '').toString().toLowerCase() === 'digital') {
          const iconMap = { yellow: FaClock, blue: FaPlay, purple: FaPlay, orange: FaPlay, indigo: FaCheckCircle, green: FaCheckCircle, teal: FaPlay, gray: FaExclamationTriangle };
          const cols = json.workflow.map(s => ({ ...s, icono: iconMap[s.color] || FaPlay }));
          setColumnas(cols);
          return cols;
        }
        console.log('🔁 Workflow desde backend:', json.workflow);
        // choose icons based on color mapping
        const iconMap = { yellow: FaClock, blue: FaPlay, purple: FaPlay, orange: FaPlay, indigo: FaCheckCircle, green: FaCheckCircle, teal: FaPlay, gray: FaExclamationTriangle };
        let cols = json.workflow.map(s => ({ ...s, icono: iconMap[s.color] || FaPlay }));
        // For digital workflows enforce the desired stage order:
        // preprensa, impresion, laminado, troquelado, terminado, producto liberado, entregado
        if ((tipo || '').toString().toLowerCase() === 'digital') {
            const desiredOrder = ['en_preprensa','en_prensa','laminado','troquelado','terminados','liberado','entregado'];
            // normalize helper
            const normalize = (s) => {
              if (!s) return '';
              try {
                return s.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/[_\s]+/g, ' ');
              } catch (e) {
                return s.toString().toLowerCase().trim().replace(/[_\s]+/g, ' ');
              }
            };

            const colsByMatch = [];
            const remaining = [...cols];
            desiredOrder.forEach(desId => {
              const desNorm = normalize(desId);
              // find by id, titulo or aliases
              let foundIndex = remaining.findIndex(c => normalize(c.id || '') === desNorm);
              if (foundIndex === -1) foundIndex = remaining.findIndex(c => normalize(c.titulo || '').includes(desNorm) || desNorm.includes(normalize(c.titulo || '')));
              if (foundIndex === -1) foundIndex = remaining.findIndex(c => (c.aliases || []).map(a => normalize(a)).some(a => a === desNorm || a.includes(desNorm) || desNorm.includes(a)));
              if (foundIndex > -1) {
                colsByMatch.push(remaining[foundIndex]);
                remaining.splice(foundIndex, 1);
              }
            });
            // Append any remaining columns (not in desired order) after the ordered ones
            cols = [...colsByMatch, ...remaining];

            // Ensure expected stages exist even if backend omitted them: add lightweight fallbacks
              const expected = [
                { id: 'en_preprensa', titulo: 'Preprensa', color: 'blue' },
                { id: 'en_prensa', titulo: 'Impresión', color: 'purple' },
                { id: 'laminado', titulo: 'Laminado/Barnizado', color: 'orange' },
                { id: 'troquelado', titulo: 'Troquelado', color: 'teal' },
                { id: 'terminados', titulo: 'Terminados', color: 'yellow' },
                { id: 'liberado', titulo: 'Producto Liberado', color: 'gray' },
                { id: 'entregado', titulo: 'Producto Entregado', color: 'green' }
              ];
              const existingIds = new Set(cols.map(c => c.id));
              expected.forEach(exp => {
                if (!existingIds.has(exp.id)) {
                  cols.push({ id: exp.id, titulo: exp.titulo, color: exp.color, aliases: [exp.id], icono: iconMap[exp.color] || FaPlay });
                }
              });
          } else {
          // For non-digital (offset) keep the backend order but ensure 'entregado' is visible first
          const idx = cols.findIndex(c => c.id === 'entregado');
          if (idx > -1) {
            const [entregadoCol] = cols.splice(idx, 1);
            cols.unshift(entregadoCol);
          }
        }
        // Dedupe columns by id preserving order. Merge singular/plural duplicates (e.g. 'terminado' vs 'terminados')
        const uniqueCols = [];
        const normIndex = {}; // normalized id -> index in uniqueCols
        const normalizeId = (id) => (id || '').toString().toLowerCase().trim().replace(/s$/, '');

        cols.forEach(c => {
          if (!c || !c.id) return;
          const norm = normalizeId(c.id);
          if (normIndex[norm] === undefined) {
            // first time we see this normalized id
            normIndex[norm] = uniqueCols.length;
            // make shallow copy to avoid mutating backend object
            uniqueCols.push({ ...c, aliases: Array.isArray(c.aliases) ? [...c.aliases] : [] });
          } else {
            // merge with existing
            const idx = normIndex[norm];
            const existing = uniqueCols[idx];
            // union aliases
            existing.aliases = Array.from(new Set([...(existing.aliases || []), ...(c.aliases || [])]));
            // prefer plural id/title if available
            const existingIsPlural = (existing.id || '').toString().endsWith('s');
            const newIsPlural = (c.id || '').toString().endsWith('s');
            if (!existingIsPlural && newIsPlural) {
              // replace id/title/color/icon with plural variant
              existing.id = c.id;
              existing.titulo = c.titulo;
              existing.color = c.color || existing.color;
              existing.icono = c.icono || existing.icono;
            } else {
              // keep existing but ensure color/icon exist
              existing.color = existing.color || c.color;
              existing.icono = existing.icono || c.icono;
            }
          }
        });

        console.log('🔁 Columnas procesadas para Kanban (unicas):', uniqueCols.map(c => ({ id: c.id, titulo: c.titulo })));
        setColumnas(uniqueCols);
        return uniqueCols;
      }
      return null;
    } catch (err) {
      console.error('Error cargando workflow', err);
    }
  };

  const cargarOrdenes = async (colsParam) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/ordenes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar órdenes de producción');
      }

      const data = await response.json();
      console.log('📦 Órdenes recibidas del backend:', data);
      // Debug: log each order's id, estado and tipo_orden to diagnose filtering
      try {
        if (Array.isArray(data.ordenes)) {
          data.ordenes.forEach(o => console.debug(`🔎 Orden recibido id=${o.id} numero=${o.numero_orden} estado='${o.estado}' tipo_orden='${o.tipo_orden}'`));
        }
      } catch (e) {
        console.error('Error al depurar órdenes recibidas', e);
      }

      // Inicializar las columnas vacías dinámicamente
      const colsToUse = colsParam || columnas;
      const ordenesAgrupadas = {};
      colsToUse.forEach(c => { ordenesAgrupadas[c.id] = []; });

      // Filtrar por tipo de orden (offset|digital)
      const allOrdenes = (data.ordenes || []);
      // Log counts per tipo_orden for debugging
      const countsByTipo = allOrdenes.reduce((acc, o) => {
        const t = ((o.tipo_orden || 'offset') + '').toString().toLowerCase();
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      console.debug('📊 Conteo por tipo_orden recibido:', countsByTipo);
      let ordenesFiltradas = allOrdenes.filter(o => {
        const tipoOrdenRaw = (o.tipo_orden || '').toString().toLowerCase().trim();
        const esDigitalPorEstado = Boolean(o.estado_digital_key) || Boolean(o.estado_orden_digital_id);
        const tipoInferido = tipoOrdenRaw === 'digital' || esDigitalPorEstado ? 'digital' : 'offset';
        const keep = tipoInferido === workflowType;
        if (!keep) {
          console.debug(
            `⛔ Orden ${o.id} filtrada (tipo_raw='${tipoOrdenRaw}', tipo_inferido='${tipoInferido}', workflowType='${workflowType}')`,
          );
        }
        return keep;
      });

      // Fallback de seguridad: si el filtro por tipo deja la vista vacia pero hay datos,
      // mostramos todo para evitar pantalla en blanco y facilitar diagnostico.
      if (ordenesFiltradas.length === 0 && allOrdenes.length > 0) {
        ordenesFiltradas = allOrdenes;
        setAvisoKanban('No hubo coincidencias por tipo/estado; se muestran todas las ordenes temporalmente.');
      } else {
        setAvisoKanban('');
      }

      const conEstadoDigital = allOrdenes.filter(o => Boolean(o.estado_digital_key) || Boolean(o.estado_orden_digital_id)).length;
      const sinEstadoDigital = allOrdenes.filter(o => ((o.tipo_orden || '').toString().toLowerCase().trim() === 'digital') && !o.estado_digital_key && !o.estado_orden_digital_id).length;
      console.debug(`✅ Órdenes tras filtrado por tipo ('${workflowType}'): ${ordenesFiltradas.length} de ${allOrdenes.length}`);

      // Filtrar por número de orden si hay búsqueda activa
      if (busquedaActiva && busquedaActiva.trim() !== '') {
        const busqueda = busquedaActiva.toLowerCase().trim();
        ordenesFiltradas = ordenesFiltradas.filter(orden => 
          orden.numero_orden?.toLowerCase().includes(busqueda)
        );
      }

      setKanbanDebug({
        totalRecibidas: allOrdenes.length,
        totalFiltradas: ordenesFiltradas.length,
        workflowType,
        conEstadoDigital,
        sinEstadoDigital,
      });

      // Agrupar las órdenes por estado utilizando aliases definidos en columnas
      const normalize = (s) => {
        if (!s) return '';
        try {
          return s.toString()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .trim()
            .replace(/^en\s+/, '')
            .replace(/[_\s]+/g, ' ');
        } catch (e) {
          return s.toString().toLowerCase().trim().replace(/[_\s]+/g, ' ');
        }
      };

      if (ordenesFiltradas && Array.isArray(ordenesFiltradas)) {
        const unmatched = new Set();
        const pendientes = [];
        const estadosSinAsignar = new Set(['pendiente', 'por iniciar', 'sin iniciar', '']);

        ordenesFiltradas.forEach(orden => {
          const estadoRaw = String(orden.estado || '');
          const estadoNorm = normalize(estadoRaw);

          if (estadosSinAsignar.has(estadoNorm)) {
            pendientes.push({ ...orden, responsable_actual: orden.vendedor || 'Sin asignar' });
            return;
          }

          let matched = false;
          for (let i = 0; i < colsToUse.length; i++) {
            const col = colsToUse[i];
            // build a robust alias set including normalized aliases, titulo and id variants
            const aliases = new Set((col.aliases || []).map(a => normalize(a)));
            aliases.add(normalize(col.titulo || ''));
            const colIdNorm = normalize(col.id || '');
            aliases.add(colIdNorm);
            aliases.add(colIdNorm.replace(/[_\s]+/g, ''));
            aliases.add(colIdNorm.replace(/[_\s]+/g, ' '));
            // add singular/plural heuristic
            if (colIdNorm.endsWith('s')) aliases.add(colIdNorm.replace(/s$/, ''));
            else aliases.add(colIdNorm + 's');

            const aliasArray = Array.from(aliases).filter(Boolean);

            // Match if estado equals or includes an alias, or viceversa
            const aliasMatch = aliasArray.some(a => a && (estadoNorm === a || estadoNorm.includes(a) || a.includes(estadoNorm)));
            const idMatch = colIdNorm && (estadoNorm === colIdNorm || estadoNorm.includes(colIdNorm) || colIdNorm.includes(estadoNorm));

            if (aliasMatch || idMatch) {
              console.debug(`🧭 Match orden ${orden.id} estado='${estadoRaw}' -> columna='${col.id}' (estadoNorm='${estadoNorm}')`);
              ordenesAgrupadas[col.id].push({ ...orden, responsable_actual: orden.vendedor || orden.preprensa || orden.prensa || orden.terminados || 'Sin asignar' });
              matched = true;
              break;
            } else {
              console.debug(`--- intentar orden ${orden.id} estado='${estadoRaw}' contra columna='${col.id}': aliases=${JSON.stringify(aliasArray)}`);
            }
          }
          if (!matched) {
            // Fallback: si no coincide con ninguna columna, va a pendientes
            pendientes.push({ ...orden, responsable_actual: orden.vendedor || 'Sin asignar' });
            unmatched.add(estadoRaw);
          }
        });

        setOrdenesPendientes(pendientes);
        if (unmatched.size > 0) console.warn('⚠️ Estados sin match en Kanban (ir a aliases en workflow):', Array.from(unmatched));
      }

      console.log('✅ Órdenes agrupadas:', ordenesAgrupadas);
      setOrdenes(ordenesAgrupadas);
    } catch (error) {
      console.error('❌ Error al cargar órdenes:', error);
      setAvisoKanban('No se pudieron cargar ordenes de Kanban. Revisa token/permisos o endpoint.');
      // Mantener las columnas vacías en caso de error
      const colsToUse = colsParam || columnas;
      const empty = {};
      colsToUse.forEach(c => { empty[c.id] = []; });
      setOrdenes(empty);
      setOrdenesPendientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, orden) => {
    setDraggedItem(orden);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, nuevoEstado) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.estado === nuevoEstado) {
      setDraggedItem(null);
      return;
    }

    // NOTA: Esta funcionalidad está deshabilitada temporalmente
    // Más adelante, cada área reportará el cambio de estado desde su propia interfaz
    alert('⚠️ La actualización de estados se realizará desde las interfaces específicas de cada área (Preprensa, Prensa, Acabados, etc.)');
    setDraggedItem(null);
    
    /* CÓDIGO COMENTADO PARA FUTURA IMPLEMENTACIÓN
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/produccion/${draggedItem.id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      // Actualizar el estado local
      const ordenActualizada = { ...draggedItem, estado: nuevoEstado };
      
      setOrdenes(prev => ({
        ...prev,
        [draggedItem.estado]: prev[draggedItem.estado].filter(o => o.id !== draggedItem.id),
        [nuevoEstado]: [...prev[nuevoEstado], ordenActualizada]
      }));

      // Notificación
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Estado actualizado",
          mensaje: `Orden #${draggedItem.numero_orden} movida a ${nuevoEstado.replace('_', ' ')}`,
          tipo: "success",
          fecha: new Date().toLocaleString()
        }
      }));
      
      // Recargar las órdenes
      cargarOrdenes();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al actualizar el estado de la orden');
    } finally {
      setDraggedItem(null);
    }
    */
  };

  const ejecutarBusqueda = () => {
    setBusquedaActiva(busquedaNumero);
  };

  const limpiarBusqueda = () => {
    setBusquedaNumero('');
    setBusquedaActiva('');
  };

  const handleKeyPressBusqueda = (e) => {
    if (e.key === 'Enter') {
      ejecutarBusqueda();
    }
  };

  const getUrgenciaColor = (fechaEntrega) => {
    if (!fechaEntrega) return 'border-gray-200';
    
    const hoy = new Date();
    const entrega = new Date(fechaEntrega);
    const diasRestantes = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) return 'border-red-400 bg-red-50';
    if (diasRestantes <= 1) return 'border-orange-400 bg-orange-50';
    if (diasRestantes <= 3) return 'border-yellow-400 bg-yellow-50';
    return 'border-gray-200';
  };

  const getUrgenciaTexto = (fechaEntrega) => {
    if (!fechaEntrega) return '';
    
    const hoy = new Date();
    const entrega = new Date(fechaEntrega);
    const diasRestantes = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) return 'VENCIDA';
    if (diasRestantes === 0) return 'HOY';
    if (diasRestantes === 1) return 'MAÑANA';
    return `${diasRestantes} días`;
  };

  const openOrdenModal = async (ordenOrId) => {
    try {
      const id = (ordenOrId && typeof ordenOrId === 'object') ? ordenOrId.id : ordenOrId;
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/ordenTrabajo/orden/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar detalle de la orden');
      const data = await response.json();
      setOrdenDetalleModal(data);
      setShowOrdenModal(true);
    } catch (e) {
      console.error('Error abriendo modal de orden:', e);
    }
  };

  const closeOrdenModal = () => {
    setShowOrdenModal(false);
    setOrdenDetalleModal(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vista Kanban - Producción</h1>
            <p className="text-gray-600">Seguimiento visual del flujo de producción</p>
                 {/* Filtros */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por número de orden..."
                value={busquedaNumero}
                onChange={(e) => setBusquedaNumero(e.target.value)}
                onKeyPress={handleKeyPressBusqueda}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              <button
                onClick={ejecutarBusqueda}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Buscar orden"
              >
                <FaFilter className="h-4 w-4" />
                Buscar
              </button>
              {busquedaActiva && (
                <button
                  onClick={limpiarBusqueda}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <FaTimes className="h-4 w-4" />
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* (Sidebar toggle moved to Sidebar component) */}

              <button
                  onClick={async () => { setWorkflowType('offset'); await refreshWorkflowAndOrders('offset'); }}
                className={`px-3 py-2 rounded-md text-sm ${workflowType==='offset' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Offset
              </button>
              <button
                  onClick={async () => { setWorkflowType('digital'); await refreshWorkflowAndOrders('digital'); }}
                className={`px-3 py-2 rounded-md text-sm ${workflowType==='digital' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Digital
              </button>
              <button
                onClick={() => cargarOrdenes()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaSync className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>
          </div>
          
     
          {showOrdenModal && (
            <OrdenDetalleModal
              ordenDetalle={ordenDetalleModal}
              onClose={closeOrdenModal}
              onEdit={(id) => { closeOrdenModal(); navigate(`/ordendeTrabajo/editar/${id}`); }}
              onViewPDF={(id) => { window.open(`${apiUrl}/api/ordenTrabajo/${id}/preview`, '_blank'); }}
              canEdit={false}
            />
          )}

        </div>
      </div>

  

      {/* Kanban Board */}
      <div className="pb-6">
        {avisoKanban && (
          <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {avisoKanban}
          </div>
        )}
        <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Debug Kanban: tipo={kanbanDebug.workflowType} | recibidas={kanbanDebug.totalRecibidas} | mostradas={kanbanDebug.totalFiltradas} | con_estado_digital={kanbanDebug.conEstadoDigital} | sin_estado_digital={kanbanDebug.sinEstadoDigital}
        </div>
          <div className="mb-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
            Flujo de validacion (prototipo UI): completar etapa, calidad aprueba o rechaza, y luego se envia al siguiente proceso.
          </div>

        {/* Scrollbar superior sincronizado */}
        <div
          ref={scrollTopRef}
          onScroll={handleScrollTop}
          className="overflow-x-auto mb-1"
          style={{ height: '12px' }}
        >
          <div ref={mirrorInnerRef} style={{ height: '1px', width: '3000px' }} />
        </div>

        <div ref={scrollBoardRef} onScroll={handleScrollBoard} className="overflow-x-auto pb-2">
        <div ref={scrollInnerRef} className="flex gap-6" style={{ width: 'max-content' }}>

          {/* Columna fija de Pendientes */}
          <div className="bg-amber-50 rounded-lg p-2 flex-shrink-0" style={{ minWidth: '220px' }}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200">
              <FaClock className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">Pendientes</h3>
              <span className="ml-auto px-2 py-1 text-xs font-medium bg-amber-200 text-amber-800 rounded-full">
                {ordenesPendientes.length}
              </span>
            </div>
            <div className="space-y-2">
              {ordenesPendientes.map((orden) => (
                <div
                  key={`pend-${orden.id}`}
                  onClick={() => openOrdenModal(orden)}
                  className={`bg-white rounded shadow-sm border ${getUrgenciaColor(orden.fecha_entrega)} p-2 cursor-pointer hover:shadow-md transition-shadow text-sm`}
                  style={{ lineHeight: '1.05' }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900">#{orden.numero_orden}</span>
                    {orden.fecha_entrega && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        getUrgenciaTexto(orden.fecha_entrega) === 'VENCIDA' ? 'bg-red-100 text-red-800' :
                        getUrgenciaTexto(orden.fecha_entrega) === 'HOY' ? 'bg-orange-100 text-orange-800' :
                        getUrgenciaTexto(orden.fecha_entrega) === 'MAÑANA' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getUrgenciaTexto(orden.fecha_entrega)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{orden.nombre_cliente}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{orden.concepto}</p>
                  {orden.fecha_entrega && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <FaCalendarAlt className="h-3 w-3" />
                      <span>{new Date(orden.fecha_entrega).toLocaleDateString()}</span>
                    </div>
                  )}
                  {/* Botón enviar a proceso desde Pendientes */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    {(() => {
                      const selectorKey = `pend:${orden.id}`;
                      const selectorAbierto = selectorProcesoAbierto === selectorKey;
                      return (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectorProcesoAbierto(selectorAbierto ? null : selectorKey);
                            }}
                            className="w-full text-[11px] px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors flex items-center justify-between gap-1"
                          >
                            <span>Enviar a proceso</span>
                            <span>{selectorAbierto ? '▲' : '▼'}</span>
                          </button>
                          {selectorAbierto && (
                            <div
                              className="absolute left-0 top-full mt-1 z-50 w-full min-w-max bg-white border border-gray-200 rounded shadow-lg py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {columnas.map((etapa) => (
                                <button
                                  key={etapa.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moverPendienteAColumna(orden, etapa.id);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                                >
                                  {etapa.titulo}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
              {ordenesPendientes.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">No hay órdenes pendientes</p>
                </div>
              )}
            </div>
          </div>

        {columnas.map((columna) => {
          const IconoColumna = columna.icono;
          const ordenesColumna = ordenes[columna.id] || [];
          return (
            <div
              key={columna.id}
              className={`bg-${columna.color}-50 rounded-lg p-2 flex-shrink-0`}
              style={{ minWidth: '220px' }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, columna.id)}
            >
              {/* Header de la columna */}
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-${columna.color}-200`}>
                <IconoColumna className={`h-5 w-5 text-${columna.color}-600`} />
                <h3 className={`font-semibold text-${columna.color}-800`}>
                  {columna.titulo}
                </h3>
                <span className={`ml-auto px-2 py-1 text-xs font-medium bg-${columna.color}-200 text-${columna.color}-800 rounded-full`}>
                  {ordenesColumna.length}
                </span>
              </div>

              {/* Tarjetas de órdenes */}
              <div className="space-y-2">
                {ordenesColumna.map((orden) => (
                  <div
                    key={orden.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, orden)}
                    onClick={() => openOrdenModal(orden)}
                    className={`bg-white rounded shadow-sm border ${getUrgenciaColor(orden.fecha_entrega)} p-2 cursor-move hover:shadow-md transition-shadow text-sm`}
                    style={{ lineHeight: '1.05', cursor: 'pointer' }}
                  >
                    {(() => {
                      const gate = getQaState(orden.id, columna.id);
                      const badgeClass = gate?.estado === 'aprobado'
                        ? 'bg-green-100 text-green-700'
                        : gate?.estado === 'rechazado'
                          ? 'bg-red-100 text-red-700'
                          : gate?.estado === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600';
                      const badgeText = gate?.estado === 'aprobado'
                        ? 'Calidad: Aprobado'
                        : gate?.estado === 'rechazado'
                          ? 'Calidad: Rechazado'
                          : gate?.estado === 'pendiente'
                            ? 'Calidad: Pendiente'
                            : 'Producción';

                      return (
                        <div className="mb-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Header de la tarjeta */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">#{orden.numero_orden}</span>
                        {orden.fecha_entrega && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            getUrgenciaTexto(orden.fecha_entrega) === 'VENCIDA' ? 'bg-red-100 text-red-800' :
                            getUrgenciaTexto(orden.fecha_entrega) === 'HOY' ? 'bg-orange-100 text-orange-800' :
                            getUrgenciaTexto(orden.fecha_entrega) === 'MAÑANA' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getUrgenciaTexto(orden.fecha_entrega)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); openOrdenModal(orden); }}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Cliente */}
                    <div className="mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {orden.nombre_cliente}
                      </p>
                    </div>

                    {/* Concepto */}
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {orden.concepto}
                      </p>
                    </div>

                    {/* Información adicional */}
                    <div className="space-y-1 text-xs text-gray-500">
                      {orden.responsable_actual && (
                        <div className="flex items-center gap-1">
                          <FaUser className="h-3 w-3" />
                          <span>{orden.responsable_actual}</span>
                        </div>
                      )}
                      {orden.fecha_entrega && (
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="h-3 w-3" />
                          <span>{new Date(orden.fecha_entrega).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/produccion/seguimiento/${orden.id}`); }}
                          className="flex-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          Seguir
                        </button>
                      </div>

                      {(() => {
                        const gate = getQaState(orden.id, columna.id);
                        const idxActual = columnas.findIndex((c) => c.id === columna.id);
                        const tieneSiguiente = idxActual >= 0 && idxActual < columnas.length - 1;
                        const puedeEnviar = gate?.estado === 'aprobado' && tieneSiguiente;

                        return (
                          <div className="grid grid-cols-1 gap-1">
                            {!gate && tieneSiguiente && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRegistroEjecucion({ orden, etapa: columna });
                                }}
                                className="text-[11px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                              >
                                Enviar a calidad
                              </button>
                            )}

                            {gate?.estado === 'pendiente' && (
                              <div className="grid grid-cols-1 gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/produccion/control-calidad');
                                  }}
                                  className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                                >
                                  Ir a Control de Calidad
                                </button>
                              </div>
                            )}

                            {gate?.estado === 'rechazado' && (
                              <div className="grid grid-cols-1 gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRegistroEjecucion({ orden, etapa: columna });
                                  }}
                                  className="text-[11px] bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200 transition-colors"
                                >
                                  Reenviar a calidad
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/produccion/control-calidad');
                                  }}
                                  className="text-[11px] bg-indigo-100 text-indigo-800 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                                >
                                  Ir a Control de Calidad
                                </button>
                              </div>
                            )}

                            {tieneSiguiente && (() => {
                              const selectorKey = `${orden.id}:${columna.id}`;
                              const selectorAbierto = selectorProcesoAbierto === selectorKey;
                              const etapasDestino = columnas.filter((c) => c.id !== columna.id);
                              return (
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!puedeEnviar) return;
                                      setSelectorProcesoAbierto(selectorAbierto ? null : selectorKey);
                                    }}
                                    disabled={!puedeEnviar}
                                    className={`w-full text-[11px] px-2 py-1 rounded transition-colors flex items-center justify-between gap-1 ${
                                      puedeEnviar
                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>Enviar a proceso</span>
                                    <span>{selectorAbierto ? '▲' : '▼'}</span>
                                  </button>
                                  {selectorAbierto && (
                                    <div
                                      className="absolute left-0 top-full mt-1 z-50 w-full min-w-max bg-white border border-gray-200 rounded shadow-lg py-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {etapasDestino.map((etapa) => (
                                        <button
                                          key={etapa.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moverOrdenAColumna(orden, columna.id, etapa.id);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                                        >
                                          {etapa.titulo}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
                
                {/* Mensaje cuando no hay órdenes */}
                {ordenesColumna.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">No hay órdenes en esta etapa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>{/* fin scrollInnerRef */}
        </div>{/* fin scrollBoardRef */}
      </div>

      {registroEjecucion && (
        <ModalRegistroEjecucion
          orden={registroEjecucion.orden}
          etapa={registroEjecucion.etapa}
          onConfirmar={async (ejecucionGuardada) => {
            const { orden, etapa } = registroEjecucion;
            saveQaState(orden.id, etapa.id, 'pendiente');
            await upsertQaQueue(orden, etapa);
            setRegistroEjecucion(null);
          }}
          onCancelar={() => setRegistroEjecucion(null)}
        />
      )}

    </div>
  );
};

export default VistaKanban;
