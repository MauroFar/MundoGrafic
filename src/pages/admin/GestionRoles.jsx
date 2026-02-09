import { useState, useEffect } from 'react';
import * as rolesService from '../../services/rolesService';
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

function GestionRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [error, setError] = useState('');
  const [modoCrear, setModoCrear] = useState(false);

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesService.obtenerTodosLosRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error cargando roles:', error);
      setError('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const iniciarCreacion = () => {
    setForm({ nombre: '', descripcion: '' });
    setModoCrear(true);
    setEditando(null);
    setError('');
  };

  const iniciarEdicion = (rol) => {
    setForm({ nombre: rol.nombre, descripcion: rol.descripcion || '' });
    setEditando(rol.id);
    setModoCrear(false);
    setError('');
  };

  const cancelar = () => {
    setForm({ nombre: '', descripcion: '' });
    setEditando(null);
    setModoCrear(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (modoCrear) {
        await rolesService.crearRol(form.nombre, form.descripcion);
      } else if (editando) {
        const rolActual = roles.find(r => r.id === editando);
        await rolesService.actualizarRol(
          editando,
          form.nombre,
          form.descripcion,
          rolActual.activo
        );
      }
      await cargarRoles();
      cancelar();
    } catch (error) {
      console.error('Error guardando rol:', error);
      setError(error.response?.data?.error || 'Error al guardar el rol');
    }
  };

  const toggleActivo = async (rol) => {
    try {
      await rolesService.actualizarRol(
        rol.id,
        rol.nombre,
        rol.descripcion,
        !rol.activo
      );
      await cargarRoles();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError(error.response?.data?.error || 'Error al actualizar estado');
    }
  };

  const eliminar = async (id) => {
    const rol = roles.find(r => r.id === id);
    if (rol.es_sistema) {
      setError('No se puede eliminar un rol del sistema');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este rol? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await rolesService.eliminarRol(id);
      await cargarRoles();
    } catch (error) {
      console.error('Error eliminando rol:', error);
      setError(error.response?.data?.error || 'Error al eliminar el rol');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando roles...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Roles</h1>
          <p className="text-gray-600 mt-1">Administre los roles del sistema</p>
        </div>
        {!modoCrear && !editando && (
          <button
            onClick={iniciarCreacion}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Crear Rol
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <FiAlertCircle className="flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <FiX />
          </button>
        </div>
      )}

      {(modoCrear || editando) && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {modoCrear ? 'Crear Nuevo Rol' : 'Editar Rol'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Rol *
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Vendedor, Troquelador, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción opcional del rol"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiCheck /> Guardar
              </button>
              <button
                type="button"
                onClick={cancelar}
                className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <FiX /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((rol) => (
              <tr key={rol.id} className={!rol.activo ? 'bg-gray-50 opacity-60' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{rol.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {rol.descripcion || <span className="italic text-gray-400">Sin descripción</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {rol.es_sistema ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">
                      Sistema
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                      Personalizado
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => toggleActivo(rol)}
                    disabled={rol.es_sistema}
                    className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                      rol.activo
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    } ${rol.es_sistema ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    {rol.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => iniciarEdicion(rol)}
                      disabled={editando || modoCrear}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Editar"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    {!rol.es_sistema && (
                      <button
                        onClick={() => eliminar(rol.id)}
                        disabled={editando || modoCrear}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {roles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay roles registrados
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionRoles;
