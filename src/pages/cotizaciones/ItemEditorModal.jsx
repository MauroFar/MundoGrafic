import React, { useState, useEffect, useMemo } from 'react';
import { FaSave, FaTimes, FaCheck, FaCalculator } from 'react-icons/fa';
import '../../styles/cotizaciones/ItemEditorModal.css';

// 🎭 CATÁLOGO FICTICIO - Tipos de Trabajo
const TIPOS_TRABAJO = [
  { id: 1, nombre: 'Carpetas' },
  { id: 2, nombre: 'Folletos' },
  { id: 3, nombre: 'Revistas' },
  { id: 4, nombre: 'Libros' },
  { id: 5, nombre: 'Tarjetas de Presentación' },
  { id: 6, nombre: 'Volantes' },
  { id: 7, nombre: 'Lonas' },
  { id: 8, nombre: 'Banners' },
];

// 🎭 CATÁLOGO FICTICIO - Procesos de Producción
const PROCESOS_CATALOGO = [
  { id: 1, nombre: 'DISEÑO', precio_sugerido: 500.00, unidad: 'hora', categoria: 'pre-prensa' },
  { id: 2, nombre: 'PAPEL BOND 75g', precio_sugerido: 0.20, unidad: 'hoja', categoria: 'materiales' },
  { id: 3, nombre: 'PAPEL COUCHÉ 150g', precio_sugerido: 0.50, unidad: 'hoja', categoria: 'materiales' },
  { id: 4, nombre: 'PAPEL OPALINA 240g', precio_sugerido: 0.80, unidad: 'hoja', categoria: 'materiales' },
  { id: 5, nombre: 'PRUEBA COLOR', precio_sugerido: 50.00, unidad: 'pieza', categoria: 'pre-prensa' },
  { id: 6, nombre: 'PLACAS CMYK', precio_sugerido: 200.00, unidad: 'juego', categoria: 'pre-prensa' },
  { id: 7, nombre: 'IMPRESIÓN CMYK', precio_sugerido: 2.00, unidad: 'hoja', categoria: 'impresion' },
  { id: 8, nombre: 'IMPRESIÓN DIGITAL', precio_sugerido: 1.00, unidad: 'hoja', categoria: 'impresion' },
  { id: 9, nombre: 'PLASTIFICADO', precio_sugerido: 0.80, unidad: 'pieza', categoria: 'acabados' },
  { id: 10, nombre: 'TROQUEL', precio_sugerido: 150.00, unidad: 'molde', categoria: 'acabados' },
  { id: 11, nombre: 'TROQUELADO', precio_sugerido: 0.50, unidad: 'pieza', categoria: 'acabados' },
  { id: 12, nombre: 'UV SELECTIVO', precio_sugerido: 1.20, unidad: 'pieza', categoria: 'acabados' },
  { id: 13, nombre: 'UV TOTAL', precio_sugerido: 0.90, unidad: 'pieza', categoria: 'acabados' },
  { id: 14, nombre: 'PEGADO', precio_sugerido: 0.30, unidad: 'pieza', categoria: 'acabados' },
  { id: 15, nombre: 'CLISÉADO', precio_sugerido: 100.00, unidad: 'molde', categoria: 'acabados' },
  { id: 16, nombre: 'REPUJADO', precio_sugerido: 0.60, unidad: 'pieza', categoria: 'acabados' },
  { id: 17, nombre: 'TERMINADO', precio_sugerido: 0.20, unidad: 'pieza', categoria: 'acabados' },
  { id: 18, nombre: 'GRAPADO', precio_sugerido: 0.15, unidad: 'pieza', categoria: 'acabados' },
  { id: 19, nombre: 'ENCOLADO', precio_sugerido: 0.40, unidad: 'pieza', categoria: 'acabados' },
  { id: 20, nombre: 'RECOGIDO', precio_sugerido: 0.10, unidad: 'pieza', categoria: 'acabados' },
  { id: 21, nombre: 'DOBLADO', precio_sugerido: 0.12, unidad: 'pieza', categoria: 'acabados' },
];

function ItemEditorModal({ item, onClose, onSave }) {
  // Datos básicos del ítem
  const [tipoTrabajo, setTipoTrabajo] = useState(item?.tipo_trabajo || '');
  const [descripcion, setDescripcion] = useState(item?.descripcion || '');
  const [cantidad, setCantidad] = useState(item?.cantidad || 1000);
  const [tamanoCerrado, setTamanoCerrado] = useState(item?.tamano_cerrado || '');
  const [tamanoAbierto, setTamanoAbierto] = useState(item?.tamano_abierto || '');

  // Procesos seleccionados
  const [procesosSeleccionados, setProcesosSeleccionados] = useState(
    item?.procesos?.map(p => ({
      procesoId: PROCESOS_CATALOGO.find(pc => pc.nombre === p.proceso)?.id || 0,
      nombre: p.proceso,
      cantidad: p.cantidad,
      precioUnitario: p.precio_unitario,
      subtotal: p.subtotal
    })) || []
  );

  // Cálculos
  const [margenUtilidad, setMargenUtilidad] = useState(20); // porcentaje
  const [precioManual, setPrecioManual] = useState(false);
  const [precioUnitarioManual, setPrecioUnitarioManual] = useState(0);

  // Estados para mostrar los cálculos
  const [displayCostoTotal, setDisplayCostoTotal] = useState(0);
  const [displayCostoUnitario, setDisplayCostoUnitario] = useState(0);
  const [displayMargenValor, setDisplayMargenValor] = useState(0);
  const [displayPrecioUnitario, setDisplayPrecioUnitario] = useState(0);
  const [displayTotalFinal, setDisplayTotalFinal] = useState(0);

  // Función para recalcular TODO
  const recalcularTodo = () => {
    // 1. Sumar todos los procesos
    const costoTotal = procesosSeleccionados.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    
    // 2. Dividir entre cantidad
    const costoUnit = cantidad > 0 ? costoTotal / cantidad : 0;
    
    // 3. Calcular margen
    const margen = costoUnit * (margenUtilidad / 100);
    
    // 4. Precio unitario calculado
    const precioUnit = costoUnit + margen;
    
    // 5. Precio final (manual o automático)
    const precioFinal = precioManual ? precioUnitarioManual : precioUnit;
    
    // 6. Total final
    const total = precioFinal * cantidad;

    // Actualizar todos los displays
    setDisplayCostoTotal(costoTotal);
    setDisplayCostoUnitario(costoUnit);
    setDisplayMargenValor(margen);
    setDisplayPrecioUnitario(precioFinal);
    setDisplayTotalFinal(total);

    console.log('💰 RECALCULADO:', {
      procesosCount: procesosSeleccionados.length,
      cantidad: cantidad,
      costoTotal: costoTotal.toFixed(2),
      costoUnitario: costoUnit.toFixed(2),
      margenUtilidad: margenUtilidad,
      margen: margen.toFixed(2),
      precioUnitario: precioFinal.toFixed(2),
      totalFinal: total.toFixed(2)
    });
  };

  // Recalcular automáticamente cuando cambie cualquier cosa
  useEffect(() => {
    recalcularTodo();
  }, [procesosSeleccionados, cantidad, margenUtilidad, precioManual, precioUnitarioManual]);

  // Efecto para actualizar cantidades de procesos cuando cambie la cantidad principal
  useEffect(() => {
    setProcesosSeleccionados(prev => prev.map(p => {
      const proceso = PROCESOS_CATALOGO.find(pc => pc.id === p.procesoId);
      // Solo actualizar si NO es por hora, molde o juego
      if (proceso && proceso.unidad !== 'hora' && proceso.unidad !== 'molde' && proceso.unidad !== 'juego') {
        const nuevaCantidad = cantidad;
        return {
          ...p,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * p.precioUnitario
        };
      }
      return p;
    }));
  }, [cantidad]); // Se ejecuta solo cuando cambia la cantidad principal

  const handleProcesoToggle = (proceso) => {
    setProcesosSeleccionados(prev => {
      const yaSeleccionado = prev.find(p => p.procesoId === proceso.id);
      
      if (yaSeleccionado) {
        // Quitar proceso
        return prev.filter(p => p.procesoId !== proceso.id);
      } else {
        // Agregar proceso con valores por defecto
        const cantidadDefault = proceso.unidad === 'hora' || proceso.unidad === 'molde' || proceso.unidad === 'juego' ? 1 : cantidad;
        return [
          ...prev,
          {
            procesoId: proceso.id,
            nombre: proceso.nombre,
            cantidad: cantidadDefault,
            precioUnitario: proceso.precio_sugerido,
            subtotal: cantidadDefault * proceso.precio_sugerido
          }
        ];
      }
    });
  };

  const handleProcesoCantidadChange = (procesoId, nuevaCantidad) => {
    const cant = parseFloat(nuevaCantidad) || 0;
    setProcesosSeleccionados(prev => prev.map(p => {
      if (p.procesoId === procesoId) {
        return {
          ...p,
          cantidad: cant,
          subtotal: cant * p.precioUnitario
        };
      }
      return p;
    }));
  };

  const handleProcesoPrecioChange = (procesoId, nuevoPrecio) => {
    const precio = parseFloat(nuevoPrecio) || 0;
    setProcesosSeleccionados(prev => prev.map(p => {
      if (p.procesoId === procesoId) {
        return {
          ...p,
          precioUnitario: precio,
          subtotal: p.cantidad * precio
        };
      }
      return p;
    }));
  };

  const handleGuardar = () => {
    if (!tipoTrabajo) {
      alert('Debe seleccionar un tipo de trabajo');
      return;
    }
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    if (procesosSeleccionados.length === 0) {
      alert('Debe seleccionar al menos un proceso');
      return;
    }

    const itemData = {
      tipo_trabajo: tipoTrabajo,
      descripcion,
      cantidad,
      tamano_cerrado: tamanoCerrado,
      tamano_abierto: tamanoAbierto,
      precio_unitario: displayPrecioUnitario,
      total: displayTotalFinal,
      procesos: procesosSeleccionados.map(p => ({
        proceso: p.nombre,
        cantidad: p.cantidad,
        precio_unitario: p.precioUnitario,
        subtotal: p.subtotal
      }))
    };

    onSave(itemData);
  };

  // Agrupar procesos por categoría
  const procesosPorCategoria = {
    'pre-prensa': PROCESOS_CATALOGO.filter(p => p.categoria === 'pre-prensa'),
    'materiales': PROCESOS_CATALOGO.filter(p => p.categoria === 'materiales'),
    'impresion': PROCESOS_CATALOGO.filter(p => p.categoria === 'impresion'),
    'acabados': PROCESOS_CATALOGO.filter(p => p.categoria === 'acabados'),
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="item-editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{item ? 'Editar Ítem' : 'Agregar Ítem'}</h2>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Contenido */}
        <div className="modal-content">
          {/* Información básica */}
          <div className="info-basica">
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Trabajo *</label>
                <select 
                  value={tipoTrabajo} 
                  onChange={(e) => setTipoTrabajo(e.target.value)}
                  className="form-control"
                >
                  <option value="">Seleccionar...</option>
                  {TIPOS_TRABAJO.map(tipo => (
                    <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cantidad *</label>
                <input 
                  type="number" 
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
                  onWheel={(e) => e.target.blur()}
                  className="form-control"
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input 
                type="text" 
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="form-control"
                placeholder="Descripción del trabajo..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tamaño Cerrado</label>
                <input 
                  type="text" 
                  value={tamanoCerrado}
                  onChange={(e) => setTamanoCerrado(e.target.value)}
                  className="form-control"
                  placeholder="ej: 21.5 x 28 cm"
                />
              </div>
              <div className="form-group">
                <label>Tamaño Abierto</label>
                <input 
                  type="text" 
                  value={tamanoAbierto}
                  onChange={(e) => setTamanoAbierto(e.target.value)}
                  className="form-control"
                  placeholder="ej: 43 x 28 cm"
                />
              </div>
            </div>
          </div>

          {/* Selector de procesos */}
          <div className="procesos-section">
            <h3>Procesos a Incluir</h3>
            
            {Object.entries(procesosPorCategoria).map(([categoria, procesos]) => (
              <div key={categoria} className="categoria-procesos">
                <h4 className="categoria-titulo">
                  {categoria === 'pre-prensa' && '📋 Pre-Prensa'}
                  {categoria === 'materiales' && '📄 Materiales'}
                  {categoria === 'impresion' && '🖨️ Impresión'}
                  {categoria === 'acabados' && '✂️ Acabados'}
                </h4>
                
                <div className="procesos-lista">
                  {procesos.map(proceso => {
                    const seleccionado = procesosSeleccionados.find(p => p.procesoId === proceso.id);
                    const estaSeleccionado = !!seleccionado;
                    
                    return (
                      <div key={proceso.id} className={`proceso-item ${estaSeleccionado ? 'seleccionado' : ''}`}>
                        <div className="proceso-checkbox">
                          <input 
                            type="checkbox" 
                            id={`proceso-${proceso.id}`}
                            checked={estaSeleccionado}
                            onChange={() => handleProcesoToggle(proceso)}
                          />
                          <label htmlFor={`proceso-${proceso.id}`}>
                            {proceso.nombre}
                          </label>
                        </div>
                        
                        {estaSeleccionado && (
                          <div className="proceso-inputs">
                            <div className="input-group">
                              <label>Cant.</label>
                              <input 
                                type="number"
                                value={seleccionado.cantidad}
                                onChange={(e) => handleProcesoCantidadChange(proceso.id, e.target.value)}
                                onWheel={(e) => e.target.blur()}
                                className="input-small"
                                min="0"
                                step="0.01"
                              />
                              <span className="unidad">{proceso.unidad}</span>
                            </div>
                            <div className="input-group">
                              <label>Precio</label>
                              <input 
                                type="number"
                                value={seleccionado.precioUnitario}
                                onChange={(e) => handleProcesoPrecioChange(proceso.id, e.target.value)}
                                onWheel={(e) => e.target.blur()}
                                className="input-small"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="subtotal">
                              = ${seleccionado.subtotal.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de cálculos */}
          <div className="calculos-section">
            <h3><FaCalculator /> Cálculo de Precios</h3>
            
            <div className="calculo-row">
              <span className="calculo-label">Costo Total de Procesos:</span>
              <span className="calculo-valor">
                ${displayCostoTotal.toFixed(2)}
              </span>
            </div>
            
            <div className="calculo-row">
              <span className="calculo-label">Costo Unitario (÷ {cantidad}):</span>
              <span className="calculo-valor">
                ${displayCostoUnitario.toFixed(2)}
              </span>
            </div>
            
            <div className="calculo-row">
              <span className="calculo-label">
                Margen de Utilidad:
                <input 
                  type="number"
                  value={margenUtilidad}
                  onChange={(e) => setMargenUtilidad(parseFloat(e.target.value) || 0)}
                  onWheel={(e) => e.target.blur()}
                  className="input-inline"
                  min="0"
                  max="100"
                  step="1"
                />
                %
              </span>
              <span className="calculo-valor">
                +${displayMargenValor.toFixed(2)}
              </span>
            </div>
            
            <div className="calculo-row destacado">
              <span className="calculo-label">
                Precio Unitario:
                <label className="checkbox-inline">
                  <input 
                    type="checkbox"
                    checked={precioManual}
                    onChange={(e) => setPrecioManual(e.target.checked)}
                  />
                  Manual
                </label>
              </span>
              <span className="calculo-valor">
                {precioManual ? (
                  <input 
                    type="number"
                    value={precioUnitarioManual}
                    onChange={(e) => setPrecioUnitarioManual(parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.target.blur()}
                    className="input-precio"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  `$${displayPrecioUnitario.toFixed(2)}`
                )}
              </span>
            </div>
            
            <div className="calculo-row total">
              <span className="calculo-label">TOTAL FINAL:</span>
              <span className="calculo-valor">
                ${displayTotalFinal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            <FaTimes /> Cancelar
          </button>
          <button className="btn-primary" onClick={handleGuardar}>
            <FaSave /> Guardar Ítem
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemEditorModal;
