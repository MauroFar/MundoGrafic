import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3002";

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export interface Area {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export const obtenerAreas = async (): Promise<Area[]> => {
  const response = await axios.get<Area[]>(`${API_URL}/api/areas`, getAuthHeaders());
  return response.data;
};

export const obtenerTodasLasAreas = async (): Promise<Area[]> => {
  const response = await axios.get<Area[]>(`${API_URL}/api/areas/all`, getAuthHeaders());
  return response.data;
};

export const obtenerAreaPorId = async (id: number): Promise<Area> => {
  const response = await axios.get<Area>(`${API_URL}/api/areas/${id}`, getAuthHeaders());
  return response.data;
};

export const crearArea = async (nombre: string, descripcion = ""): Promise<Area> => {
  const response = await axios.post<Area>(
    `${API_URL}/api/areas`,
    { nombre, descripcion },
    getAuthHeaders(),
  );
  return response.data;
};

export const actualizarArea = async (
  id: number,
  nombre: string,
  descripcion: string,
  activo: boolean,
): Promise<Area> => {
  const response = await axios.put<Area>(
    `${API_URL}/api/areas/${id}`,
    { nombre, descripcion, activo },
    getAuthHeaders(),
  );
  return response.data;
};

export const eliminarArea = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/api/areas/${id}`, getAuthHeaders());
};
