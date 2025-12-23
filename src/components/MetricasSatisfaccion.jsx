import React, { useState, useEffect } from 'react';
import { 
  FaStar, 
  FaSmile, 
  FaMeh, 
  FaFrown, 
  FaChartLine, 
  FaArrowUp, 
  FaArrowDown 
} from 'react-icons/fa';


const MetricasSatisfaccion = () => {
  const [metricasSatisfaccion, setMetricasSatisfaccion] = useState({});

  useEffect(() => {
    const datosFicticios = {
      satisfaccionGeneral: 4.6,
      satisfaccionPreprensa: 4.8,
      satisfaccionPrensa: 4.5,
      satisfaccionAcabados: 4.7,
      satisfaccionCalidad: 4.9,
      satisfaccionEntrega: 4.4,
      satisfaccionTiempo: 4.3,
      satisfaccionComunicacion: 4.6,
      satisfaccionPrecio: 4.2,
      totalEncuestas: 45,
      encuestasPositivas: 38,
      encuestasNeutras: 5,
      encuestasNegativas: 2,
      tendencias: {
        satisfaccionGeneral: 'up',
        satisfaccionPreprensa: 'up',
        satisfaccionPrensa: 'down',
        satisfaccionAcabados: 'up',
        satisfaccionCalidad: 'up',
        satisfaccionEntrega: 'down',
        satisfaccionTiempo: 'up',
        satisfaccionComunicacion: 'up',
        satisfaccionPrecio: 'down'
      },
      cambios: {
        satisfaccionGeneral: 0.2,
        satisfaccionPreprensa: 0.1,
        satisfaccionPrensa: -0.1,
        satisfaccionAcabados: 0.2,
        satisfaccionCalidad: 0.1,
        satisfaccionEntrega: -0.2,
        satisfaccionTiempo: 0.3,
        satisfaccionComunicacion: 0.1,
        satisfaccionPrecio: -0.1
      },
      comentariosRecientes: [
        {
          id: 1,
          cliente: 'Empresa ABC S.A.',
          orden: 'OT-2024-001',
          calificacion: 5,
          comentario: 'Excelente calidad y cumplimiento de tiempos. Muy recomendable.',
          fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          area: 'Calidad'
        },
        {
          id: 2,
          cliente: 'Tienda XYZ',
          orden: 'OT-2024-002',
          calificacion: 4,
          comentario: 'Buen trabajo, pero hubo un pequeño retraso en la entrega.',
          fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          area: 'Entrega'
        },
        {
          id: 3,
          cliente: 'Restaurante El Buen Sabor',
          orden: 'OT-2024-003',
          calificacion: 5,
          comentario: 'Perfecto, exactamente lo que necesitábamos.',
          fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          area: 'Preprensa'
        }
      ],
      areasMejorCalificadas: [
        { area: 'Calidad', calificacion: 4.9, tendencia: 'up' },
        { area: 'Preprensa', calificacion: 4.8, tendencia: 'up' },
        { area: 'Acabados', calificacion: 4.7, tendencia: 'up' }
      ],
      areasConMejoras: [
        { area: 'Entrega', calificacion: 4.4, tendencia: 'down' },
        { area: 'Prensa', calificacion: 4.5, tendencia: 'down' },
        { area: 'Precio', calificacion: 4.2, tendencia: 'down' }
      ]
    };
    
    setMetricasSatisfaccion(datosFicticios);
  }, []);

  const getTendenciaIcono = (tendencia) => {
    return tendencia === 'up' 
      ? <FaArrowUp className="text-green-500" /> 
      : <FaArrowDown className="text-red-500" />;
  };
  

  const getTendenciaColor = (tendencia) => (tendencia === 'up' ? 'text-green-600' : 'text-red-600');
  const getTendenciaBgColor = (tendencia) => (tendencia === 'up' ? 'bg-green-100' : 'bg-red-100');

  const getCalificacionColor = (calificacion) => {
    if (calificacion >= 4.5) return 'text-green-600 bg-green-100';
    if (calificacion >= 4.0) return 'text-blue-600 bg-blue-100';
    if (calificacion >= 3.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCalificacionIcono = (calificacion) => {
    if (calificacion >= 4.5) return <FaSmile className="text-green-500" />;
    if (calificacion >= 4.0) return <FaMeh className="text-blue-500" />;
    return <FaFrown className="text-red-500" />;
  };

  const getEstrellas = (calificacion) => {
    const estrellas = [];
    const completas = Math.floor(calificacion);
    const media = calificacion % 1 >= 0.5;

    for (let i = 0; i < completas; i++) estrellas.push(<FaStar key={i} className="text-yellow-400" />);
    if (media) estrellas.push(<FaStar key="media" className="text-yellow-400 opacity-50" />);
    return estrellas;
  };

  const formatearFecha = (fecha) => {
    const ahora = new Date();
    const dias = Math.floor((ahora - fecha) / (24 * 60 * 60 * 1000));
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    return `Hace ${dias} días`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaStar className="text-blue-600" />
        Métricas de Satisfacción
      </h3>

      {/* Aquí sigue todo tu JSX de métricas, áreas, comentarios, etc. */}
      {/* Tu código original se puede mantener, solo asegúrate de que uses los íconos importados */}
    </div>
  );
};

export default MetricasSatisfaccion;
