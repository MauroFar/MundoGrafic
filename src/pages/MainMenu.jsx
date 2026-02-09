import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const MainMenu = () => {
  const navigate = useNavigate();
  const [modulosAdmin, setModulosAdmin] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener módulos administrativos disponibles
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/permisos/modulos-disponibles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setModulosAdmin(data.modulos || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error obteniendo módulos:', err);
        setLoading(false);
      });
  }, []);

  const allItems = [
    { key: 'produccion', label: 'Producción', onClick: () => navigate('/produccion'), color: 'bg-blue-600' },
    { key: 'gestion-ti', label: 'Gestión TI', onClick: () => window.open('https://registrosmantenimientos.onrender.com/', '_blank'), color: 'bg-green-600' },
    { key: 'inventario', label: 'Inventario', onClick: () => navigate('/inventario'), color: 'bg-yellow-600' },
    { key: 'reportes', label: 'Reportes', onClick: () => navigate('/reportesTrabajoDiario'), color: 'bg-purple-600' },
    { key: 'administracion', label: 'Administración', onClick: () => navigate('/administracion'), color: 'bg-red-600', requireAdmin: true },
  ];

  // Filtrar solo módulos admin si no tiene permisos
  const items = allItems.filter(item => {
    if (item.requireAdmin) {
      return modulosAdmin.length > 0;
    }
    return true; // Mostrar todos los demás módulos
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Cargando menú...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Menú Principal</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
        {items.map(item => (
          <button
            key={item.key}
            onClick={item.onClick}
            className={`${item.color} text-white rounded-lg p-8 shadow-lg hover:opacity-90 flex flex-col items-start`}
          >
            <div className="text-xl font-semibold">{item.label}</div>
            <div className="text-sm mt-2 opacity-80">Ir a {item.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
