import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaClock, 
  FaChartLine, 
  FaExclamationTriangle, 
  FaUsers, 
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';

const MetricasClave = () => {
  const [metricas, setMetricas] = useState({});

  useEffect(() => {
    // Simular datos de métricas clave
    const datosFicticios = {
      ordenesCompletadas: {
        valor: 45,
        cambio: 12,
        tendencia: 'up',
        periodo: 'este mes'
      },
      tiempoPromedio: {
        valor: 2.3,
        cambio: -0.5,
        tendencia: 'down',
        periodo: 'vs mes anterior',
        unidad: 'días'
      },
      eficiencia: {
        valor: 89,
        cambio: 5,
        tendencia: 'up',
        periodo: 'vs mes anterior',
        unidad: '%'
      },
      ordenesRetrasadas: {
        valor: 3,
        cambio: -2,
        tendencia: 'down',
        periodo: 'vs mes anterior'
      },
      clientesActivos: {
        valor: 28,
        cambio: 4,
        tendencia: 'up',
        periodo: 'este mes'
      },
      ingresos: {
        valor: 125000,
        cambio: 15000,
        tendencia: 'up',
        periodo: 'vs mes anterior',
        unidad: '$'
      }
    };
    
    setMetricas(datosFicticios);
  }, []);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' 
      ? <FaArrowUp className="text-green-500" /> 
      : <FaArrowDown className="text-red-500" />;
  };

  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getTendenciaBgColor = (tendencia) => {
    return tendencia === 'up' ? 'bg-green-100' : 'bg-red-100';
  };

  const formatearValor = (valor, unidad = '') => {
    if (unidad === '$') {
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(valor);
    }
    return `${valor}${unidad}`;
  };

  const formatearCambio = (cambio, unidad = '') => {
    const signo = cambio > 0 ? '+' : '';
    return `${signo}${cambio}${unidad}`;
  };

  const metricasArray = [
    {
      titulo: 'Órdenes Completadas',
      icono: <FaCheckCircle className="text-green-600" />,
      color: 'from-green-50 to-green-100',
      texto: 'text-green-700',
      valor: 'text-green-800',
      ...metricas.ordenesCompletadas
    },
    {
      titulo: 'Tiempo Promedio',
      icono: <FaClock className="text-blue-600" />,
      color: 'from-blue-50 to-blue-100',
      texto: 'text-blue-700',
      valor: 'text-blue-800',
      ...metricas.tiempoPromedio
    },
    {
      titulo: 'Eficiencia',
      icono: <FaChartLine className="text-purple-600" />,
      color: 'from-purple-50 to-purple-100',
      texto: 'text-purple-700',
      valor: 'text-purple-800',
      ...metricas.eficiencia
    },
    {
      titulo: 'Órdenes Retrasadas',
      icono: <FaExclamationTriangle className="text-red-600" />,
      color: 'from-red-50 to-red-100',
      texto: 'text-red-700',
      valor: 'text-red-800',
      ...metricas.ordenesRetrasadas
    },
    {
      titulo: 'Clientes Activos',
      icono: <FaUsers className="text-indigo-600" />,
      color: 'from-indigo-50 to-indigo-100',
      texto: 'text-indigo-700',
      valor: 'text-indigo-800',
      ...metricas.clientesActivos
    },
    {
      titulo: 'Ingresos',
      icono: <FaCalendarAlt className="text-orange-600" />,
      color: 'from-orange-50 to-orange-100',
      texto: 'text-orange-700',
      valor: 'text-orange-800',
      ...metricas.ingresos
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaChartLine className="text-blue-600" />
        Métricas Clave
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricasArray.map((metrica, index) => (
          <div key={index} className={`bg-gradient-to-r ${metrica.color} p-4 rounded-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {metrica.icono}
                <span className={`text-sm font-medium ${metrica.texto}`}>
                  {metrica.titulo}
                </span>
              </div>
              {getTendenciaIcono(metrica.tendencia)}
            </div>
            
            <div className="mb-2">
              <div className={`text-2xl font-bold ${metrica.valor}`}>
                {formatearValor(metrica.valor, metrica.unidad)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTendenciaBgColor(metrica.tendencia)} ${getTendenciaColor(metrica.tendencia)}`}>
                {formatearCambio(metrica.cambio, metrica.unidad)}
              </span>
              <span className="text-xs text-gray-600">
                {metrica.periodo}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen general */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-gray-800 mb-2">Resumen de Rendimiento</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {metricas.eficiencia?.valor}%
              </div>
              <div className="text-gray-600">Eficiencia General</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {metricas.ordenesCompletadas?.valor}
              </div>
              <div className="text-gray-600">Órdenes Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {metricas.tiempoPromedio?.valor} días
              </div>
              <div className="text-gray-600">Tiempo Promedio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasClave;
