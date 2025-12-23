import React, { useState, useEffect } from 'react';
import { FaUser, FaCheckCircle, FaClock, FaChartLine, FaTrophy, FaStar } from 'react-icons/fa';

const ProductividadEmpleados = () => {
  const [empleados, setEmpleados] = useState([]);

  useEffect(() => {
    // Simular datos de productividad por empleado
    const datosFicticios = [
      {
        id: 1,
        nombre: 'Juan Pérez',
        area: 'Preprensa',
        ordenesCompletadas: 12,
        ordenesEnProceso: 3,
        eficiencia: 95,
        tiempoPromedio: 1.2,
        puntuacion: 4.8,
        avatar: 'JP',
        tendencia: 'up',
        cambio: 5
      },
      {
        id: 2,
        nombre: 'María García',
        area: 'Prensa',
        ordenesCompletadas: 15,
        ordenesEnProceso: 2,
        eficiencia: 92,
        tiempoPromedio: 0.8,
        puntuacion: 4.9,
        avatar: 'MG',
        tendencia: 'up',
        cambio: 3
      },
      {
        id: 3,
        nombre: 'Carlos López',
        area: 'Acabados',
        ordenesCompletadas: 18,
        ordenesEnProceso: 1,
        eficiencia: 98,
        tiempoPromedio: 0.5,
        puntuacion: 4.7,
        avatar: 'CL',
        tendencia: 'up',
        cambio: 7
      },
      {
        id: 4,
        nombre: 'Ana Martínez',
        area: 'Control de Calidad',
        ordenesCompletadas: 20,
        ordenesEnProceso: 0,
        eficiencia: 100,
        tiempoPromedio: 0.3,
        puntuacion: 5.0,
        avatar: 'AM',
        tendencia: 'up',
        cambio: 2
      },
      {
        id: 5,
        nombre: 'Roberto Silva',
        area: 'Empacado',
        ordenesCompletadas: 14,
        ordenesEnProceso: 2,
        eficiencia: 88,
        tiempoPromedio: 0.4,
        puntuacion: 4.5,
        avatar: 'RS',
        tendencia: 'down',
        cambio: -2
      },
      {
        id: 6,
        nombre: 'Pedro González',
        area: 'Entrega',
        ordenesCompletadas: 16,
        ordenesEnProceso: 1,
        eficiencia: 94,
        tiempoPromedio: 0.2,
        puntuacion: 4.6,
        avatar: 'PG',
        tendencia: 'up',
        cambio: 4
      }
    ];
    
    setEmpleados(datosFicticios);
  }, []);

  const getEficienciaColor = (eficiencia) => {
    if (eficiencia >= 95) return 'text-green-600 bg-green-100';
    if (eficiencia >= 85) return 'text-blue-600 bg-blue-100';
    if (eficiencia >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' ? <FaChartLine className="text-green-500" /> : <FaChartLine className="text-red-500" />;
  };

  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getPuntuacionEstrellas = (puntuacion) => {
    const estrellas = [];
    const estrellasCompletas = Math.floor(puntuacion);
    const estrellaMedia = puntuacion % 1 >= 0.5;

    for (let i = 0; i < estrellasCompletas; i++) {
      estrellas.push(<FaStar key={i} className="text-yellow-400" />);
    }
    
    if (estrellaMedia) {
      estrellas.push(<FaStar key="media" className="text-yellow-400 opacity-50" />);
    }

    return estrellas;
  };

  const getAreaColor = (area) => {
    const colores = {
      'Preprensa': 'bg-blue-100 text-blue-800',
      'Prensa': 'bg-purple-100 text-purple-800',
      'Acabados': 'bg-orange-100 text-orange-800',
      'Control de Calidad': 'bg-indigo-100 text-indigo-800',
      'Empacado': 'bg-gray-100 text-gray-800',
      'Entrega': 'bg-green-100 text-green-800'
    };
    return colores[area] || 'bg-gray-100 text-gray-800';
  };

  // Ordenar empleados por eficiencia
  const empleadosOrdenados = [...empleados].sort((a, b) => b.eficiencia - a.eficiencia);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaUser className="text-blue-600" />
        Productividad por Empleado
      </h3>

      <div className="space-y-4">
        {empleadosOrdenados.map((empleado, index) => (
          <div key={empleado.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  {empleado.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{empleado.nombre}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getAreaColor(empleado.area)}`}>
                    {empleado.area}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {index < 3 && (
                  <FaTrophy className={`text-${index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}-500`} />
                )}
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{empleado.ordenesCompletadas}</div>
                <div className="text-xs text-gray-600">Completadas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{empleado.ordenesEnProceso}</div>
                <div className="text-xs text-gray-600">En Proceso</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{empleado.tiempoPromedio} días</div>
                <div className="text-xs text-gray-600">Tiempo Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{empleado.puntuacion}</div>
                <div className="text-xs text-gray-600">Puntuación</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Eficiencia:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEficienciaColor(empleado.eficiencia)}`}>
                  {empleado.eficiencia}%
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getPuntuacionEstrellas(empleado.puntuacion)}
                </div>
                <div className="flex items-center gap-1">
                  {getTendenciaIcono(empleado.tendencia)}
                  <span className={`text-xs ${getTendenciaColor(empleado.tendencia)}`}>
                    {empleado.cambio > 0 ? '+' : ''}{empleado.cambio}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de productividad */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {empleados.reduce((sum, emp) => sum + emp.ordenesCompletadas, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Completadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(empleados.reduce((sum, emp) => sum + emp.eficiencia, 0) / empleados.length)}%
            </div>
            <div className="text-sm text-gray-600">Eficiencia Promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {empleados.length}
            </div>
            <div className="text-sm text-gray-600">Empleados Activos</div>
          </div>
        </div>
      </div>

      {/* Top performers */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Top Performers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {empleadosOrdenados.slice(0, 3).map((empleado, index) => (
            <div key={empleado.id} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <FaTrophy className={`text-${index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}-500 text-xl`} />
              </div>
              <div className="font-semibold text-gray-800">{empleado.nombre}</div>
              <div className="text-sm text-gray-600">{empleado.area}</div>
              <div className="text-lg font-bold text-blue-600">{empleado.eficiencia}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductividadEmpleados;
