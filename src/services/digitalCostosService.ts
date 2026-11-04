import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export type TipoProductoDigital = {
  id: number;
  nombre: string;
  activo: boolean;
};

export type MaterialDigital = {
  id: number;
  nombre: string;
  unidad: string;
  tipo_cobro: string;
  costo_unitario: number;
  estado: string;
  tipo_producto_ids?: number[];
};

export type ProcesoDigital = {
  id: number;
  nombre: string;
  tipo_cobro: string;
  precio: number;
  estado: string;
  tipo_producto_ids?: number[];
};

export type CostoOperativoDigital = {
  id: number;
  concepto: string;
  tipo_cobro: string;
  costo_fijo: number;
  estado: string;
  tipo_producto_ids?: number[];
};

export type MargenComercial = {
  id: number;
  configuracion_comercial_id: number;
  nombre: string;
  porcentaje: number;
  activo: boolean;
  orden: number;
};

export type PlazoComercial = {
  id: number;
  configuracion_comercial_id: number;
  nombre: string;
  dias: number;
  recargo_porcentaje: number;
  activo: boolean;
  orden: number;
};

export const obtenerTiposProductoDigitales = async (): Promise<TipoProductoDigital[]> => {
  const { data } = await axios.get(`${API_URL}/api/digital-costos/tipo-productos`, getAuthHeaders());
  return data;
};

export const crearTipoProductoDigital = async (payload: Partial<TipoProductoDigital>) => {
  const { data } = await axios.post(`${API_URL}/api/digital-costos/tipo-productos`, payload, getAuthHeaders());
  return data;
};

export const actualizarTipoProductoDigital = async (id: number, payload: Partial<TipoProductoDigital>) => {
  const { data } = await axios.put(`${API_URL}/api/digital-costos/tipo-productos/${id}`, payload, getAuthHeaders());
  return data;
};

export const eliminarTipoProductoDigital = async (id: number) => {
  const { data } = await axios.delete(`${API_URL}/api/digital-costos/tipo-productos/${id}`, getAuthHeaders());
  return data;
};

export const obtenerMaterialesDigitales = async (): Promise<MaterialDigital[]> => {
  const { data } = await axios.get(`${API_URL}/api/digital-costos/materiales`, getAuthHeaders());
  return data;
};

export const crearMaterialDigital = async (payload: Partial<MaterialDigital>) => {
  const { data } = await axios.post(`${API_URL}/api/digital-costos/materiales`, payload, getAuthHeaders());
  return data;
};

export const actualizarMaterialDigital = async (id: number, payload: Partial<MaterialDigital>) => {
  const { data } = await axios.put(`${API_URL}/api/digital-costos/materiales/${id}`, payload, getAuthHeaders());
  return data;
};

export const eliminarMaterialDigital = async (id: number) => {
  const { data } = await axios.delete(`${API_URL}/api/digital-costos/materiales/${id}`, getAuthHeaders());
  return data;
};

export const obtenerProcesosDigitales = async (): Promise<ProcesoDigital[]> => {
  const { data } = await axios.get(`${API_URL}/api/digital-costos/procesos`, getAuthHeaders());
  return data;
};

export const crearProcesoDigital = async (payload: Partial<ProcesoDigital>) => {
  const { data } = await axios.post(`${API_URL}/api/digital-costos/procesos`, payload, getAuthHeaders());
  return data;
};

export const actualizarProcesoDigital = async (id: number, payload: Partial<ProcesoDigital>) => {
  const { data } = await axios.put(`${API_URL}/api/digital-costos/procesos/${id}`, payload, getAuthHeaders());
  return data;
};

export const eliminarProcesoDigital = async (id: number) => {
  const { data } = await axios.delete(`${API_URL}/api/digital-costos/procesos/${id}`, getAuthHeaders());
  return data;
};

export const obtenerCostosOperativosDigitales = async (): Promise<CostoOperativoDigital[]> => {
  const { data } = await axios.get(`${API_URL}/api/digital-costos/costos-operativos`, getAuthHeaders());
  return data;
};

export const crearCostoOperativoDigital = async (payload: Partial<CostoOperativoDigital>) => {
  const { data } = await axios.post(`${API_URL}/api/digital-costos/costos-operativos`, payload, getAuthHeaders());
  return data;
};

export const actualizarCostoOperativoDigital = async (id: number, payload: Partial<CostoOperativoDigital>) => {
  const { data } = await axios.put(`${API_URL}/api/digital-costos/costos-operativos/${id}`, payload, getAuthHeaders());
  return data;
};

export const eliminarCostoOperativoDigital = async (id: number) => {
  const { data } = await axios.delete(`${API_URL}/api/digital-costos/costos-operativos/${id}`, getAuthHeaders());
  return data;
};

export const obtenerConfiguracionComercialDigital = async () => {
  const { data } = await axios.get(`${API_URL}/api/digital-costos/configuracion-comercial`, getAuthHeaders());
  return data;
};

export const crearMargenComercial = async (payload: Partial<MargenComercial>) => {
  const { data } = await axios.post(`${API_URL}/api/digital-costos/configuracion-comercial/margenes`, payload, getAuthHeaders());
  return data;
};

export const actualizarMargenComercial = async (id: number, payload: Partial<MargenComercial>) => {
  const { data } = await axios.put(`${API_URL}/api/digital-costos/configuracion-comercial/margenes/${id}`, payload, getAuthHeaders());
  return data;
};

export const eliminarMargenComercial = async (id: number) => {
  const { data } = await axios.delete(`${API_URL}/api/digital-costos/configuracion-comercial/margenes/${id}`, getAuthHeaders());
  return data;
};

export const crearPlazoComercial = async (payload: Partial<PlazoComercial>) => {
  const { data } = await axios.post(`${API_URL}/api/digital-costos/configuracion-comercial/plazos`, payload, getAuthHeaders());
  return data;
};

export const actualizarPlazoComercial = async (id: number, payload: Partial<PlazoComercial>) => {
  const { data } = await axios.put(`${API_URL}/api/digital-costos/configuracion-comercial/plazos/${id}`, payload, getAuthHeaders());
  return data;
};

export const eliminarPlazoComercial = async (id: number) => {
  const { data } = await axios.delete(`${API_URL}/api/digital-costos/configuracion-comercial/plazos/${id}`, getAuthHeaders());
  return data;
};
