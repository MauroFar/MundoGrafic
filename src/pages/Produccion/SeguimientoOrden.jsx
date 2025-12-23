import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaClock, 
  FaPlay, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaEye,
  FaEdit,
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaPrint,
  FaCut,
  FaSearch,
  FaBox,
  FaTruck,
  FaHistory
} from 'react-icons/fa';

const SeguimientoOrden = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;
  
  const [orden, setOrden] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      cargarOrden();
      cargarHistorial();
    }
  }, [id]);

  const cargarOrden = async () => {
    try {
      setLoading(true);
      // Simular carga de datos con datos ficticios
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Datos ficticios para la orden
      const data = {
        id: parseInt(id),
        numero_orden: `OT-2024-${id.padStart(3, '0')}`,
        concepto: 'Tarjetas de presentación corporativas',
        nombre_cliente: 'Empresa ABC S.A.',
        telefono_cliente: '+1 234 567 8900',
        email_cliente: 'contacto@empresaabc.com',
        direccion_cliente: 'Av. Principal 123, Ciudad',
        fecha_creacion: '2024-01-10T10:30:00Z',
        fecha_entrega: '2024-01-15',
        estado: 'en_preprensa',
        cantidad: '1000',
        responsable_actual: 'Juan Pérez',
        detalle: {
          material: 'Papel couché 300g',
          corte_material: 'A4',
          cantidad_pliegos: '250',
          tipo_impresion: '4/4 colores',
          acabados: 'Barnizado UV',
          observaciones: 'Archivos recibidos, pendiente revisión de colores'
        }
      };
      setOrden(data);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando orden:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    try {
      // Simular carga de historial con datos ficticios
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = [
        {
          id: 1,
          estado_anterior: 'pendiente',
          estado_nuevo: 'en_preprensa',
          usuario: 'Juan Pérez',
          fecha_cambio: '2024-01-10T11:00:00Z',
          observaciones: 'Orden asignada a preprensa'
        },
        {
          id: 2,
          estado_anterior: 'en_preprensa',
          estado_nuevo: 'en_preprensa',
          usuario: 'Juan Pérez',
          fecha_cambio: '2024-01-11T09:30:00Z',
          observaciones: 'Archivos revisados y aprobados'
        },
        {
          id: 3,
          estado_anterior: 'pendiente',
          estado_nuevo: 'pendiente',
          usuario: 'Sistema',
          fecha_cambio: '2024-01-10T10:30:00Z',
          observaciones: 'Orden creada'
        }
      ];
      setHistorial(data);
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const getEstadoInfo = (estado) => {
    const estados = {
      'pendiente': { 
        nombre: 'Pendiente', 
        color: 'yellow', 
        icono: <FaClock className="text-yellow-600" />,
        descripcion: 'Orden creada, esperando inicio de producción'
      },
      'en_preprensa': { 
        nombre: 'En Preprensa', 
        color: 'blue', 
        icono: <FaFileAlt className="text-blue-600" />,
        descripcion: 'Preparando archivos y materiales para impresión'
      },
      'preprensa_completada': { 
        nombre: 'Preprensa Completada', 
        color: 'green', 
        icono: <FaCheckCircle className="text-green-600" />,
        descripcion: 'Archivos listos para impresión'
      },
      'en_prensa': { 
        nombre: 'En Prensa', 
        color: 'purple', 
        icono: <FaPrint className="text-purple-600" />,
        descripcion: 'Impresión en proceso'
      },
      'prensa_completada': { 
        nombre: 'Prensa Completada', 
        color: 'green', 
        icono: <FaCheckCircle className="text-green-600" />,
        descripcion: 'Impresión terminada'
      },
      'en_acabados': { 
        nombre: 'En Acabados', 
        color: 'orange', 
        icono: <FaCut className="text-orange-600" />,
        descripcion: 'Procesos de terminado en curso'
      },
      'acabados_completados': { 
        nombre: 'Acabados Completados', 
        color: 'green', 
        icono: <FaCheckCircle className="text-green-600" />,
        descripcion: 'Terminados completados'
      },
      'en_control_calidad': { 
        nombre: 'En Control de Calidad', 
        color: 'indigo', 
        icono: <FaSearch className="text-indigo-600" />,
        descripcion: 'Verificación de calidad'
      },
      'aprobado': { 
        nombre: 'Aprobado', 
        color: 'green', 
        icono: <FaCheckCircle className="text-green-600" />,
        descripcion: 'Producto aprobado para entrega'
      },
      'empacado': { 
        nombre: 'Empacado', 
        color: 'gray', 
        icono: <FaBox className="text-gray-600" />,
        descripcion: 'Producto empacado'
      },
      'entregado': { 
        nombre: 'Entregado', 
        color: 'green', 
        icono: <FaTruck className="text-green-600" />,
        descripcion: 'Producto entregado al cliente'
      },
      'facturado': { 
        nombre: 'Facturado', 
        color: 'blue', 
        icono: <FaCheckCircle className="text-blue-600" />,
        descripcion: 'Orden facturada'
      },
      'cancelado': { 
        nombre: 'Cancelado', 
        color: 'red', 
        icono: <FaExclamationTriangle className="text-red-600" />,
        descripcion: 'Orden cancelada'
      }
    };
    
    return estados[estado] || estados['pendiente'];
  };

  const getProgreso = (estado) => {
    const estadosOrden = [
      'pendiente', 'en_preprensa', 'preprensa_completada', 
      'en_prensa', 'prensa_completada', 'en_acabados', 
      'acabados_completados', 'en_control_calidad', 
      'aprobado', 'empacado', 'entregado', 'facturado'
    ];
    
    const indice = estadosOrden.indexOf(estado);
    return indice >= 0 ? ((indice + 1) / estadosOrden.length) * 100 : 0;
  };

  const cambiarEstadoOrden = async (nuevoEstado) => {
    try {
      // Simular cambio de estado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Actualizar el estado local
      setOrden(prev => ({ ...prev, estado: nuevoEstado }));
      
      // Agregar al historial
      const nuevoCambio = {
        id: Date.now(),
        estado_anterior: orden.estado,
        estado_nuevo: nuevoEstado,
        usuario: localStorage.getItem('nombre') || 'Usuario',
        fecha_cambio: new Date().toISOString(),
        observaciones: `Estado cambiado a ${getEstadoInfo(nuevoEstado).nombre}`
      };
      
      setHistorial(prev => [nuevoCambio, ...prev]);
      
      // Mostrar notificación
      window.dispatchEvent(new CustomEvent("nueva-notificacion", {
        detail: {
          titulo: "Estado actualizado",
          mensaje: `Orden #${orden.numero_orden} actualizada a ${getEstadoInfo(nuevoEstado).nombre}`,
          tipo: "success",
          fecha: new Date().toLocaleString()
        }
      }));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <FaExclamationTriangle className="h-12 w-12 mx-auto mb-4" />
        <p>Error: {error}</p>
        <button
          onClick={() => navigate('/produccion')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>Orden no encontrada</p>
        <button
          onClick={() => navigate('/produccion')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(orden.estado);
  const progreso = getProgreso(orden.estado);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/produccion')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </button>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Seguimiento de Orden #{orden.numero_orden}
            </h1>
            <p className="text-gray-600">{orden.concepto}</p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/ordendeTrabajo/editar/${orden.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaEdit className="h-4 w-4" />
              Editar Orden
            </button>
            
            {/* Botones de acción rápida según el estado */}
            {orden.estado === 'pendiente' && (
              <button
                onClick={() => cambiarEstadoOrden('en_preprensa')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <FaFileAlt className="h-4 w-4" />
                Iniciar Preprensa
              </button>
            )}
            
            {orden.estado === 'en_preprensa' && (
              <button
                onClick={() => cambiarEstadoOrden('en_prensa')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                <FaPrint className="h-4 w-4" />
                Mover a Prensa
              </button>
            )}
            
            {orden.estado === 'en_prensa' && (
              <button
                onClick={() => cambiarEstadoOrden('en_acabados')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <FaCut className="h-4 w-4" />
                Mover a Acabados
              </button>
            )}
            
            {orden.estado === 'en_acabados' && (
              <button
                onClick={() => cambiarEstadoOrden('en_control_calidad')}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                <FaSearch className="h-4 w-4" />
                Enviar a Calidad
              </button>
            )}
            
            {orden.estado === 'en_control_calidad' && (
              <div className="flex gap-2">
                <button
                  onClick={() => cambiarEstadoOrden('aprobado')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <FaCheckCircle className="h-4 w-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => cambiarEstadoOrden('pendiente')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <FaExclamationTriangle className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Estado Actual */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado Actual</h3>
          <div className="flex items-center gap-3 mb-4">
            {estadoInfo.icono}
            <div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-${estadoInfo.color}-100 text-${estadoInfo.color}-800`}>
                {estadoInfo.nombre}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">{estadoInfo.descripcion}</p>
          
          {/* Barra de Progreso */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{Math.round(progreso)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-${estadoInfo.color}-600 h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cliente</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FaUser className="text-gray-400" />
              <span className="font-medium">{orden.nombre_cliente}</span>
            </div>
            {orden.telefono_cliente && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">📞</span>
                <span className="text-sm">{orden.telefono_cliente}</span>
              </div>
            )}
            {orden.email_cliente && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">✉️</span>
                <span className="text-sm">{orden.email_cliente}</span>
              </div>
            )}
            {orden.direccion_cliente && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">📍</span>
                <span className="text-sm">{orden.direccion_cliente}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fechas Importantes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Fechas</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Creada:</span>
                <span className="ml-2 font-medium">
                  {orden.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Entrega:</span>
                <span className="ml-2 font-medium">
                  {orden.fecha_entrega ? new Date(orden.fecha_entrega).toLocaleDateString() : 'Sin fecha'}
                </span>
              </div>
            </div>
            {orden.fecha_entrega && (
              <div className="mt-2">
                {(() => {
                  const hoy = new Date();
                  const entrega = new Date(orden.fecha_entrega);
                  const diasRestantes = Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24));
                  
                  if (diasRestantes < 0) {
                    return <span className="text-red-600 text-sm font-medium">VENCIDA</span>;
                  } else if (diasRestantes === 0) {
                    return <span className="text-orange-600 text-sm font-medium">ENTREGA HOY</span>;
                  } else if (diasRestantes <= 3) {
                    return <span className="text-yellow-600 text-sm font-medium">{diasRestantes} días restantes</span>;
                  } else {
                    return <span className="text-green-600 text-sm font-medium">{diasRestantes} días restantes</span>;
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Cambios */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaHistory className="text-gray-600" />
          Historial de Cambios
        </h3>
        
        {historial.length > 0 ? (
          <div className="space-y-4">
            {historial.map((cambio, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getEstadoInfo(cambio.estado_anterior).icono}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">
                      Cambio de estado: {getEstadoInfo(cambio.estado_anterior).nombre} → {getEstadoInfo(cambio.estado_nuevo).nombre}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>Por: {cambio.usuario || 'Sistema'}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(cambio.fecha_cambio).toLocaleString()}</span>
                  </div>
                  {cambio.observaciones && (
                    <p className="text-sm text-gray-700 mt-2">{cambio.observaciones}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaHistory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay historial de cambios disponible</p>
          </div>
        )}
      </div>

      {/* Detalles Técnicos */}
      {orden.detalle && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles Técnicos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(orden.detalle).map(([key, value]) => (
              <div key={key} className="bg-gray-50 p-3 rounded">
                <span className="text-sm font-medium text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="ml-2 text-gray-800">{value || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeguimientoOrden;
