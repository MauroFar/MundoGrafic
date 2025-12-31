import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaArrowLeft } from 'react-icons/fa';
import '../../styles/admin/CatalogoProcesos.css';

function CatalogoProcesos() {
  const navigate = useNavigate();
  
  // Estados
  const [procesos, setProcesos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [procesoEditado, setProcesoEditado] = useState({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoProceso, setNuevoProceso] = useState({
    nombre: '',
    precio_sugerido: 0,
    unidad: 'pieza',
    categoria: 'acabados',
    descripcion: '',
    activo: true
  });
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('activos');

  // Cargar procesos mock (luego se reemplazará con llamada a API)
  useEffect(() => {
    cargarProcesosMock();
  }, []);

  const cargarProcesosMock = () => {
    const procesosMock = [
      { id: 1, nombre: 'DISEÑO', precio_sugerido: 500.00, unidad: 'hora', categoria: 'pre-prensa', descripcion: 'Diseño gráfico profesional', activo: true },
      { id: 2, nombre: 'PAPEL BOND 75g', precio_sugerido: 0.20, unidad: 'hoja', categoria: 'materiales', descripcion: 'Papel bond tamaño carta', activo: true },
      { id: 3, nombre: 'PAPEL COUCHÉ 150g', precio_sugerido: 0.50, unidad: 'hoja', categoria: 'materiales', descripcion: 'Papel couché para impresión de calidad', activo: true },
      { id: 4, nombre: 'PAPEL OPALINA 240g', precio_sugerido: 0.80, unidad: 'hoja', categoria: 'materiales', descripcion: 'Papel opalina para trabajos especiales', activo: true },
      { id: 5, nombre: 'PRUEBA COLOR', precio_sugerido: 50.00, unidad: 'pieza', categoria: 'pre-prensa', descripcion: 'Prueba de color antes de impresión', activo: true },
      { id: 6, nombre: 'PLACAS CMYK', precio_sugerido: 200.00, unidad: 'juego', categoria: 'pre-prensa', descripcion: 'Juego de placas para impresión offset', activo: true },
      { id: 7, nombre: 'IMPRESIÓN CMYK', precio_sugerido: 2.00, unidad: 'hoja', categoria: 'impresion', descripcion: 'Impresión offset full color', activo: true },
      { id: 8, nombre: 'IMPRESIÓN DIGITAL', precio_sugerido: 1.00, unidad: 'hoja', categoria: 'impresion', descripcion: 'Impresión digital rápida', activo: true },
      { id: 9, nombre: 'PLASTIFICADO', precio_sugerido: 0.80, unidad: 'pieza', categoria: 'acabados', descripcion: 'Plastificado mate o brillante', activo: true },
      { id: 10, nombre: 'TROQUEL', precio_sugerido: 150.00, unidad: 'molde', categoria: 'acabados', descripcion: 'Fabricación de troquel personalizado', activo: true },
      { id: 11, nombre: 'TROQUELADO', precio_sugerido: 0.50, unidad: 'pieza', categoria: 'acabados', descripcion: 'Aplicación de troquel', activo: true },
      { id: 12, nombre: 'UV SELECTIVO', precio_sugerido: 1.20, unidad: 'pieza', categoria: 'acabados', descripcion: 'Barniz UV en áreas específicas', activo: true },
      { id: 13, nombre: 'UV TOTAL', precio_sugerido: 0.90, unidad: 'pieza', categoria: 'acabados', descripcion: 'Barniz UV en toda la superficie', activo: true },
      { id: 14, nombre: 'PEGADO', precio_sugerido: 0.30, unidad: 'pieza', categoria: 'acabados', descripcion: 'Pegado de piezas', activo: true },
      { id: 15, nombre: 'CLISÉADO', precio_sugerido: 100.00, unidad: 'molde', categoria: 'acabados', descripcion: 'Fabricación de cliché', activo: false },
      { id: 16, nombre: 'REPUJADO', precio_sugerido: 0.60, unidad: 'pieza', categoria: 'acabados', descripcion: 'Acabado en relieve', activo: true },
      { id: 17, nombre: 'TERMINADO', precio_sugerido: 0.20, unidad: 'pieza', categoria: 'acabados', descripcion: 'Terminado final del producto', activo: true },
      { id: 18, nombre: 'GRAPADO', precio_sugerido: 0.15, unidad: 'pieza', categoria: 'acabados', descripcion: 'Grapado de folletos/revistas', activo: true },
      { id: 19, nombre: 'ENCOLADO', precio_sugerido: 0.40, unidad: 'pieza', categoria: 'acabados', descripcion: 'Encolado de piezas', activo: true },
      { id: 20, nombre: 'RECOGIDO', precio_sugerido: 0.10, unidad: 'pieza', categoria: 'acabados', descripcion: 'Recogido y organización', activo: true },
      { id: 21, nombre: 'DOBLADO', precio_sugerido: 0.12, unidad: 'pieza', categoria: 'acabados', descripcion: 'Doblado de piezas', activo: true },
    ];
    setProcesos(procesosMock);
  };

  // Filtrar procesos según categoría y estado
  const procesosFiltrados = procesos.filter(p => {
    const cumpleCategoria = filtroCategoria === 'todas' || p.categoria === filtroCategoria;
    const cumpleEstado = filtroEstado === 'todos' || 
                         (filtroEstado === 'activos' && p.activo) || 
                         (filtroEstado === 'inactivos' && !p.activo);
    return cumpleCategoria && cumpleEstado;
  });

  // Funciones de edición
  const iniciarEdicion = (proceso) => {
    setEditandoId(proceso.id);
    setProcesoEditado({ ...proceso });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setProcesoEditado({});
  };

  const guardarEdicion = () => {
    setProcesos(procesos.map(p => 
      p.id === editandoId ? { ...procesoEditado } : p
    ));
    setEditandoId(null);
    setProcesoEditado({});
    // Aquí iría la llamada a la API: PUT /api/procesos-catalogo/:id
    console.log('✅ Proceso actualizado:', procesoEditado);
  };

  const toggleActivo = (id) => {
    setProcesos(procesos.map(p => 
      p.id === id ? { ...p, activo: !p.activo } : p
    ));
    // Aquí iría la llamada a la API
  };

  const eliminarProceso = (id) => {
    if (window.confirm('¿Está seguro de eliminar este proceso? Esta acción no se puede deshacer.')) {
      setProcesos(procesos.filter(p => p.id !== id));
      // Aquí iría la llamada a la API: DELETE /api/procesos-catalogo/:id
    }
  };

  const agregarNuevoProceso = () => {
    if (!nuevoProceso.nombre || nuevoProceso.precio_sugerido <= 0) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const procesoConId = {
      ...nuevoProceso,
      id: Math.max(...procesos.map(p => p.id), 0) + 1
    };

    setProcesos([...procesos, procesoConId]);
    setNuevoProceso({
      nombre: '',
      precio_sugerido: 0,
      unidad: 'pieza',
      categoria: 'acabados',
      descripcion: '',
      activo: true
    });
    setMostrarFormulario(false);
    // Aquí iría la llamada a la API: POST /api/procesos-catalogo
    console.log('✅ Proceso creado:', procesoConId);
  };

  // Estadísticas
  const estadisticas = {
    total: procesos.length,
    activos: procesos.filter(p => p.activo).length,
    inactivos: procesos.filter(p => !p.activo).length,
    preprensa: procesos.filter(p => p.categoria === 'pre-prensa').length,
    materiales: procesos.filter(p => p.categoria === 'materiales').length,
    impresion: procesos.filter(p => p.categoria === 'impresion').length,
    acabados: procesos.filter(p => p.categoria === 'acabados').length,
  };

  return (
    <div className="catalogo-procesos-container">
      {/* Header */}
      <div className="catalogo-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/administracion')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow transition-all duration-200 flex items-center gap-2"
          >
            <FaArrowLeft /> Regresar
          </button>
          <div>
            <h1 className="catalogo-titulo">📋 Catálogo de Procesos de Producción</h1>
            <p className="catalogo-subtitulo">
              Gestiona los procesos y precios que se utilizan en la calculadora de cotizaciones
            </p>
          </div>
        </div>
        <button 
          className="btn-nuevo-proceso"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          <FaPlus /> Nuevo Proceso
        </button>
      </div>

      {/* Estadísticas */}
      <div className="estadisticas-grid">
        <div className="estadistica-card">
          <div className="estadistica-numero">{estadisticas.total}</div>
          <div className="estadistica-label">Total Procesos</div>
        </div>
        <div className="estadistica-card activos">
          <div className="estadistica-numero">{estadisticas.activos}</div>
          <div className="estadistica-label">Activos</div>
        </div>
        <div className="estadistica-card inactivos">
          <div className="estadistica-numero">{estadisticas.inactivos}</div>
          <div className="estadistica-label">Inactivos</div>
        </div>
        <div className="estadistica-card categoria">
          <div className="estadistica-detalle">
            <span>📋 Pre-prensa: {estadisticas.preprensa}</span>
            <span>📄 Materiales: {estadisticas.materiales}</span>
            <span>🖨️ Impresión: {estadisticas.impresion}</span>
            <span>✂️ Acabados: {estadisticas.acabados}</span>
          </div>
        </div>
      </div>

      {/* Formulario Nuevo Proceso */}
      {mostrarFormulario && (
        <div className="formulario-nuevo-proceso">
          <h3><FaPlus /> Agregar Nuevo Proceso</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre del Proceso *</label>
              <input
                type="text"
                value={nuevoProceso.nombre}
                onChange={(e) => setNuevoProceso({ ...nuevoProceso, nombre: e.target.value.toUpperCase() })}
                placeholder="Ej: EMPAQUETADO"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Precio Sugerido *</label>
              <input
                type="number"
                value={nuevoProceso.precio_sugerido}
                onChange={(e) => setNuevoProceso({ ...nuevoProceso, precio_sugerido: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Unidad de Medida *</label>
              <select
                value={nuevoProceso.unidad}
                onChange={(e) => setNuevoProceso({ ...nuevoProceso, unidad: e.target.value })}
                className="form-input"
              >
                <option value="pieza">Pieza</option>
                <option value="hoja">Hoja</option>
                <option value="hora">Hora</option>
                <option value="molde">Molde</option>
                <option value="juego">Juego</option>
                <option value="set">Set</option>
              </select>
            </div>
            <div className="form-group">
              <label>Categoría *</label>
              <select
                value={nuevoProceso.categoria}
                onChange={(e) => setNuevoProceso({ ...nuevoProceso, categoria: e.target.value })}
                className="form-input"
              >
                <option value="pre-prensa">📋 Pre-Prensa</option>
                <option value="materiales">📄 Materiales</option>
                <option value="impresion">🖨️ Impresión</option>
                <option value="acabados">✂️ Acabados</option>
              </select>
            </div>
            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea
                value={nuevoProceso.descripcion}
                onChange={(e) => setNuevoProceso({ ...nuevoProceso, descripcion: e.target.value })}
                placeholder="Descripción del proceso..."
                className="form-input"
                rows="2"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>
              <FaTimes /> Cancelar
            </button>
            <button className="btn-guardar" onClick={agregarNuevoProceso}>
              <FaSave /> Guardar Proceso
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtro-grupo">
          <label>Categoría:</label>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
            <option value="todas">Todas las categorías</option>
            <option value="pre-prensa">📋 Pre-Prensa</option>
            <option value="materiales">📄 Materiales</option>
            <option value="impresion">🖨️ Impresión</option>
            <option value="acabados">✂️ Acabados</option>
          </select>
        </div>
        <div className="filtro-grupo">
          <label>Estado:</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      {/* Tabla de Procesos */}
      <div className="tabla-container">
        <table className="tabla-procesos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Unidad</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {procesosFiltrados.map(proceso => (
              <tr key={proceso.id} className={!proceso.activo ? 'fila-inactiva' : ''}>
                <td>{proceso.id}</td>
                <td>
                  {editandoId === proceso.id ? (
                    <input
                      type="text"
                      value={procesoEditado.nombre}
                      onChange={(e) => setProcesoEditado({ ...procesoEditado, nombre: e.target.value })}
                      className="input-edicion"
                    />
                  ) : (
                    <span className="nombre-proceso">{proceso.nombre}</span>
                  )}
                </td>
                <td>
                  {editandoId === proceso.id ? (
                    <input
                      type="number"
                      value={procesoEditado.precio_sugerido}
                      onChange={(e) => setProcesoEditado({ ...procesoEditado, precio_sugerido: parseFloat(e.target.value) || 0 })}
                      className="input-edicion"
                      step="0.01"
                    />
                  ) : (
                    <span className="precio">${proceso.precio_sugerido.toFixed(2)}</span>
                  )}
                </td>
                <td>
                  {editandoId === proceso.id ? (
                    <select
                      value={procesoEditado.unidad}
                      onChange={(e) => setProcesoEditado({ ...procesoEditado, unidad: e.target.value })}
                      className="input-edicion"
                    >
                      <option value="pieza">Pieza</option>
                      <option value="hoja">Hoja</option>
                      <option value="hora">Hora</option>
                      <option value="molde">Molde</option>
                      <option value="juego">Juego</option>
                      <option value="set">Set</option>
                    </select>
                  ) : (
                    <span className="unidad">{proceso.unidad}</span>
                  )}
                </td>
                <td>
                  {editandoId === proceso.id ? (
                    <select
                      value={procesoEditado.categoria}
                      onChange={(e) => setProcesoEditado({ ...procesoEditado, categoria: e.target.value })}
                      className="input-edicion"
                    >
                      <option value="pre-prensa">Pre-Prensa</option>
                      <option value="materiales">Materiales</option>
                      <option value="impresion">Impresión</option>
                      <option value="acabados">Acabados</option>
                    </select>
                  ) : (
                    <span className={`badge-categoria ${proceso.categoria}`}>
                      {proceso.categoria === 'pre-prensa' && '📋 Pre-Prensa'}
                      {proceso.categoria === 'materiales' && '📄 Materiales'}
                      {proceso.categoria === 'impresion' && '🖨️ Impresión'}
                      {proceso.categoria === 'acabados' && '✂️ Acabados'}
                    </span>
                  )}
                </td>
                <td>
                  {editandoId === proceso.id ? (
                    <input
                      type="text"
                      value={procesoEditado.descripcion}
                      onChange={(e) => setProcesoEditado({ ...procesoEditado, descripcion: e.target.value })}
                      className="input-edicion"
                    />
                  ) : (
                    <span className="descripcion">{proceso.descripcion || '-'}</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => toggleActivo(proceso.id)}
                    className={`btn-toggle ${proceso.activo ? 'activo' : 'inactivo'}`}
                    title={proceso.activo ? 'Desactivar' : 'Activar'}
                  >
                    {proceso.activo ? <FaToggleOn /> : <FaToggleOff />}
                    {proceso.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>
                  <div className="acciones-grupo">
                    {editandoId === proceso.id ? (
                      <>
                        <button className="btn-accion guardar" onClick={guardarEdicion}>
                          <FaSave />
                        </button>
                        <button className="btn-accion cancelar" onClick={cancelarEdicion}>
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-accion editar" onClick={() => iniciarEdicion(proceso)}>
                          <FaEdit />
                        </button>
                        <button className="btn-accion eliminar" onClick={() => eliminarProceso(proceso.id)}>
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {procesosFiltrados.length === 0 && (
          <div className="no-resultados">
            <p>No se encontraron procesos con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CatalogoProcesos;
