import React, { useState, useEffect } from 'react';
import { 
  FaDollarSign, 
  FaArrowUp, 
  FaArrowDown, 
  FaCalculator 
} from 'react-icons/fa';

const MetricasCostos = () => {
  const [metricasCostos, setMetricasCostos] = useState({});

  useEffect(() => {
    // Simular datos de métricas de costos
    const datosFicticios = {
      ingresosTotales: 125000,
      costosTotales: 85000,
      margenBruto: 40000,
      margenPorcentaje: 32,
      costosPorArea: {
        preprensa: 15000,
        prensa: 25000,
        acabados: 20000,
        calidad: 8000,
        empacado: 5000,
        entrega: 3000,
        administracion: 9000
      },
      costosPorTipo: {
        materiales: 35000,
        manoObra: 30000,
        equipos: 15000,
        servicios: 5000
      },
      tendencias: {
        ingresos: 'up',
        costos: 'down',
        margen: 'up'
      },
      cambios: {
        ingresos: 15000,
        costos: -5000,
        margen: 20000
      },
      ordenesMasRentables: [
        {
          id: 1,
          orden: 'OT-2024-001',
          cliente: 'Empresa ABC S.A.',
          ingresos: 5000,
          costos: 3000,
          margen: 2000,
          margenPorcentaje: 40
        },
        {
          id: 2,
          orden: 'OT-2024-002',
          cliente: 'Tienda XYZ',
          ingresos: 8000,
          costos: 4500,
          margen: 3500,
          margenPorcentaje: 44
        },
        {
          id: 3,
          orden: 'OT-2024-003',
          cliente: 'Restaurante El Buen Sabor',
          ingresos: 3000,
          costos: 1800,
          margen: 1200,
          margenPorcentaje: 40
        }
      ],
      areasMasCostosas: [
        { area: 'Prensa', costo: 25000, porcentaje: 29 },
        { area: 'Acabados', costo: 20000, porcentaje: 24 },
        { area: 'Preprensa', costo: 15000, porcentaje: 18 }
      ]
    };
    
    setMetricasCostos(datosFicticios);
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

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(valor);
  };

  const getMargenColor = (margen) => {
    if (margen >= 40) return 'text-green-600 bg-green-100';
    if (margen >= 30) return 'text-blue-600 bg-blue-100';
    if (margen >= 20) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaDollarSign className="text-blue-600" />
        Métricas de Costos
      </h3>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Ingresos</span>
            {getTendenciaIcono(metricasCostos.tendencias?.ingresos)}
          </div>
          <div className="text-2xl font-bold text-green-800">
            {formatearMoneda(metricasCostos.ingresosTotales)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            <span className={getTendenciaColor(metricasCostos.tendencias?.ingresos)}>
              {metricasCostos.cambios?.ingresos > 0 ? '+' : ''}{formatearMoneda(metricasCostos.cambios?.ingresos)} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Costos</span>
            {getTendenciaIcono(metricasCostos.tendencias?.costos)}
          </div>
          <div className="text-2xl font-bold text-red-800">
            {formatearMoneda(metricasCostos.costosTotales)}
          </div>
          <div className="text-sm text-red-600 mt-1">
            <span className={getTendenciaColor(metricasCostos.tendencias?.costos)}>
              {metricasCostos.cambios?.costos > 0 ? '+' : ''}{formatearMoneda(metricasCostos.cambios?.costos)} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Margen Bruto</span>
            {getTendenciaIcono(metricasCostos.tendencias?.margen)}
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {formatearMoneda(metricasCostos.margenBruto)}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            <span className={getTendenciaColor(metricasCostos.tendencias?.margen)}>
              {metricasCostos.cambios?.margen > 0 ? '+' : ''}{formatearMoneda(metricasCostos.cambios?.margen)} vs mes anterior
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">Margen %</span>
            <FaCalculator className="text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-800">
            {metricasCostos.margenPorcentaje}%
          </div>
          <div className="text-sm text-purple-600 mt-1">
            Rentabilidad
          </div>
        </div>
      </div>

      {/* Costos por área */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Costos por Área</h4>
          <div className="space-y-3">
            {Object.entries(metricasCostos.costosPorArea || {}).map(([area, costo]) => (
              <div key={area} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{area}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {formatearMoneda(costo)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(costo / metricasCostos.costosTotales) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Costos por tipo */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Costos por Tipo</h4>
          <div className="space-y-3">
            {Object.entries(metricasCostos.costosPorTipo || {}).map(([tipo, costo]) => (
              <div key={tipo} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{tipo}</span>
                  <span className="text-sm font-bold text-gray-800">
                    {formatearMoneda(costo)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(costo / metricasCostos.costosTotales) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasCostos;
