import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3002";

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export interface Cliente {
  id: number;
  nombre_cliente: string;
  ruc?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  [key: string]: unknown;
}

export const obtenerClientes = async (): Promise<Cliente[]> => {
  const response = await axios.get<Cliente[]>(`${API_URL}/api/clientes`, getAuthHeaders());
  return response.data;
};

export const obtenerClientePorId = async (id: number): Promise<Cliente> => {
  const response = await axios.get<Cliente>(`${API_URL}/api/clientes/${id}`, getAuthHeaders());
  return response.data;
};

export const crearCliente = async (clienteData: Omit<Cliente, "id">): Promise<Cliente> => {
  const response = await axios.post<Cliente>(
    `${API_URL}/api/clientes`,
    clienteData,
    getAuthHeaders(),
  );
  return response.data;
};

export const actualizarCliente = async (
  id: number,
  clienteData: Partial<Omit<Cliente, "id">>,
): Promise<Cliente> => {
  const response = await axios.put<Cliente>(
    `${API_URL}/api/clientes/${id}`,
    clienteData,
    getAuthHeaders(),
  );
  return response.data;
};

export const eliminarCliente = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/api/clientes/${id}`, getAuthHeaders());
};

export const buscarClientes = async (query: string): Promise<Cliente[]> => {
  const response = await axios.get<Cliente[]>(
    `${API_URL}/api/clientes/buscar?q=${encodeURIComponent(query)}`,
    getAuthHeaders(),
  );
  return response.data;
};
