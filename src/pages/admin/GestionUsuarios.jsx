import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaLock, FaSignature, FaTimes, FaSave } from "react-icons/fa";
import FirmaModalOptimized from "../../components/FirmaModalOptimized";
import PermisosModal from "../../components/PermisosModal";
import * as rolesService from '../../services/rolesService';
import { usePermisos } from "../../hooks/usePermisos";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

function GestionUsuarios() {
  const nombreCompleto = (usuario) => [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ');
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', nombre_usuario: '', nombre: '', apellido: '', rol: '', area_id: '', area_ids: [], password: '', email_personal: '', celular: '', activo: true });
  const [editId, setEditId] = useState(null);
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [showPermisosModal, setShowPermisosModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { puedeCrear, puedeEditar, puedeEliminar, verificarYMostrarError } = usePermisos();

  // Cargar usuarios y áreas al montar
  useEffect(() => {
    fetchUsuarios();
    Promise.all([
      fetch(`${API_URL}/api/areas`, getAuthHeaders()).then(res => res.json()),
      rolesService.obtenerRoles()
    ]).then(([areasData, rolesData]) => {
      setAreas(areasData);
      setRoles(rolesData);
    }).catch(error => {
      console.error('Error cargando datos:', error);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, []);

  const fetchUsuarios = () => {
    fetch(`${API_URL}/api/usuarios`, getAuthHeaders())
      .then(res => res.json())
      .then(data => {
        setUsuarios(data);
        setFilteredUsuarios(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    let filtered = [...usuarios];

    if (filtroEstado === 'activos') {
      filtered = filtered.filter(usuario => usuario.activo);
    }

    if (filtroEstado === 'inactivos') {
      filtered = filtered.filter(usuario => !usuario.activo);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((usuario) => {
        const areaNombre = areas.find(a => a.id === usuario.area_id)?.nombre || '';
        return (
          (usuario.email || '').toLowerCase().includes(term) ||
          (usuario.nombre_usuario || '').toLowerCase().includes(term) ||
          (usuario.nombre || '').toLowerCase().includes(term) ||
          (usuario.apellido || '').toLowerCase().includes(term) ||
          nombreCompleto(usuario).toLowerCase().includes(term) ||
          (usuario.rol || '').toLowerCase().includes(term) ||
          areaNombre.toLowerCase().includes(term)
        );
      });
    }

    setFilteredUsuarios(filtered);
  }, [usuarios, searchTerm, filtroEstado, areas]);

  const handleChange = e => {
    if (e.target.name === 'area_ids') {
      const selected = Array.from(e.target.selectedOptions).map((option) => option.value);
      setForm({ ...form, area_ids: selected });
      return;
    }

    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const accion = editId ? 'editar' : 'crear';
    if (!verificarYMostrarError('usuarios', accion, `${accion} usuarios`)) {
      return;
    }

    const url = editId ? `${API_URL}/api/usuarios/${editId}` : `${API_URL}/api/usuarios`;
    const method = editId ? "PUT" : "POST";
    const body = { ...form };
    const primaryAreaId = Number(form.area_id);

    if (!Number.isInteger(primaryAreaId) || primaryAreaId <= 0) {
      alert("Debes seleccionar un área principal");
      return;
    }

    const extraAreaIds = (form.area_ids || [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0 && value !== primaryAreaId);

    body.area_id = primaryAreaId;
    body.area_ids = [primaryAreaId, ...extraAreaIds];

    if (!form.password) delete body.password;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      fetchUsuarios();
      setForm({ email: '', nombre_usuario: '', nombre: '', apellido: '', rol: '', area_id: '', area_ids: [], password: '', email_personal: '', celular: '', activo: true });
      setEditId(null);
      setShowForm(false);
    } else {
      alert("Error al guardar usuario");
    }
  };

  const handleEdit = usuario => {
    if (!verificarYMostrarError('usuarios', 'editar', 'editar usuarios')) {
      return;
    }

    setForm({
      email: usuario.email,
      nombre_usuario: usuario.nombre_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      rol: usuario.rol,
      area_id: usuario.area_id || '',
      area_ids: (usuario.area_ids || []).filter((area) => Number(area) !== Number(usuario.area_id)).map(String),
      password: '',
      email_personal: usuario.email_personal || '',
      celular: usuario.celular || '',
      activo: usuario.activo !== undefined ? usuario.activo : true
    });
    setEditId(usuario.id);
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!verificarYMostrarError('usuarios', 'eliminar', 'eliminar usuarios')) {
      return;
    }

    if (!window.confirm("¿Seguro que deseas borrar este usuario?")) return;
    const res = await fetch(`${API_URL}/api/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchUsuarios();
    else alert("Error al borrar usuario");
  };

  const handleConfigurarFirma = (usuario) => {
    if (!verificarYMostrarError('usuarios', 'editar', 'configurar firma de usuarios')) {
      return;
    }
    setSelectedUsuario(usuario);
    setShowFirmaModal(true);
  };

  const handleConfigurarPermisos = (usuario) => {
    if (!verificarYMostrarError('usuarios', 'editar', 'configurar permisos de usuarios')) {
      return;
    }
    setSelectedUsuario(usuario);
    setShowPermisosModal(true);
  };

  const handleSaveFirma = async (htmlCode) => {
    try {
      // Verificar tamaño del HTML
      const htmlSize = new Blob([htmlCode]).size;
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (htmlSize > maxSize) {
        alert(`❌ El HTML de la firma es demasiado grande (${(htmlSize / 1024 / 1024).toFixed(2)}MB). El límite es 50MB.`);
        return;
      }

      const res = await fetch(`${API_URL}/api/usuarios/${selectedUsuario.id}/firma`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          firma_html: htmlCode,
          firma_activa: true 
        })
      });
      
      if (res.ok) {
        alert("✅ Firma guardada correctamente");
        fetchUsuarios(); // Recargar lista
      } else {
        let errorMessage = "Error desconocido";
        
        if (res.status === 413) {
          errorMessage = "El HTML de la firma es demasiado grande. Intenta reducir el tamaño de las imágenes.";
        } else if (res.status === 404) {
          errorMessage = "Usuario no encontrado";
        } else if (res.status === 401) {
          errorMessage = "No autorizado";
        } else {
          try {
            const error = await res.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            errorMessage = `Error del servidor (${res.status})`;
          }
        }
        
        alert(`❌ Error al guardar la firma: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error al guardar firma:', error);
      alert(`❌ Error de conexión: ${error.message}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-100 text-lg font-semibold">Cargando usuarios...</div>;

  const resetForm = () => {
    setEditId(null);
    setForm({ email: '', nombre_usuario: '', nombre: '', apellido: '', rol: '', area_id: '', area_ids: [], password: '', email_personal: '', celular: '', activo: true });
  };

  const handleNuevoUsuario = () => {
    if (!verificarYMostrarError('usuarios', 'crear', 'crear usuarios')) {
      return;
    }
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/administracion')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg shadow transition-colors duration-200"
          >
            ← Regresar
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        </div>
        {puedeCrear('usuarios') && (
          <button
            type="button"
            onClick={handleNuevoUsuario}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-md"
          >
            <FaPlus />
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email, usuario, nombre, apellido, rol o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`rounded-lg shadow-md p-4 text-white text-left transition-all duration-200 transform hover:scale-105 ${
            filtroEstado === 'todos'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 ring-4 ring-blue-300'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}
        >
          <div className="text-sm opacity-90">Total de Usuarios</div>
          <div className="text-3xl font-bold">{usuarios.length}</div>
          {filtroEstado === 'todos' && <div className="text-xs mt-1 opacity-80">✓ Filtro activo</div>}
        </button>

        <button
          onClick={() => setFiltroEstado('activos')}
          className={`rounded-lg shadow-md p-4 text-white text-left transition-all duration-200 transform hover:scale-105 ${
            filtroEstado === 'activos'
              ? 'bg-gradient-to-r from-green-600 to-green-700 ring-4 ring-green-300'
              : 'bg-gradient-to-r from-green-500 to-green-600'
          }`}
        >
          <div className="text-sm opacity-90">Usuarios Activos</div>
          <div className="text-3xl font-bold">{usuarios.filter(u => u.activo).length}</div>
          {filtroEstado === 'activos' && <div className="text-xs mt-1 opacity-80">✓ Filtro activo</div>}
        </button>

        <button
          onClick={() => setFiltroEstado('inactivos')}
          className={`rounded-lg shadow-md p-4 text-white text-left transition-all duration-200 transform hover:scale-105 ${
            filtroEstado === 'inactivos'
              ? 'bg-gradient-to-r from-orange-600 to-orange-700 ring-4 ring-orange-300'
              : 'bg-gradient-to-r from-orange-500 to-orange-600'
          }`}
        >
          <div className="text-sm opacity-90">Usuarios Inactivos</div>
          <div className="text-3xl font-bold">{usuarios.filter(u => !u.activo).length}</div>
          {filtroEstado === 'inactivos' && <div className="text-xs mt-1 opacity-80">✓ Filtro activo</div>}
        </button>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            resetForm();
            setShowForm(false);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                  <div className="text-blue-100">Complete la información del usuario</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="text-white hover:bg-blue-500 rounded-full p-2 transition-colors"
                >
                  <FaTimes size={22} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="p-6 bg-blue-50/60 grid grid-cols-1 md:grid-cols-2 gap-6 border border-blue-100 rounded-b-lg">
          <input type="text" name="fake_username" autoComplete="username" className="hidden" />
          <input type="password" name="fake_password" autoComplete="new-password" className="hidden" />
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-blue-900 mb-2">Email Corporativo *</label>
            <input id="email" name="email" value={form.email} onChange={handleChange} placeholder="ejemplo@empresa.com" autoComplete="off" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div>
            <label htmlFor="nombre_usuario" className="block text-sm font-bold text-blue-900 mb-2">Usuario *</label>
            <input id="nombre_usuario" name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} placeholder="Usuario" autoComplete="off" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div>
            <label htmlFor="nombre" className="block text-sm font-bold text-blue-900 mb-2">Nombre *</label>
            <input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" autoComplete="off" required className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div>
            <label htmlFor="apellido" className="block text-sm font-bold text-blue-900 mb-2">Apellido</label>
            <input id="apellido" name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" autoComplete="off" className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div>
            <label htmlFor="rol" className="block text-sm font-bold text-blue-900 mb-2">Rol *</label>
            <div className="flex gap-2">
              <select id="rol" name="rol" value={form.rol} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                <option value="">Seleccione un rol</option>
                {roles.map(rol => (
                  <option key={rol.id} value={rol.nombre}>{rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => navigate('/admin/roles')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                title="Ir a configurar roles"
              >
                ⚙️
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="area_id" className="block text-sm font-bold text-blue-900 mb-2">Área Principal *</label>
            <div className="flex gap-2">
              <select id="area_id" name="area_id" value={form.area_id} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                <option value="">Seleccione un área</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.nombre}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => navigate('/admin/areas')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                title="Ir a configurar áreas"
              >
                ⚙️
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="area_ids" className="block text-sm font-bold text-blue-900 mb-2">Áreas Adicionales</label>
            <select
              id="area_ids"
              name="area_ids"
              multiple
              value={form.area_ids}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {areas
                .filter((area) => String(area.id) !== String(form.area_id))
                .map((area) => (
                  <option key={area.id} value={area.id}>{area.nombre}</option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Mantén presionado Ctrl (o Cmd) para seleccionar varias áreas.</p>
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="password" className="block text-sm font-bold text-blue-900 mb-2">
              {editId ? "Nueva Contraseña (Opcional)" : "Contraseña *"}
            </label>
            <input id="password" name="password" value={form.password} onChange={handleChange} placeholder={editId ? "Dejar en blanco para mantener la actual" : "Contraseña"} autoComplete="new-password" type="password" className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="celular" className="block text-sm font-bold text-blue-900 mb-2">Celular (Opcional)</label>
            <input id="celular" name="celular" value={form.celular} onChange={handleChange} placeholder="Ej: 3001234567" autoComplete="off" className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          
          {/* Campo de email personal (visible para todos los roles) */}
          <div className="md:col-span-2">
            <label htmlFor="email_personal" className="block text-sm font-bold text-blue-900 mb-2">
              Email Personal {form.rol === 'ejecutivo' && '(Requerido para envío de cotizaciones)'}
            </label>
            <input 
              id="email_personal"
              name="email_personal" 
              value={form.email_personal || ''} 
              onChange={handleChange} 
              placeholder="ejemplo@gmail.com" 
              autoComplete="off"
              className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              {form.rol === 'ejecutivo' 
                ? '📧 Este email se usará para enviar cotizaciones desde la cuenta del ejecutivo' 
                : 'Email personal de contacto (opcional)'
              }
            </p>
          </div>
          
          {/* Estado activo del usuario */}
          <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <input 
              type="checkbox" 
              id="activo" 
              name="activo" 
              checked={form.activo} 
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="activo" className="text-sm font-bold text-blue-900 cursor-pointer">
              Usuario Activo
              <span className="block text-xs font-normal text-gray-600 mt-1">
                {form.activo ? '✅ El usuario puede iniciar sesión' : '❌ El usuario no podrá iniciar sesión'}
              </span>
            </label>
          </div>
          
          <div className="md:col-span-2">
            <button 
              type="button" 
              onClick={() => {
                if (editId) {
                  const usuario = usuarios.find(u => u.id === editId);
                  if (usuario) {
                    handleConfigurarFirma(usuario);
                  }
                } else {
                  alert("Primero crea el usuario y luego podrás configurar su firma.");
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold w-full transition-colors"
            >
              📧 Configurar Firma de Email
            </button>
          </div>
          
          <div className="flex gap-4 md:col-span-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold w-full text-lg shadow transition-all duration-200 flex items-center justify-center gap-2">
              <FaSave />
              {editId ? "Actualizar" : "Crear"} Usuario
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl w-full font-bold text-lg shadow transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaTimes />
              Cancelar
            </button>
          </div>
            </form>
          </div>
        </div>

      )}

      {filteredUsuarios.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 text-lg">
            {searchTerm ? "No se encontraron usuarios con ese criterio" : "No hay usuarios registrados"}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol y Área</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{nombreCompleto(u) || u.nombre}</div>
                    <div className="text-sm text-gray-500">@{u.nombre_usuario}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{u.email}</div>
                    {u.rol === 'ejecutivo' && u.email_personal && (
                      <div className="text-xs text-gray-500">Personal: {u.email_personal}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{u.rol}</div>
                    <div className="text-sm text-gray-500">
                      {areas.find(a => a.id === u.area_id)?.nombre || 'Sin área'}
                      {Array.isArray(u.area_ids) && u.area_ids.length > 1 ? ` (+${u.area_ids.length - 1})` : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.activo ? (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">Activo</span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">Inactivo</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-start justify-center gap-3 flex-wrap">
                      {puedeEditar('usuarios') && (
                        <button
                          className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded flex flex-col items-center min-w-[64px]"
                          onClick={() => handleEdit(u)}
                          title="Editar"
                        >
                          <FaEdit size={16} />
                          <span className="text-[11px] mt-1 font-medium">Editar</span>
                        </button>
                      )}
                      {puedeEditar('usuarios') && (
                        <button
                          className="text-green-600 hover:text-green-900 transition-colors p-2 hover:bg-green-50 rounded flex flex-col items-center min-w-[64px]"
                          onClick={() => handleConfigurarPermisos(u)}
                          title="Permisos"
                        >
                          <FaLock size={16} />
                          <span className="text-[11px] mt-1 font-medium">Permisos</span>
                        </button>
                      )}
                      {puedeEditar('usuarios') && (
                        <button
                          className="text-purple-600 hover:text-purple-900 transition-colors p-2 hover:bg-purple-50 rounded flex flex-col items-center min-w-[64px]"
                          onClick={() => handleConfigurarFirma(u)}
                          title="Firma"
                        >
                          <FaSignature size={16} />
                          <span className="text-[11px] mt-1 font-medium">Firma</span>
                        </button>
                      )}
                      {puedeEliminar('usuarios') && u.rol !== "admin" && (
                        <button
                          className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded flex flex-col items-center min-w-[64px]"
                          onClick={() => handleDelete(u.id)}
                          title="Eliminar"
                        >
                          <FaTrash size={16} />
                          <span className="text-[11px] mt-1 font-medium">Eliminar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
       
               {/* Modal de Firma Optimizado */}
        <FirmaModalOptimized
          isOpen={showFirmaModal}
          onClose={() => setShowFirmaModal(false)}
          onSave={handleSaveFirma}
          usuario={selectedUsuario}
        />
        
        {/* Modal de Permisos */}
        {showPermisosModal && selectedUsuario && (
          <PermisosModal
            usuario={selectedUsuario}
            onClose={() => setShowPermisosModal(false)}
            onSave={() => {
              fetchUsuarios();
              setShowPermisosModal(false);
            }}
          />
        )}
    </div>
   );
 }

export default GestionUsuarios;