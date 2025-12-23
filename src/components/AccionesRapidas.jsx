import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, 
  FaChartLine, 
  FaEye, 
  FaCog, 
  FaFileAlt, 
  FaPrint, 
  FaCut, 
  FaSearch, 
  FaBox, 
  FaTruck 
} from 'react-icons/fa';

const AccionesRapidas = () => {
  const navigate = useNavigate();

  const acciones = [
    {
      titulo: 'Nueva Orden',
      descripcion: 'Crear nueva orden de trabajo',
      icono: <FaPlus className="h-8 w-8" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      ruta: '/ordendeTrabajo/crear'
    },
    {
      titulo: 'Vista Kanban',
      descripcion: 'Seguimiento visual del flujo',
      icono: <FaChartLine className="h-8 w-8" />,
      color: 'bg-green-600 hover:bg-green-700',
      ruta: '/produccion/kanban'
    },
    {
      titulo: 'Módulo Preprensa',
      descripcion: 'Gestión de archivos y preparación',
      icono: <FaFileAlt className="h-8 w-8" />,
      color: 'bg-purple-600 hover:bg-purple-700',
      ruta: '/produccion/preprensa'
    },
    {
      titulo: 'Módulo Prensa',
      descripcion: 'Control de impresión',
      icono: <FaPrint className="h-8 w-8" />,
      color: 'bg-orange-600 hover:bg-orange-700',
      ruta: '/produccion/prensa'
    },
    {
      titulo: 'Módulo Acabados',
      descripcion: 'Procesos de terminado',
      icono: <FaCut className="h-8 w-8" />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      ruta: '/produccion/acabados'
    },
    {
      titulo: 'Control de Calidad',
      descripcion: 'Verificación y aprobación',
      icono: <FaSearch className="h-8 w-8" />,
      color: 'bg-teal-600 hover:bg-teal-700',
      ruta: '/produccion/calidad'
    },
    {
      titulo: 'Empacado y Entrega',
      descripcion: 'Gestión de entregas',
      icono: <FaTruck className="h-8 w-8" />,
      color: 'bg-gray-600 hover:bg-gray-700',
      ruta: '/produccion/entrega'
    },
    {
      titulo: 'Configuración',
      descripcion: 'Ajustes del sistema',
      icono: <FaCog className="h-8 w-8" />,
      color: 'bg-slate-600 hover:bg-slate-700',
      ruta: '/admin/usuarios'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Acciones Rápidas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {acciones.map((accion, index) => (
          <button
            key={index}
            onClick={() => navigate(accion.ruta)}
            className={`${accion.color} text-white p-6 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-105`}
          >
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                {accion.icono}
              </div>
              <h4 className="text-lg font-semibold mb-2">{accion.titulo}</h4>
              <p className="text-sm opacity-90">{accion.descripcion}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AccionesRapidas;
