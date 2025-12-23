import React, { useState, useEffect } from 'react';
import { FaClock, FaUser, FaCheckCircle, FaExclamationTriangle, FaInfo, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';

const ActividadesRecientes = () => {
  const [actividades, setActividades] = useState([]);

  useEffect(() => {
    // Simular datos de actividades recientes
    const datosFicticios = [
      {
        id: 1,
        tipo: 'estado',
        usuario: 'Juan Pérez',
        accion: 'cambió el estado',
        detalle: 'Orden OT-2024-001 de Pendiente a En Preprensa',
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutos atrás
        icono: <FaCheckCircle className="text-green-500" />
      },
      {
        id: 2,
        tipo: 'completado',
        usuario: 'María García',
        accion: 'completó',
        detalle: 'Orden OT-2024-002 en Prensa',
        timestamp: new Date(Date.now() - 15 * 60000), // 15 minutos atrás
        icono: <FaCheckCircle className="text-blue-500" />
      },
      {
        id: 3,
        tipo: 'alerta',
        usuario: 'Sistema',
        accion: 'generó alerta',
        detalle: 'Orden OT-2024-003 está próxima a vencer',
        timestamp: new Date(Date.now() - 30 * 60000), // 30 minutos atrás
        icono: <FaExclamationTriangle className="text-yellow-500" />
      },
      {
        id: 4,
        tipo: 'creado',
        usuario: 'Carlos López',
        accion: 'creó',
        detalle: 'Nueva orden OT-2024-004 para Clínica San José',
        timestamp: new Date(Date.now() - 45 * 60000), // 45 minutos atrás
        icono: <FaInfo className="text-purple-500" />
      },
      {
        id: 5,
        tipo: 'entregado',
        usuario: 'Ana Martínez',
        accion: 'entregó',
        detalle: 'Orden OT-2024-005 al cliente Gym Fitness Plus',
        timestamp: new Date(Date.now() - 60 * 60000), // 1 hora atrás
        icono: <FaCheckCircle className="text-green-500" />
      },
      {
        id: 6,
        tipo: 'estado',
        usuario: 'Roberto Silva',
        accion: 'cambió el estado',
        detalle: 'Orden OT-2024-006 de En Acabados a En Control de Calidad',
        timestamp: new Date(Date.now() - 90 * 60000), // 1.5 horas atrás
        icono: <FaCheckCircle className="text-orange-500" />
      },
      {
        id: 7,
        tipo: 'aprobado',
        usuario: 'Pedro González',
        accion: 'aprobó',
        detalle: 'Orden OT-2024-007 en Control de Calidad',
        timestamp: new Date(Date.now() - 120 * 60000), // 2 horas atrás
        icono: <FaCheckCircle className="text-green-500" />
      },
      {
        id: 8,
        tipo: 'iniciado',
        usuario: 'Luis Rodríguez',
        accion: 'inició',
        detalle: 'Trabajo en orden OT-2024-008 en Preprensa',
        timestamp: new Date(Date.now() - 150 * 60000), // 2.5 horas atrás
        icono: <FaClock className="text-blue-500" />
      }
    ];
    
    setActividades(datosFicticios);
  }, []);

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

  const getTipoColor = (tipo) => {
    const colores = {
      estado: 'bg-blue-50 border-blue-200',
      completado: 'bg-green-50 border-green-200',
      alerta: 'bg-yellow-50 border-yellow-200',
      creado: 'bg-purple-50 border-purple-200',
      entregado: 'bg-green-50 border-green-200',
      aprobado: 'bg-green-50 border-green-200',
      iniciado: 'bg-blue-50 border-blue-200'
    };
    return colores[tipo] || 'bg-gray-50 border-gray-200';
  };

  const getTipoTexto = (tipo) => {
    const textos = {
      estado: 'Cambio de Estado',
      completado: 'Completado',
      alerta: 'Alerta',
      creado: 'Nueva Orden',
      entregado: 'Entregado',
      aprobado: 'Aprobado',
      iniciado: 'Iniciado'
    };
    return textos[tipo] || 'Actividad';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <FaClock className="text-blue-600" />
        Actividades Recientes
      </h3>

      <div className="space-y-4">
        {actividades.map((actividad) => (
          <div
            key={actividad.id}
            className={`p-4 rounded-lg border-l-4 ${getTipoColor(actividad.tipo)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {actividad.icono}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {actividad.usuario}
                  </span>
                  <span className="text-sm text-gray-600">
                    {actividad.accion}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                    {getTipoTexto(actividad.tipo)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {actividad.detalle}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaCalendarAlt className="h-3 w-3" />
                  <span>{formatearTiempo(actividad.timestamp)}</span>
                  <span>•</span>
                  <span>{actividad.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón para ver más actividades */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
          <FaArrowRight className="h-4 w-4" />
          Ver todas las actividades
        </button>
      </div>

      {/* Resumen de actividades */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {actividades.filter(a => a.tipo === 'estado').length}
            </div>
            <div className="text-gray-600">Cambios de Estado</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {actividades.filter(a => a.tipo === 'completado' || a.tipo === 'entregado').length}
            </div>
            <div className="text-gray-600">Completadas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {actividades.filter(a => a.tipo === 'alerta').length}
            </div>
            <div className="text-gray-600">Alertas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActividadesRecientes;
