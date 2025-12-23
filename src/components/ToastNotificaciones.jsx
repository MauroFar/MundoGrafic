import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfo, FaTimesCircle } from 'react-icons/fa';

const ToastNotificaciones = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNuevaNotificacion = (event) => {
      const nuevaNotificacion = {
        id: Date.now(),
        ...event.detail,
        timestamp: new Date()
      };
      
      setToasts(prev => [...prev, nuevaNotificacion]);
      
      // Auto-remover después de 5 segundos
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== nuevaNotificacion.id));
      }, 5000);
    };

    window.addEventListener('nueva-notificacion', handleNuevaNotificacion);
    
    return () => {
      window.removeEventListener('nueva-notificacion', handleNuevaNotificacion);
    };
  }, []);

  const removerToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
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
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    return colores[tipo] || colores.info;
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${getColorTipo(toast.tipo)} transform transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIconoTipo(toast.tipo)}
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium">
                {toast.titulo}
              </h4>
              <p className="mt-1 text-sm">
                {toast.mensaje}
              </p>
              <p className="mt-1 text-xs opacity-75">
                {toast.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => removerToast(toast.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastNotificaciones;
