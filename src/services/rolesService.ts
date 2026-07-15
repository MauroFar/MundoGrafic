import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3002";

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export const obtenerRoles = async (): Promise<Rol[]> => {
  const response = await axios.get<Rol[]>(`${API_URL}/api/roles`, getAuthHeaders());
  return response.data;
};

export const obtenerTodosLosRoles = async (): Promise<Rol[]> => {
  const response = await axios.get<Rol[]>(`${API_URL}/api/roles/all`, getAuthHeaders());
  return response.data;
};

export const crearRol = async (nombre: string, descripcion = ""): Promise<Rol> => {
  const response = await axios.post<Rol>(
    `${API_URL}/api/roles`,
    { nombre, descripcion },
    getAuthHeaders(),
  );
  return response.data;
};

export const actualizarRol = async (
  id: number,
  nombre: string,
  descripcion: string,
  activo: boolean,
): Promise<Rol> => {
  const response = await axios.put<Rol>(
    `${API_URL}/api/roles/${id}`,
    { nombre, descripcion, activo },
    getAuthHeaders(),
  );
  return response.data;
};

export const eliminarRol = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/api/roles/${id}`, getAuthHeaders());
};
