import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch, FaPlus, FaPhone, FaEnvelope, FaMapMarkerAlt, FaTimes, FaIdCard, FaBuilding, FaUser, FaStickyNote, FaCalendar, FaHistory } from "react-icons/fa";
import { toast } from 'react-toastify';
import { obtenerClientes, eliminarCliente } from "../../services/clientesService";
import { usePermisos } from "../../hooks/usePermisos";
import ModalNoSePuedeEliminar from "../../components/ModalNoSePuedeEliminar";

const ClientesVer = () => {
  const navigate = useNavigate();
  const { puedeCrear, puedeEditar, puedeEliminar, modalData, cerrarModal, verificarYMostrarError } = usePermisos();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "activo", "inactivo"
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null); // Para el modal
  const [showModalNoEliminar, setShowModalNoEliminar] = useState(false);
  const [detallesNoEliminar, setDetallesNoEliminar] = useState(null);
  const [clienteNoEliminar, setClienteNoEliminar] = useState(null);

  // Cargar clientes desde la base de datos
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const data = await obtenerClientes();
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes según el término de búsqueda y estado
  useEffect(() => {
    let filtered = clientes;

    // Filtrar por estado
    if (filtroEstado !== "todos") {
      filtered = filtered.filter(cliente => cliente.estado === filtroEstado);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (cliente) =>
          cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.ruc_cedula.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClientes(filtered);
  }, [searchTerm, clientes, filtroEstado]);

  const handleEdit = (id) => {
    if (!verificarYMostrarError('clientes', 'editar', 'editar este cliente')) {
      return;
    }
    navigate(`/clientes/editar/${id}`);
  };

  const handleDelete = async (id) => {
    if (!verificarYMostrarError('clientes', 'eliminar', 'eliminar este cliente')) {
      return;
    }
    
    // Buscar el cliente para obtener su nombre
    const cliente = clientes.find(c => c.id === id);
    
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await eliminarCliente(id);
        toast.success('Cliente eliminado exitosamente');
        cargarClientes(); // Recargar la lista
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        if (error.response?.status === 409) {
          // Mostrar modal detallado
          const errorData = error.response?.data;
          setClienteNoEliminar(cliente?.nombre || 'el cliente seleccionado');
          setDetallesNoEliminar(errorData?.detalles || null);
          setShowModalNoEliminar(true);
        } else if (error.response?.status === 403) {
          // El interceptor ya maneja el 403
          return;
        } else {
          toast.error('Error al eliminar el cliente');
        }
      }
    }
  };

  const handleCreateNew = () => {
    if (!verificarYMostrarError('clientes', 'crear', 'crear un nuevo cliente')) {
      return;
    }
    navigate("/clientes/crear");
  };

  const handleVerCliente = (cliente) => {
    setClienteSeleccionado(cliente);
  };

  const handleCerrarModal = () => {
    setClienteSeleccionado(null);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
        {puedeCrear('clientes') && (
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-md"
          >
            <FaPlus />
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, empresa, email o RUC/Cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Estadísticas rápidas - Ahora son botones de filtro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFiltroEstado("todos")}
          className={`rounded-lg shadow-md p-4 text-white text-left transition-all duration-200 transform hover:scale-105 ${
            filtroEstado === "todos" 
              ? "bg-gradient-to-r from-blue-600 to-blue-700 ring-4 ring-blue-300" 
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          }`}
        >
          <div className="text-sm opacity-90">Total de Clientes</div>
          <div className="text-3xl font-bold">{clientes.length}</div>
          {filtroEstado === "todos" && (
            <div className="text-xs mt-1 opacity-80">✓ Filtro activo</div>
          )}
        </button>
        <button
          onClick={() => setFiltroEstado("activo")}
          className={`rounded-lg shadow-md p-4 text-white text-left transition-all duration-200 transform hover:scale-105 ${
            filtroEstado === "activo"
              ? "bg-gradient-to-r from-green-600 to-green-700 ring-4 ring-green-300"
              : "bg-gradient-to-r from-green-500 to-green-600"
          }`}
        >
          <div className="text-sm opacity-90">Clientes Activos</div>
          <div className="text-3xl font-bold">
            {clientes.filter(c => c.estado === "activo").length}
          </div>
          {filtroEstado === "activo" && (
            <div className="text-xs mt-1 opacity-80">✓ Filtro activo</div>
          )}
        </button>
        <button
          onClick={() => setFiltroEstado("inactivo")}
          className={`rounded-lg shadow-md p-4 text-white text-left transition-all duration-200 transform hover:scale-105 ${
            filtroEstado === "inactivo"
              ? "bg-gradient-to-r from-orange-600 to-orange-700 ring-4 ring-orange-300"
              : "bg-gradient-to-r from-orange-500 to-orange-600"
          }`}
        >
          <div className="text-sm opacity-90">Clientes Inactivos</div>
          <div className="text-3xl font-bold">
            {clientes.filter(c => c.estado === "inactivo").length}
          </div>
          {filtroEstado === "inactivo" && (
            <div className="text-xs mt-1 opacity-80">✓ Filtro activo</div>
          )}
        </button>
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 text-lg">
            {searchTerm ? "No se encontraron clientes con ese criterio de búsqueda" : "No hay clientes registrados"}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre del Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.map((cliente) => (
                  <tr 
                    key={cliente.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleVerCliente(cliente)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        {cliente.codigo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {cliente.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cliente.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cliente.empresa}</div>
                      <div className="text-sm text-gray-500">{cliente.telefono}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {puedeEditar('clientes') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(cliente.id);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded"
                            title="Editar cliente"
                          >
                            <FaEdit size={18} />
                          </button>
                        )}
                        {puedeEliminar('clientes') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(cliente.id);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded"
                            title="Eliminar cliente"
                          >
                            <FaTrash size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modal de Detalles del Cliente */}
      {clienteSeleccionado && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCerrarModal}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Información del Cliente</h2>
                  <div className="text-blue-100 text-lg font-semibold">
                    {clienteSeleccionado.codigo}
                  </div>
                </div>
                <button
                  onClick={handleCerrarModal}
                  className="text-white hover:bg-blue-500 rounded-full p-2 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="mt-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    clienteSeleccionado.estado === "activo"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {clienteSeleccionado.estado === "activo" ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaUser className="mr-2 text-blue-600" />
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Nombre del Contacto</label>
                    <p className="text-gray-900 font-medium">{clienteSeleccionado.nombre}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">
                      <FaIdCard className="inline mr-1" />
                      RUC/Cédula
                    </label>
                    <p className="text-gray-900 font-medium">{clienteSeleccionado.ruc_cedula}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-sm text-gray-500 block mb-1">Nombre de la Empresa</label>
                    <p className="text-gray-900 font-medium">{clienteSeleccionado.empresa}</p>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaPhone className="mr-2 text-blue-600" />
                  Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <FaPhone className="text-blue-600 mr-3" />
                    <div>
                      <label className="text-sm text-gray-500 block">Teléfono</label>
                      <p className="text-gray-900 font-medium">{clienteSeleccionado.telefono}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <FaEnvelope className="text-blue-600 mr-3" />
                    <div>
                      <label className="text-sm text-gray-500 block">Email</label>
                      <p className="text-gray-900 font-medium break-all">{clienteSeleccionado.email}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <FaCalendar className="text-blue-600 mr-3" />
                    <div>
                      <label className="text-sm text-gray-500 block">Fecha de Registro</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString('es-EC', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaMapMarkerAlt className="mr-2 text-blue-600" />
                  Dirección
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 font-medium">{clienteSeleccionado.direccion}</p>
                </div>
              </div>

              {/* Notas */}
              {clienteSeleccionado.notas && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaStickyNote className="mr-2 text-blue-600" />
                    Notas
                  </h3>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{clienteSeleccionado.notas}</p>
                  </div>
                </div>
              )}

              {/* Información de Auditoría */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center border-b pb-2">
                  <FaHistory className="mr-2 text-blue-600" />
                  Auditoría
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <label className="text-sm text-gray-600 block mb-2 font-semibold">
                      Creado por
                    </label>
                    <p className="text-gray-900 font-medium mb-1">
                      {clienteSeleccionado.createdBy || 'Sistema'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {clienteSeleccionado.createdAt 
                        ? new Date(clienteSeleccionado.createdAt).toLocaleString('es-EC', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  {clienteSeleccionado.updatedBy && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="text-sm text-gray-600 block mb-2 font-semibold">
                        Última modificación por
                      </label>
                      <p className="text-gray-900 font-medium mb-1">
                        {clienteSeleccionado.updatedBy}
                      </p>
                      <p className="text-xs text-gray-500">
                        {clienteSeleccionado.updatedAt 
                          ? new Date(clienteSeleccionado.updatedAt).toLocaleString('es-EC', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleCerrarModal();
                    handleEdit(clienteSeleccionado.id);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaEdit />
                  Editar Cliente
                </button>
                <button
                  onClick={handleCerrarModal}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaTimes />
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de No Se Puede Eliminar */}
      <ModalNoSePuedeEliminar
        isOpen={showModalNoEliminar}
        onClose={() => setShowModalNoEliminar(false)}
        clienteNombre={clienteNoEliminar}
        detalles={detallesNoEliminar}
      />
    </div>
  );
};

export default ClientesVer;
