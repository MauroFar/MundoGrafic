import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Obtener el token del localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Obtener todos los clientes
export const obtenerClientes = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/clientes`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

// Obtener un cliente por ID
export const obtenerClientePorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/clientes/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    throw error;
  }
};

// Crear un nuevo cliente
export const crearCliente = async (clienteData) => {
  try {
    const response = await axios.post(`${API_URL}/api/clientes`, clienteData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
};

// Actualizar un cliente
export const actualizarCliente = async (id, clienteData) => {
  try {
    const response = await axios.put(`${API_URL}/api/clientes/${id}`, clienteData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
};

// Eliminar un cliente
export const eliminarCliente = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/clientes/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
};

// Buscar clientes
export const buscarClientes = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/api/clientes/buscar?q=${query}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    throw error;
  }
};
