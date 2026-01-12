import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSave, FaTimes, FaUser, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt, FaIdCard } from "react-icons/fa";
import { toast } from 'react-toastify';
import { obtenerClientePorId, crearCliente, actualizarCliente } from "../../services/clientesService";

const ClientesCrear = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    telefono: "",
    email: "",
    direccion: "",
    ruc_cedula: "",
    estado: "activo",
    notas: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Si estamos en modo edición, cargar datos del cliente
  useEffect(() => {
    if (isEditMode) {
      cargarCliente();
    }
  }, [id, isEditMode]);

  const cargarCliente = async () => {
    try {
      setLoading(true);
      const data = await obtenerClientePorId(id);
      setFormData({
        nombre: data.nombre || '',
        empresa: data.empresa || '',
        telefono: data.telefono || '',
        email: data.email || '',
        direccion: data.direccion || '',
        ruc_cedula: data.ruc_cedula || '',
        estado: data.estado || 'activo',
        notas: data.notas || ''
      });
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      toast.error('Error al cargar los datos del cliente');
      navigate('/clientes/ver');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Limpiar error del campo al modificarlo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = "El nombre de la empresa es requerido";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = "La dirección es requerida";
    }

    if (!formData.ruc_cedula.trim()) {
      newErrors.ruc_cedula = "El RUC/Cédula es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        await actualizarCliente(id, formData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await crearCliente(formData);
        toast.success('Cliente creado exitosamente');
      }
      
      // Redirigir a la lista de clientes
      navigate("/clientes/ver");
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      // El error 403 (sin permisos) es manejado por el interceptor de axios
      if (error.response?.status === 403) {
        // No mostrar toast adicional, el interceptor ya lo maneja
        return;
      }
      if (error.response?.status === 409) {
        toast.error('Ya existe un cliente con ese email o RUC/Cédula');
      } else if (error.response?.status === 400) {
        toast.error('Por favor verifica que todos los campos estén completos');
      } else if (error.response?.status === 401) {
        toast.error('Tu sesión ha expirado, por favor inicia sesión nuevamente');
      } else {
        toast.error('Error al procesar la solicitud. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/produccion");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {isEditMode ? "Editar Cliente" : "Nuevo Cliente"}
        </h1>
        <p className="text-gray-600">
          {isEditMode
            ? "Modifica la información del cliente"
            : "Complete el formulario para registrar un nuevo cliente"}
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre del contacto */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <FaUser className="inline mr-2 text-blue-500" />
              Nombre del Contacto *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.nombre ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Empresa */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <FaBuilding className="inline mr-2 text-blue-500" />
              Nombre de la Empresa *
            </label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.empresa ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: Empresa ABC S.A."
            />
            {errors.empresa && (
              <p className="text-red-500 text-sm mt-1">{errors.empresa}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <FaPhone className="inline mr-2 text-blue-500" />
              Teléfono *
            </label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.telefono ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: 555-0101"
            />
            {errors.telefono && (
              <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <FaEnvelope className="inline mr-2 text-blue-500" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: contacto@empresa.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* RUC/Cédula */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              <FaIdCard className="inline mr-2 text-blue-500" />
              RUC/Cédula *
            </label>
            <input
              type="text"
              name="ruc_cedula"
              value={formData.ruc_cedula}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.ruc_cedula ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: 1234567890 o 1234567890001"
            />
            {errors.ruc_cedula && (
              <p className="text-red-500 text-sm mt-1">{errors.ruc_cedula}</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          {/* Dirección - Ocupa toda la fila */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              <FaMapMarkerAlt className="inline mr-2 text-blue-500" />
              Dirección *
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.direccion ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: Calle Principal 123, Zona 10, Ciudad"
            />
            {errors.direccion && (
              <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
            )}
          </div>

          {/* Notas - Ocupa toda la fila */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">
              Notas (Opcional)
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Información adicional sobre el cliente..."
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            <FaTimes />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            {loading ? "Guardando..." : isEditMode ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientesCrear;
