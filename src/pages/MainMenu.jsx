import React from "react";
import { useNavigate } from "react-router-dom";

const MainMenu = () => {
  const navigate = useNavigate();

  const items = [
    { key: 'produccion', label: 'Producción', onClick: () => navigate('/produccion'), color: 'bg-blue-600' },
    { key: 'gestion-ti', label: 'Gestión TI', onClick: () => window.open('https://registrosmantenimientos.onrender.com/', '_blank'), color: 'bg-green-600' },
    { key: 'inventario', label: 'Inventario', onClick: () => navigate('/inventario'), color: 'bg-yellow-600' },
    { key: 'reportes', label: 'Reportes', onClick: () => navigate('/reportesTrabajoDiario'), color: 'bg-purple-600' },
    { key: 'administracion', label: 'Administración', onClick: () => navigate('/administracion'), color: 'bg-red-600' },
  ];

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
