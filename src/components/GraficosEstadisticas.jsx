import React, { useState, useEffect } from 'react';
import { FaChartBar, FaChartPie, FaChartLine } from 'react-icons/fa';

const GraficosEstadisticas = () => {
  const [tipoGrafico, setTipoGrafico] = useState('barras');
  const [datos, setDatos] = useState({});

  useEffect(() => {
    // Simular datos para gráficos
    const datosFicticios = {
      ordenesPorEstado: {
        'Pendientes': 12,
        'En Preprensa': 8,
        'En Prensa': 6,
        'En Acabados': 4,
        'En Control': 3,
        'Entregadas': 15
      },
      ordenesPorMes: {
        'Enero': 45,
        'Febrero': 52,
        'Marzo': 48,
        'Abril': 61,
        'Mayo': 55,
        'Junio': 58
      },
      eficienciaPorArea: {
        'Preprensa': 87,
        'Prensa': 92,
        'Acabados': 95,
        'Calidad': 98,
        'Empacado': 100,
        'Entrega': 100
      }
    };
    
    setDatos(datosFicticios);
  }, []);

  // --- Componentes de gráficos ---
  const GraficoBarras = ({ datos = {}, titulo }) => {
    const maxValor = datos ? Math.max(...Object.values(datos)) : 0;

    return (
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-800">{titulo}</h4>
        <div className="space-y-3">
          {Object.entries(datos || {}).map(([categoria, valor]) => (
            <div key={categoria} className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600 truncate">{categoria}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${maxValor ? (valor / maxValor) * 100 : 0}%` }}
                ></div>
                <span className="absolute right-2 top-0 text-xs text-gray-700 leading-4">
                  {valor}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const GraficoCircular = ({ datos = {}, titulo }) => {
    const total = Object.values(datos || {}).reduce((sum, valor) => sum + valor, 0);
    const colores = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return (
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-800">{titulo}</h4>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {Object.entries(datos || {}).map(([categoria, valor], index) => {
                const porcentaje = total ? (valor / total) * 100 : 0;
                const radio = 40;
                const circunferencia = 2 * Math.PI * radio;
                const strokeDasharray = circunferencia;
                const strokeDashoffset = circunferencia - (porcentaje / 100) * circunferencia;

                return (
                  <circle
                    key={categoria}
                    cx="50"
                    cy="50"
                    r={radio}
                    fill="none"
                    stroke={colores[index % colores.length]}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-800">{total}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(datos || {}).map(([categoria, valor], index) => (
            <div key={categoria} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colores[index % colores.length] }}
              ></div>
              <span className="text-gray-600">{categoria}</span>
              <span className="font-medium">{valor}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const GraficoLineas = ({ datos = {}, titulo }) => {
    const valores = Object.values(datos || {});
    const maxValor = valores.length ? Math.max(...valores) : 1;
    const keys = Object.keys(datos || {});
    const puntos = keys.map((categoria, index) => ({
      x: (index / (keys.length - 1 || 1)) * 100,
      y: 100 - (datos[categoria] / maxValor) * 100
    }));

    const pathData = puntos.map((punto, index) => 
      `${index === 0 ? 'M' : 'L'} ${punto.x} ${punto.y}`
    ).join(' ');

    return (
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-800">{titulo}</h4>
        <div className="relative h-32 bg-gray-50 rounded-lg p-4">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={pathData}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              className="transition-all duration-500"
            />
            {puntos.map((punto, index) => (
              <circle
                key={index}
                cx={punto.x}
                cy={punto.y}
                r="2"
                fill="#3B82F6"
                className="transition-all duration-500"
              />
            ))}
          </svg>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          {keys.map(categoria => (
            <span key={categoria} className="truncate">{categoria}</span>
          ))}
        </div>
      </div>
    );
  };

  // --- Render principal ---
  if (!datos || Object.keys(datos).length === 0) {
    return <p className="p-6 text-gray-500">Cargando gráficos...</p>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaChartBar className="text-blue-600" />
          Estadísticas Visuales
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTipoGrafico('barras')}
            className={`p-2 rounded-md ${tipoGrafico === 'barras' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Gráfico de barras"
          >
            <FaChartBar className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTipoGrafico('circular')}
            className={`p-2 rounded-md ${tipoGrafico === 'circular' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Gráfico circular"
          >
            <FaChartPie className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTipoGrafico('lineas')}
            className={`p-2 rounded-md ${tipoGrafico === 'lineas' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            title="Gráfico de líneas"
          >
            <FaChartLine className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tipoGrafico === 'barras' && (
          <>
            <GraficoBarras datos={datos.ordenesPorEstado} titulo="Órdenes por Estado" />
            <GraficoBarras datos={datos.ordenesPorMes} titulo="Órdenes por Mes" />
            <GraficoBarras datos={datos.eficienciaPorArea} titulo="Eficiencia por Área (%)" />
          </>
        )}

        {tipoGrafico === 'circular' && (
          <>
            <GraficoCircular datos={datos.ordenesPorEstado} titulo="Distribución por Estado" />
            <GraficoCircular datos={datos.ordenesPorMes} titulo="Distribución por Mes" />
            <GraficoCircular datos={datos.eficienciaPorArea} titulo="Eficiencia por Área" />
          </>
        )}

        {tipoGrafico === 'lineas' && (
          <>
            <GraficoLineas datos={datos.ordenesPorMes} titulo="Tendencia Mensual" />
            <GraficoLineas datos={datos.eficienciaPorArea} titulo="Eficiencia por Área" />
            <div className="flex items-center justify-center text-gray-500">
              <p>Más gráficos disponibles</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GraficosEstadisticas;
