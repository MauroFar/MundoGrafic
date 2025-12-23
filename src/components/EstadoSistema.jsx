import React, { useState, useEffect } from 'react';
import { FaServer, FaDatabase, FaCog, FaCheckCircle, FaExclamationTriangle, FaClock, FaUsers, FaChartLine } from 'react-icons/fa';

const EstadoSistema = () => {
  const [estadoSistema, setEstadoSistema] = useState({});

  useEffect(() => {
    // Simular datos de estado del sistema
    const datosFicticios = {
      servidor: {
        estado: 'online',
        uptime: '99.9%',
        respuesta: '45ms',
        cpu: 65,
        memoria: 78
      },
      baseDatos: {
        estado: 'online',
        conexiones: 12,
        consultas: 1250,
        tamaño: '2.3GB'
      },
      usuarios: {
        activos: 8,
        totales: 25,
        ultimoAcceso: '2 min'
      },
      servicios: [
        { nombre: 'API de Producción', estado: 'online', respuesta: '32ms' },
        { nombre: 'API de Cotizaciones', estado: 'online', respuesta: '28ms' },
        { nombre: 'API de Usuarios', estado: 'online', respuesta: '15ms' },
        { nombre: 'Servicio de Notificaciones', estado: 'online', respuesta: '8ms' },
        { nombre: 'Servicio de Archivos', estado: 'online', respuesta: '45ms' }
      ],
      alertas: [
        { tipo: 'warning', mensaje: 'Uso de CPU alto en servidor principal', tiempo: '5 min' },
        { tipo: 'info', mensaje: 'Backup automático completado', tiempo: '1 hora' }
      ]
    };
    
    setEstadoSistema(datosFicticios);
  }, []);

  const getEstadoColor = (estado) => {
    const colores = {
      online: 'text-green-600 bg-green-100',
      offline: 'text-red-600 bg-red-100',
      warning: 'text-yellow-600 bg-yellow-100',
      error: 'text-red-600 bg-red-100'
    };
    return colores[estado] || 'text-gray-600 bg-gray-100';
  };

  const getEstadoIcono = (estado) => {
    const iconos = {
      online: <FaCheckCircle className="text-green-500" />,
      offline: <FaExclamationTriangle className="text-red-500" />,
      warning: <FaExclamationTriangle className="text-yellow-500" />,
      error: <FaExclamationTriangle className="text-red-500" />
    };
    return iconos[estado] || <FaClock className="text-gray-500" />;
  };

  const getAlertaColor = (tipo) => {
    const colores = {
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800'
    };
    return colores[tipo] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaServer className="text-blue-600" />
        Estado del Sistema
      </h3>

      {/* Estado general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Servidor */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaServer className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Servidor</span>
            </div>
            {getEstadoIcono(estadoSistema.servidor?.estado)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Uptime:</span>
              <span className="font-medium">{estadoSistema.servidor?.uptime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Respuesta:</span>
              <span className="font-medium">{estadoSistema.servidor?.respuesta}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">CPU:</span>
              <span className="font-medium">{estadoSistema.servidor?.cpu}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Memoria:</span>
              <span className="font-medium">{estadoSistema.servidor?.memoria}%</span>
            </div>
          </div>
        </div>

        {/* Base de Datos */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaDatabase className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Base de Datos</span>
            </div>
            {getEstadoIcono(estadoSistema.baseDatos?.estado)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Conexiones:</span>
              <span className="font-medium">{estadoSistema.baseDatos?.conexiones}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Consultas:</span>
              <span className="font-medium">{estadoSistema.baseDatos?.consultas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-600">Tamaño:</span>
              <span className="font-medium">{estadoSistema.baseDatos?.tamaño}</span>
            </div>
          </div>
        </div>

        {/* Usuarios */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaUsers className="text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Usuarios</span>
            </div>
            <FaCheckCircle className="text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-600">Activos:</span>
              <span className="font-medium">{estadoSistema.usuarios?.activos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600">Totales:</span>
              <span className="font-medium">{estadoSistema.usuarios?.totales}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600">Último acceso:</span>
              <span className="font-medium">{estadoSistema.usuarios?.ultimoAcceso}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Servicios */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Servicios</h4>
        <div className="space-y-2">
          {estadoSistema.servicios?.map((servicio, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getEstadoIcono(servicio.estado)}
                <span className="font-medium text-gray-800">{servicio.nombre}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{servicio.respuesta}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(servicio.estado)}`}>
                  {servicio.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {estadoSistema.alertas && estadoSistema.alertas.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">Alertas Recientes</h4>
          <div className="space-y-2">
            {estadoSistema.alertas.map((alerta, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${getAlertaColor(alerta.tipo)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getEstadoIcono(alerta.tipo)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alerta.mensaje}</p>
                    <p className="text-xs text-gray-500 mt-1">{alerta.tiempo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de salud del sistema */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FaChartLine className="text-green-600" />
            <h4 className="text-md font-semibold text-gray-800">Salud del Sistema</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">45ms</div>
              <div className="text-gray-600">Tiempo de Respuesta</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">8</div>
              <div className="text-gray-600">Usuarios Activos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadoSistema;
