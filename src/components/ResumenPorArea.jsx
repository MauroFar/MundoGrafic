import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaPrint, FaCut, FaSearch, FaBox, FaTruck } from 'react-icons/fa';

const ResumenPorArea = () => {
  const [resumenAreas, setResumenAreas] = useState({});

  useEffect(() => {
    // Simular datos de resumen por área
    const datosFicticios = {
      preprensa: {
        nombre: 'Preprensa',
        icono: <FaFileAlt className="text-blue-600" />,
        ordenes: 8,
        completadas: 5,
        enProceso: 2,
        conProblemas: 1,
        eficiencia: 87,
        tiempoPromedio: 1.2
      },
      prensa: {
        nombre: 'Prensa',
        icono: <FaPrint className="text-purple-600" />,
        ordenes: 12,
        completadas: 8,
        enProceso: 3,
        conProblemas: 1,
        eficiencia: 92,
        tiempoPromedio: 0.8
      },
      acabados: {
        nombre: 'Acabados',
        icono: <FaCut className="text-orange-600" />,
        ordenes: 6,
        completadas: 4,
        enProceso: 2,
        conProblemas: 0,
        eficiencia: 95,
        tiempoPromedio: 0.5
      },
      calidad: {
        nombre: 'Control de Calidad',
        icono: <FaSearch className="text-indigo-600" />,
        ordenes: 4,
        completadas: 3,
        enProceso: 1,
        conProblemas: 0,
        eficiencia: 98,
        tiempoPromedio: 0.3
      },
      empacado: {
        nombre: 'Empacado',
        icono: <FaBox className="text-gray-600" />,
        ordenes: 3,
        completadas: 2,
        enProceso: 1,
        conProblemas: 0,
        eficiencia: 100,
        tiempoPromedio: 0.2
      },
      entrega: {
        nombre: 'Entrega',
        icono: <FaTruck className="text-green-600" />,
        ordenes: 2,
        completadas: 1,
        enProceso: 1,
        conProblemas: 0,
        eficiencia: 100,
        tiempoPromedio: 0.1
      }
    };
    
    setResumenAreas(datosFicticios);
  }, []);

  const getEficienciaColor = (eficiencia) => {
    if (eficiencia >= 95) return 'text-green-600 bg-green-100';
    if (eficiencia >= 85) return 'text-blue-600 bg-blue-100';
    if (eficiencia >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Resumen por Área de Producción</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(resumenAreas).map(([area, datos]) => (
          <div key={area} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Header del área */}
            <div className="flex items-center gap-3 mb-4">
              {datos.icono}
              <div>
                <h4 className="font-semibold text-gray-800">{datos.nombre}</h4>
                <p className="text-sm text-gray-600">{datos.ordenes} órdenes totales</p>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completadas:</span>
                <span className="font-medium text-green-600">{datos.completadas}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">En Proceso:</span>
                <span className="font-medium text-blue-600">{datos.enProceso}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Con Problemas:</span>
                <span className="font-medium text-red-600">{datos.conProblemas}</span>
              </div>

              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progreso</span>
                  <span className="text-sm font-medium">{datos.completadas}/{datos.ordenes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(datos.completadas / datos.ordenes) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Eficiencia */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Eficiencia:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEficienciaColor(datos.eficiencia)}`}>
                  {datos.eficiencia}%
                </span>
              </div>

              {/* Tiempo promedio */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tiempo Promedio:</span>
                <span className="text-sm font-medium text-gray-800">{datos.tiempoPromedio} días</span>
              </div>
            </div>

            {/* Botón de acción */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full text-sm bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors">
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen general */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(resumenAreas).reduce((sum, area) => sum + area.ordenes, 0)}
            </div>
            <div className="text-sm text-gray-600">Total de Órdenes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(resumenAreas).reduce((sum, area) => sum + area.completadas, 0)}
            </div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(resumenAreas).reduce((sum, area) => sum + area.enProceso, 0)}
            </div>
            <div className="text-sm text-gray-600">En Proceso</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenPorArea;
