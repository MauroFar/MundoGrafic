import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaSave, FaLock } from 'react-icons/fa';

const PermisosModal = ({ usuario, onClose, onSave }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const modulos = [
    { id: 'clientes', nombre: 'Clientes', descripcion: 'Gestión de clientes' },
    { id: 'cotizaciones', nombre: 'Cotizaciones', descripcion: 'Crear y gestionar cotizaciones' },
    { id: 'ordenes_trabajo', nombre: 'Órdenes de Trabajo', descripcion: 'Gestión de órdenes de trabajo' },
    { id: 'produccion', nombre: 'Producción', descripcion: 'Módulos de producción' },
    { id: 'inventario', nombre: 'Inventario', descripcion: 'Control de inventario' },
    { id: 'usuarios', nombre: 'Usuarios', descripcion: 'Gestión de usuarios (solo admin)' },
    { id: 'reportes', nombre: 'Reportes', descripcion: 'Ver y generar reportes' }
  ];

  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarPermisos();
  }, [usuario]);

  const cargarPermisos = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/permisos/${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const permisosMap = {};
        
        // Inicializar todos los módulos con permisos en false
        modulos.forEach(mod => {
          permisosMap[mod.id] = {
            puede_crear: false,
            puede_leer: false,
            puede_editar: false,
            puede_eliminar: false
          };
        });

        // Sobrescribir con los permisos existentes
        data.forEach(p => {
          permisosMap[p.modulo] = {
            puede_crear: p.puede_crear,
            puede_leer: p.puede_leer,
            puede_editar: p.puede_editar,
            puede_eliminar: p.puede_eliminar
          };
        });

        setPermisos(permisosMap);
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermiso = (modulo, accion) => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [accion]: !prev[modulo]?.[accion]
      }
    }));
  };

  const toggleTodos = (modulo) => {
    const todosActivos = permisos[modulo]?.puede_crear && 
                        permisos[modulo]?.puede_leer && 
                        permisos[modulo]?.puede_editar && 
                        permisos[modulo]?.puede_eliminar;

    setPermisos(prev => ({
      ...prev,
      [modulo]: {
        puede_crear: !todosActivos,
        puede_leer: !todosActivos,
        puede_editar: !todosActivos,
        puede_eliminar: !todosActivos
      }
    }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      // Convertir el objeto de permisos a array
      const permisosArray = Object.keys(permisos).map(modulo => ({
        modulo,
        ...permisos[modulo]
      }));

      const response = await fetch(`${apiUrl}/api/permisos/${usuario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ permisos: permisosArray })
      });

      if (response.ok) {
        alert('Permisos actualizados exitosamente');
        if (onSave) onSave();
        onClose();
      } else {
        alert('Error al guardar permisos');
      }
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      alert('Error al guardar permisos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <p>Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FaLock /> Gestión de Permisos
              </h2>
              <p className="text-blue-100 mt-1">
                Usuario: <span className="font-semibold">{usuario.nombre}</span> ({usuario.email})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Configure los permisos para cada módulo del sistema. 
              Los permisos determinan qué acciones puede realizar el usuario en cada módulo.
            </p>
          </div>

          <div className="space-y-4">
            {modulos.map(modulo => (
              <div key={modulo.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{modulo.nombre}</h3>
                    <p className="text-sm text-gray-500">{modulo.descripcion}</p>
                  </div>
                  <button
                    onClick={() => toggleTodos(modulo.id)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                  >
                    Todos
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Crear */}
                  <button
                    onClick={() => togglePermiso(modulo.id, 'puede_crear')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      permisos[modulo.id]?.puede_crear
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    {permisos[modulo.id]?.puede_crear ? <FaCheck /> : <FaTimes />}
                    <span className="font-medium">Crear</span>
                  </button>

                  {/* Leer */}
                  <button
                    onClick={() => togglePermiso(modulo.id, 'puede_leer')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      permisos[modulo.id]?.puede_leer
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    {permisos[modulo.id]?.puede_leer ? <FaCheck /> : <FaTimes />}
                    <span className="font-medium">Leer</span>
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => togglePermiso(modulo.id, 'puede_editar')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      permisos[modulo.id]?.puede_editar
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    {permisos[modulo.id]?.puede_editar ? <FaCheck /> : <FaTimes />}
                    <span className="font-medium">Editar</span>
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => togglePermiso(modulo.id, 'puede_eliminar')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      permisos[modulo.id]?.puede_eliminar
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'bg-gray-50 border-gray-300 text-gray-500'
                    }`}
                  >
                    {permisos[modulo.id]?.puede_eliminar ? <FaCheck /> : <FaTimes />}
                    <span className="font-medium">Eliminar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FaSave />
            {saving ? 'Guardando...' : 'Guardar Permisos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermisosModal;
