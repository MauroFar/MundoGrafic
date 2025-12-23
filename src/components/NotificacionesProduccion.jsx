import React, { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfo, 
  FaTimesCircle, 
  FaClock,
  FaPlay,
  FaPrint,
  FaCut,
  FaSearch,
  FaBox,
  FaTruck
} from 'react-icons/fa';

const NotificacionesProduccion = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [contadorNoLeidas, setContadorNoLeidas] = useState(0);

  useEffect(() => {
    // Escuchar eventos de notificaciones del sistema
    const handleNuevaNotificacion = (event) => {
      const nuevaNotificacion = {
        id: Date.now(),
        ...event.detail,
        leida: false,
        timestamp: new Date()
      };
      
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
      setContadorNoLeidas(prev => prev + 1);
      
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        marcarComoLeida(nuevaNotificacion.id);
      }, 5000);
    };

    // Escuchar eventos de cambio de estado
    const handleCambioEstado = (event) => {
      const { ordenId, estadoAnterior, estadoNuevo, usuario } = event.detail;
      
      const nuevaNotificacion = {
        id: Date.now(),
        titulo: "Estado de Orden Actualizado",
        mensaje: `Orden #${ordenId} cambió de ${estadoAnterior} a ${estadoNuevo}`,
        tipo: "info",
        leida: false,
        timestamp: new Date(),
        ordenId,
        estadoAnterior,
        estadoNuevo,
        usuario
      };
      
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
      setContadorNoLeidas(prev => prev + 1);
    };

    // Escuchar eventos de alertas de tiempo
    const handleAlertaTiempo = (event) => {
      const { ordenId, diasRestantes, tipoAlerta } = event.detail;
      
      const nuevaNotificacion = {
        id: Date.now(),
        titulo: tipoAlerta === 'vencida' ? 'Orden Vencida' : 'Alerta de Tiempo',
        mensaje: `Orden #${ordenId} ${tipoAlerta === 'vencida' ? 'está vencida' : `tiene ${diasRestantes} días restantes`}`,
        tipo: tipoAlerta === 'vencida' ? 'error' : 'warning',
        leida: false,
        timestamp: new Date(),
        ordenId,
        diasRestantes,
        tipoAlerta
      };
      
      setNotificaciones(prev => [nuevaNotificacion, ...prev]);
      setContadorNoLeidas(prev => prev + 1);
    };

    // Registrar listeners
    window.addEventListener('nueva-notificacion', handleNuevaNotificacion);
    window.addEventListener('cambio-estado-orden', handleCambioEstado);
    window.addEventListener('alerta-tiempo-orden', handleAlertaTiempo);

    // Cargar notificaciones existentes del localStorage
    const notificacionesGuardadas = localStorage.getItem('notificaciones-produccion');
    if (notificacionesGuardadas) {
      const notificaciones = JSON.parse(notificacionesGuardadas);
      setNotificaciones(notificaciones);
      setContadorNoLeidas(notificaciones.filter(n => !n.leida).length);
    }

    return () => {
      window.removeEventListener('nueva-notificacion', handleNuevaNotificacion);
      window.removeEventListener('cambio-estado-orden', handleCambioEstado);
      window.removeEventListener('alerta-tiempo-orden', handleAlertaTiempo);
    };
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('notificaciones-produccion', JSON.stringify(notificaciones));
  }, [notificaciones]);

  const marcarComoLeida = (id) => {
    setNotificaciones(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
    setContadorNoLeidas(prev => Math.max(0, prev - 1));
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev => 
      prev.map(notif => ({ ...notif, leida: true }))
    );
    setContadorNoLeidas(0);
  };

  const eliminarNotificacion = (id) => {
    setNotificaciones(prev => prev.filter(notif => notif.id !== id));
    setContadorNoLeidas(prev => Math.max(0, prev - 1));
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      success: <FaCheckCircle className="text-green-500" />,
      error: <FaExclamationTriangle className="text-red-500" />,
      warning: <FaExclamationTriangle className="text-yellow-500" />,
      info: <FaInfo className="text-blue-500" />
    };
    return iconos[tipo] || iconos.info;
  };

  const getColorTipo = (tipo) => {
    const colores = {
      success: 'border-l-green-500 bg-green-50',
      error: 'border-l-red-500 bg-red-50',
      warning: 'border-l-yellow-500 bg-yellow-50',
      info: 'border-l-blue-500 bg-blue-50'
    };
    return colores[tipo] || colores.info;
  };

  const formatearTiempo = (timestamp) => {
    const ahora = new Date();
    const diferencia = ahora - timestamp;
    const minutos = Math.floor(diferencia / 60000);
    const horas = Math.floor(diferencia / 3600000);
    const dias = Math.floor(diferencia / 86400000);

    if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'ahora';
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <FaBell className="h-6 w-6" />
        {contadorNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {contadorNoLeidas > 9 ? '9+' : contadorNoLeidas}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {mostrarNotificaciones && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
              <div className="flex gap-2">
                {contadorNoLeidas > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Marcar todas como leídas
                  </button>
                )}
                <button
                  onClick={() => setMostrarNotificaciones(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {notificaciones.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FaBell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notificaciones.map((notificacion) => (
                  <div
                    key={notificacion.id}
                    className={`p-4 border-l-4 ${getColorTipo(notificacion.tipo)} ${
                      !notificacion.leida ? 'bg-opacity-100' : 'bg-opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIconoTipo(notificacion.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notificacion.leida ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notificacion.titulo}
                            </p>
                            <p className={`text-sm mt-1 ${
                              !notificacion.leida ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notificacion.mensaje}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatearTiempo(notificacion.timestamp)}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            {!notificacion.leida && (
                              <button
                                onClick={() => marcarComoLeida(notificacion.id)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Marcar como leída"
                              >
                                <FaCheckCircle className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => eliminarNotificacion(notificacion.id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Eliminar"
                            >
                              <FaTimesCircle className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notificaciones.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setNotificaciones([]);
                  setContadorNoLeidas(0);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Limpiar todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesProduccion;
