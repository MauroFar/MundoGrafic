import React, { useState, useEffect } from 'react';
import { 
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

const ProductividadDiaria = () => {
  const [productividad, setProductividad] = useState({});
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const datosFicticios = {
      fecha: fechaSeleccionada,
      ordenesCompletadas: 7,
      ordenesIniciadas: 5,
      ordenesRetrasadas: 2,
      tiempoPromedio: 2.3,
      eficiencia: 89,
      tendencia: 'up',
      comparacionAnterior: 12,
      areasActivas: [
        { nombre: 'Preprensa', ordenes: 3, completadas: 2 },
        { nombre: 'Prensa', ordenes: 4, completadas: 3 },
        { nombre: 'Acabados', ordenes: 2, completadas: 2 },
        { nombre: 'Calidad', ordenes: 1, completadas: 1 }
      ],
      eventos: [
        { hora: '09:00', evento: 'Orden OT-2024-001 iniciada en preprensa', tipo: 'inicio' },
        { hora: '10:30', evento: 'Orden OT-2024-002 completada en prensa', tipo: 'completado' },
        { hora: '11:15', evento: 'Orden OT-2024-003 enviada a calidad', tipo: 'progreso' },
        { hora: '14:00', evento: 'Orden OT-2024-004 aprobada en calidad', tipo: 'aprobado' },
        { hora: '15:30', evento: 'Orden OT-2024-005 entregada al cliente', tipo: 'entregado' }
      ]
    };
    
    setProductividad(datosFicticios);
  }, [fechaSeleccionada]);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' 
      ? <FaArrowUp className="text-green-500" /> 
      : <FaArrowDown className="text-red-500" />;
  };

  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getEventoIcono = (tipo) => {
    const iconos = {
      inicio: <FaClock className="text-blue-500" />,
      completado: <FaCheckCircle className="text-green-500" />,
      progreso: <FaArrowUp className="text-orange-500" />,
      aprobado: <FaCheckCircle className="text-green-500" />,
      entregado: <FaCheckCircle className="text-green-500" />
    };
    return iconos[tipo] || <FaClock className="text-gray-500" />;
  };

  const getEventoColor = (tipo) => {
    const colores = {
      inicio: 'bg-blue-50 border-blue-200',
      completado: 'bg-green-50 border-green-200',
      progreso: 'bg-orange-50 border-orange-200',
      aprobado: 'bg-green-50 border-green-200',
      entregado: 'bg-green-50 border-green-200'
    };
    return colores[tipo] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaCalendarAlt className="text-blue-600" />
          Productividad Diaria
        </h3>
        <input
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Aquí iría todo el resto del JSX como lo tenías antes */}
      {/* Métricas principales, áreas activas, timeline y resumen */}
      {/* No requiere cambios en lógica, solo asegúrate que los íconos usados estén importados */}
    </div>
  );
};

export default ProductividadDiaria;
