import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const obtenerRoles = async () => {
  const response = await axios.get(`${API_URL}/api/roles`, getAuthHeaders());
  return response.data;
};

export const obtenerTodosLosRoles = async () => {
  const response = await axios.get(`${API_URL}/api/roles/all`, getAuthHeaders());
  return response.data;
};

export const crearRol = async (nombre, descripcion = '') => {
  const response = await axios.post(
    `${API_URL}/api/roles`,
    { nombre, descripcion },
    getAuthHeaders()
  );
  return response.data;
};

export const actualizarRol = async (id, nombre, descripcion, activo) => {
  const response = await axios.put(
    `${API_URL}/api/roles/${id}`,
    { nombre, descripcion, activo },
    getAuthHeaders()
  );
  return response.data;
};

export const eliminarRol = async (id) => {
  const response = await axios.delete(
    `${API_URL}/api/roles/${id}`,
    getAuthHeaders()
  );
  return response.data;
};
