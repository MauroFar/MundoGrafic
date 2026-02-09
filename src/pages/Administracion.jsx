import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaCogs, FaBoxes, FaTags, FaUserTag, FaSitemap } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const Administracion = () => {
  const navigate = useNavigate();
  const [modulosDisponibles, setModulosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/permisos/modulos-disponibles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setModulosDisponibles(data.modulos || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando módulos:', err);
        setLoading(false);
      });
  }, []);

  const todosLosModulos = [
    {
      id: 'usuarios',
      titulo: "Gestión de Usuarios",
      descripcion: "Administrar usuarios del sistema, roles y permisos",
      icono: <FaUsers />,
      ruta: "/admin/usuarios",
      color: "#3b82f6"
    },
    {
      id: 'roles',
      titulo: "Gestión de Roles",
      descripcion: "Crear y administrar roles personalizados del sistema",
      icono: <FaUserTag />,
      ruta: "/admin/roles",
      color: "#ec4899"
    },
    {
      id: 'areas',
      titulo: "Gestión de Áreas",
      descripcion: "Administrar áreas y departamentos de la empresa",
      icono: <FaSitemap />,
      ruta: "/admin/areas",
      color: "#06b6d4"
    },
    {
      id: 'catalogo-procesos',
      titulo: "Catálogo de Procesos",
      descripcion: "Gestionar procesos de producción y precios",
      icono: <FaCogs />,
      ruta: "/admin/catalogo-procesos",
      color: "#8b5cf6"
    },
    {
      id: 'tipos-trabajo',
      titulo: "Tipos de Trabajo",
      descripcion: "Administrar tipos de trabajos disponibles",
      icono: <FaTags />,
      ruta: "/admin/tipos-trabajo",
      color: "#f59e0b"
    }
  ];

  // Filtrar módulos según permisos
  const modulosAdmin = todosLosModulos.filter(modulo => 
    modulosDisponibles.includes(modulo.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando módulos...</div>
      </div>
    );
  }

  if (modulosAdmin.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sin módulos administrativos</h2>
          <p className="text-gray-600">No tienes permisos para acceder a módulos administrativos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">⚙️ Panel de Administración</h1>
          <p className="text-gray-600 text-lg">
            Gestiona todos los aspectos del sistema desde un solo lugar
          </p>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulosAdmin.map((modulo) => (
            <div
              key={modulo.id}
              onClick={() => navigate(modulo.ruta)}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden group"
            >
              <div
                className="h-2"
                style={{ backgroundColor: modulo.color }}
              ></div>
              <div className="p-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-white text-2xl group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: modulo.color }}
                >
                  {modulo.icono}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {modulo.titulo}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {modulo.descripcion}
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold" style={{ color: modulo.color }}>
                  Acceder
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info adicional */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-blue-800">💡 Tip: Catálogo de Procesos</h3>
              <p className="mt-2 text-blue-700">
                El <strong>Catálogo de Procesos</strong> es fundamental para la calculadora de cotizaciones. 
                Asegúrate de mantener los precios actualizados para obtener cotizaciones precisas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Administracion;
