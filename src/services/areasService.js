import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// ===== ÁREAS =====

export const obtenerAreas = async () => {
  const response = await axios.get(`${API_URL}/api/areas`, getAuthHeaders());
  return response.data;
};

export const obtenerTodasLasAreas = async () => {
  const response = await axios.get(`${API_URL}/api/areas/all`, getAuthHeaders());
  return response.data;
};

export const obtenerAreaPorId = async (id) => {
  const response = await axios.get(`${API_URL}/api/areas/${id}`, getAuthHeaders());
  return response.data;
};

export const crearArea = async (nombre, descripcion = '') => {
  const response = await axios.post(
    `${API_URL}/api/areas`,
    { nombre, descripcion },
    getAuthHeaders()
  );
  return response.data;
};

export const actualizarArea = async (id, nombre, descripcion, activo) => {
  const response = await axios.put(
    `${API_URL}/api/areas/${id}`,
    { nombre, descripcion, activo },
    getAuthHeaders()
  );
  return response.data;
};

export const eliminarArea = async (id) => {
  const response = await axios.delete(
    `${API_URL}/api/areas/${id}`,
    getAuthHeaders()
  );
  return response.data;
};
