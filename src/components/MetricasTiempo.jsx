import React, { useState, useEffect } from 'react';
import { 
  FaClock, 
  FaDollarSign,
  FaArrowUp, 
  FaArrowDown, 
  FaChartLine, 
  FaCheckCircle, 
  FaExclamationTriangle 
} from 'react-icons/fa';

const MetricasTiempo = () => {
  const [metricasTiempo, setMetricasTiempo] = useState({});

  useEffect(() => {
    // Simular datos de métricas de tiempo
    const datosFicticios = {
      tiempoPromedioTotal: 2.3,
      tiempoPromedioPreprensa: 1.2,
      tiempoPromedioPrensa: 0.8,
      tiempoPromedioAcabados: 0.5,
      tiempoPromedioCalidad: 0.3,
      tiempoPromedioEmpacado: 0.2,
      tiempoPromedioEntrega: 0.1,
      ordenesEnTiempo: 18,
      ordenesRetrasadas: 3,
      ordenesAntesDeTiempo: 2,
      tendencias: {
        tiempoTotal: 'down',
        tiempoPreprensa: 'down',
        tiempoPrensa: 'up',
        tiempoAcabados: 'down',
        tiempoCalidad: 'down',
        tiempoEmpacado: 'down',
        tiempoEntrega: 'down'
      },
      cambios: {
        tiempoTotal: -0.2,
        tiempoPreprensa: -0.1,
        tiempoPrensa: 0.1,
        tiempoAcabados: -0.1,
        tiempoCalidad: -0.05,
        tiempoEmpacado: -0.05,
        tiempoEntrega: -0.02
      },
      areasConRetrasos: [
        { area: 'Prensa', retrasos: 2, tiempoPromedio: 1.0 },
        { area: 'Preprensa', retrasos: 1, tiempoPromedio: 1.3 }
      ],
      ordenesCriticas: [
        {
          id: 1,
          orden: 'OT-2024-001',
          cliente: 'Empresa ABC S.A.',
          estado: 'en_prensa',
          diasRetraso: 2,
          fechaEntrega: '2024-01-12',
          responsable: 'Carlos López'
        },
        {
          id: 2,
          orden: 'OT-2024-002',
          cliente: 'Tienda XYZ',
          estado: 'en_preprensa',
          diasRetraso: 1,
          fechaEntrega: '2024-01-15',
          responsable: 'Juan Pérez'
        }
      ]
    };
    
    setMetricasTiempo(datosFicticios);
  }, []);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' 
      ? <FaArrowUp className="text-red-500" /> 
      : <FaArrowDown className="text-green-500" />;
  };

  const getTendenciaColor = (tendencia) => {
    return tendencia === 'up' ? 'text-red-600' : 'text-green-600';
  };

  const getTendenciaBgColor = (tendencia) => {
    return tendencia === 'up' ? 'bg-red-100' : 'bg-green-100';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'en_preprensa': 'bg-blue-100 text-blue-800',
      'en_prensa': 'bg-purple-100 text-purple-800',
      'en_acabados': 'bg-orange-100 text-orange-800',
      'en_control_calidad': 'bg-indigo-100 text-indigo-800',
      'empacado': 'bg-gray-100 text-gray-800',
      'entregado': 'bg-green-100 text-green-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getCriticidadColor = (diasRetraso) => {
    if (diasRetraso >= 3) return 'bg-red-50 border-red-200 text-red-800';
    if (diasRetraso >= 2) return 'bg-orange-50 border-orange-200 text-orange-800';
    return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  };

  const getCriticidadIcono = (diasRetraso) => {
    if (diasRetraso >= 3) return <FaExclamationTriangle className="text-red-500" />;
    if (diasRetraso >= 2) return <FaExclamationTriangle className="text-orange-500" />;
    return <FaExclamationTriangle className="text-yellow-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaClock className="text-blue-600" />
        Métricas de Tiempo
      </h3>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Tiempo Total</span>
            {getTendenciaIcono(metricasTiempo.tendencias?.tiempoTotal)}
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {metricasTiempo.tiempoPromedioTotal} días
          </div>
          <div className="text-sm text-blue-600 mt-1">
            <span className={getTendenciaColor(metricasTiempo.tendencias?.tiempoTotal)}>
              {metricasTiempo.cambios?.tiempoTotal > 0 ? '+' : ''}{metricasTiempo.cambios?.tiempoTotal} días vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">En Tiempo</span>
            <FaCheckCircle className="text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-800">
            {metricasTiempo.ordenesEnTiempo}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {metricasTiempo.ordenesAntesDeTiempo} antes de tiempo
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Retrasadas</span>
            <FaExclamationTriangle className="text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-800">
            {metricasTiempo.ordenesRetrasadas}
          </div>
          <div className="text-sm text-red-600 mt-1">
            Requieren atención
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Eficiencia</span>
            <FaChartLine className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {Math.round((metricasTiempo.ordenesEnTiempo / (metricasTiempo.ordenesEnTiempo + metricasTiempo.ordenesRetrasadas)) * 100)}%
          </div>
          <div className="text-sm text-purple-600 mt-1">
            Cumplimiento de tiempos
          </div>
        </div>
      </div>

      {/* Aquí continúa el resto de tu código de áreas, órdenes críticas y resumen */}
    </div>
  );
};

export default MetricasTiempo;
