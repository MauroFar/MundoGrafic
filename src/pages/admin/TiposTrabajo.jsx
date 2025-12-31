import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaArrowLeft } from 'react-icons/fa';
import '../../styles/admin/TiposTrabajo.css';

function TiposTrabajo() {
  const navigate = useNavigate();
  
  const [tipos, setTipos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [tipoEditado, setTipoEditado] = useState({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });

  // Cargar tipos mock
  useEffect(() => {
    cargarTiposMock();
  }, []);

  const cargarTiposMock = () => {
    const tiposMock = [
      { id: 1, nombre: 'Carpetas', descripcion: 'Carpetas corporativas y presentación', activo: true },
      { id: 2, nombre: 'Folletos', descripcion: 'Folletos publicitarios e informativos', activo: true },
      { id: 3, nombre: 'Revistas', descripcion: 'Revistas y publicaciones periódicas', activo: true },
      { id: 4, nombre: 'Libros', descripcion: 'Libros y manuales', activo: true },
      { id: 5, nombre: 'Tarjetas de Presentación', descripcion: 'Tarjetas personales y corporativas', activo: true },
      { id: 6, nombre: 'Volantes', descripcion: 'Volantes y flyers promocionales', activo: true },
      { id: 7, nombre: 'Lonas', descripcion: 'Lonas publicitarias para exteriores', activo: true },
      { id: 8, nombre: 'Banners', descripcion: 'Banners y displays publicitarios', activo: true },
      { id: 9, nombre: 'Catálogos', descripcion: 'Catálogos de productos', activo: false },
    ];
    setTipos(tiposMock);
  };

  const iniciarEdicion = (tipo) => {
    setEditandoId(tipo.id);
    setTipoEditado({ ...tipo });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setTipoEditado({});
  };

  const guardarEdicion = () => {
    setTipos(tipos.map(t => 
      t.id === editandoId ? { ...tipoEditado } : t
    ));
    setEditandoId(null);
    setTipoEditado({});
    console.log('✅ Tipo de trabajo actualizado:', tipoEditado);
  };

  const toggleActivo = (id) => {
    setTipos(tipos.map(t => 
      t.id === id ? { ...t, activo: !t.activo } : t
    ));
  };

  const eliminarTipo = (id) => {
    if (window.confirm('¿Está seguro de eliminar este tipo de trabajo?')) {
      setTipos(tipos.filter(t => t.id !== id));
    }
  };

  const agregarNuevoTipo = () => {
    if (!nuevoTipo.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    const tipoConId = {
      ...nuevoTipo,
      id: Math.max(...tipos.map(t => t.id), 0) + 1
    };

    setTipos([...tipos, tipoConId]);
    setNuevoTipo({
      nombre: '',
      descripcion: '',
      activo: true
    });
    setMostrarFormulario(false);
    console.log('✅ Tipo de trabajo creado:', tipoConId);
  };

  const activos = tipos.filter(t => t.activo).length;
  const inactivos = tipos.filter(t => !t.activo).length;

  return (
    <div className="tipos-trabajo-container">
      {/* Header */}
      <div className="tipos-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/administracion')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow transition-all duration-200 flex items-center gap-2"
          >
            <FaArrowLeft /> Regresar
          </button>
          <div>
            <h1 className="tipos-titulo">🏷️ Catálogo de Tipos de Trabajo</h1>
            <p className="tipos-subtitulo">
              Gestiona los tipos de trabajos disponibles para cotizaciones
            </p>
          </div>
        </div>
        <button 
          className="btn-nuevo-tipo"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          <FaPlus /> Nuevo Tipo
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-numero">{tipos.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card activos">
          <div className="stat-numero">{activos}</div>
          <div className="stat-label">Activos</div>
        </div>
        <div className="stat-card inactivos">
          <div className="stat-numero">{inactivos}</div>
          <div className="stat-label">Inactivos</div>
        </div>
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="form-nuevo-tipo">
          <h3><FaPlus /> Agregar Nuevo Tipo de Trabajo</h3>
          <div className="form-grid-tipo">
            <div className="form-group-tipo">
              <label>Nombre *</label>
              <input
                type="text"
                value={nuevoTipo.nombre}
                onChange={(e) => setNuevoTipo({ ...nuevoTipo, nombre: e.target.value })}
                placeholder="Ej: Calendarios"
                className="form-input-tipo"
              />
            </div>
            <div className="form-group-tipo full">
              <label>Descripción</label>
              <textarea
                value={nuevoTipo.descripcion}
                onChange={(e) => setNuevoTipo({ ...nuevoTipo, descripcion: e.target.value })}
                placeholder="Descripción del tipo de trabajo..."
                className="form-input-tipo"
                rows="3"
              />
            </div>
          </div>
          <div className="form-actions-tipo">
            <button className="btn-cancelar-tipo" onClick={() => setMostrarFormulario(false)}>
              <FaTimes /> Cancelar
            </button>
            <button className="btn-guardar-tipo" onClick={agregarNuevoTipo}>
              <FaSave /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="tabla-wrapper">
        <table className="tabla-tipos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tipos.map(tipo => (
              <tr key={tipo.id} className={!tipo.activo ? 'row-inactiva' : ''}>
                <td>{tipo.id}</td>
                <td>
                  {editandoId === tipo.id ? (
                    <input
                      type="text"
                      value={tipoEditado.nombre}
                      onChange={(e) => setTipoEditado({ ...tipoEditado, nombre: e.target.value })}
                      className="input-edit"
                    />
                  ) : (
                    <span className="nombre-tipo">{tipo.nombre}</span>
                  )}
                </td>
                <td>
                  {editandoId === tipo.id ? (
                    <textarea
                      value={tipoEditado.descripcion}
                      onChange={(e) => setTipoEditado({ ...tipoEditado, descripcion: e.target.value })}
                      className="input-edit"
                      rows="2"
                    />
                  ) : (
                    <span className="desc-tipo">{tipo.descripcion || '-'}</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => toggleActivo(tipo.id)}
                    className={`btn-status ${tipo.activo ? 'activo' : 'inactivo'}`}
                  >
                    {tipo.activo ? <FaToggleOn /> : <FaToggleOff />}
                    {tipo.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>
                  <div className="acciones">
                    {editandoId === tipo.id ? (
                      <>
                        <button className="btn-action save" onClick={guardarEdicion}>
                          <FaSave />
                        </button>
                        <button className="btn-action cancel" onClick={cancelarEdicion}>
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-action edit" onClick={() => iniciarEdicion(tipo)}>
                          <FaEdit />
                        </button>
                        <button className="btn-action delete" onClick={() => eliminarTipo(tipo.id)}>
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
      </div>
    </div>
  );
}

export default TiposTrabajo;
