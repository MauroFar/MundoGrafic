import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaClock, FaCalendarAlt } from 'react-icons/fa';

const AlertasTiempo = () => {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    // Simular datos de alertas de tiempo
    const alertasFicticias = [
      {
        id: 1,
        numero_orden: 'OT-2024-001',
        nombre_cliente: 'Empresa ABC S.A.',
        concepto: 'Tarjetas de presentación',
        fecha_entrega: '2024-01-12',
        dias_restantes: -2,
        tipo: 'vencida',
        estado: 'en_preprensa'
      },
      {
        id: 2,
        numero_orden: 'OT-2024-002',
        nombre_cliente: 'Tienda XYZ',
        concepto: 'Volantes promocionales',
        fecha_entrega: '2024-01-15',
        dias_restantes: 1,
        tipo: 'urgente',
        estado: 'en_prensa'
      },
      {
        id: 3,
        numero_orden: 'OT-2024-003',
        nombre_cliente: 'Restaurante El Buen Sabor',
        concepto: 'Menús del restaurante',
        fecha_entrega: '2024-01-18',
        dias_restantes: 3,
        tipo: 'advertencia',
        estado: 'en_acabados'
      }
    ];
    
    setAlertas(alertasFicticias);
  }, []);

  const getAlertaColor = (tipo) => {
    const colores = {
      vencida: 'bg-red-100 border-red-300 text-red-800',
      urgente: 'bg-orange-100 border-orange-300 text-orange-800',
      advertencia: 'bg-yellow-100 border-yellow-300 text-yellow-800'
    };
    return colores[tipo] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getAlertaIcono = (tipo) => {
    const iconos = {
      vencida: <FaExclamationTriangle className="text-red-600" />,
      urgente: <FaClock className="text-orange-600" />,
      advertencia: <FaCalendarAlt className="text-yellow-600" />
    };
    return iconos[tipo] || <FaClock className="text-gray-600" />;
  };

  const getAlertaTexto = (diasRestantes) => {
    if (diasRestantes < 0) return `Vencida hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) > 1 ? 's' : ''}`;
    if (diasRestantes === 0) return 'Vence hoy';
    if (diasRestantes === 1) return 'Vence mañana';
    return `Vence en ${diasRestantes} días`;
  };

  if (alertas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaClock className="text-gray-600" />
          Alertas de Tiempo
        </h3>
        <div className="text-center py-8 text-gray-500">
          <FaClock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay alertas de tiempo pendientes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FaExclamationTriangle className="text-red-600" />
        Alertas de Tiempo ({alertas.length})
      </h3>
      
      <div className="space-y-3">
        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className={`p-4 rounded-lg border-l-4 ${getAlertaColor(alerta.tipo)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getAlertaIcono(alerta.tipo)}
                  <span className="font-semibold">#{alerta.numero_orden}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAlertaColor(alerta.tipo)}`}>
                    {alerta.estado.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium">{alerta.nombre_cliente}</p>
                  <p className="text-sm text-gray-600">{alerta.concepto}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <FaCalendarAlt className="text-gray-400" />
                    <span>{getAlertaTexto(alerta.dias_restantes)}</span>
                    <span className="text-gray-400">•</span>
                    <span>{new Date(alerta.fecha_entrega).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver
                </button>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
          Ver todas las alertas
        </button>
      </div>
    </div>
  );
};

export default AlertasTiempo;
