export const MAQUINAS_PERMITIDAS = [
  "Plegadora Alba",
  "Plegadora ZH-880G",
  "Plegadora Mini",
  "Plegadora Tumix ZH-800G",
] as const;

export const ACTIVIDADES_PERMITIDAS = [
  "Limpieza",
  "Pegado lateral",
  "Pegado fondo automático",
  "Pegado de 4 puntas",
  "Pegado de 6 puntas",
  "Pegado cajas Tumix",
  "Pegado lateral metalizado",
  "Encaminado de máquina",
  "Pegado fondo automático y lineal",
] as const;

export const TARIFAS_POR_MILLAR: Record<string, number> = {
  Limpieza: 0,
  "Pegado lateral": 3,
  "Pegado fondo automático": 8,
  "Pegado de 4 puntas": 8,
  "Pegado de 6 puntas": 8,
  "Pegado cajas Tumix": 2,
  "Pegado lateral metalizado": 6,
  "Encaminado de máquina": 9,
  "Pegado fondo automático y lineal": 10,
};

export type Maquina = (typeof MAQUINAS_PERMITIDAS)[number];
export type Actividad = (typeof ACTIVIDADES_PERMITIDAS)[number];

export interface RegistroOperario {
  id: number;
  fecha: string;
  operario: string;
  codigo_operario: string;
  cliente: string;
  orden_compra: string;
  lote: string;
  producto: string;
  cantidad: number;
  millares: number;
  maquina: string;
  actividad: string;
  tiempo_efectivo_min: number;
  tiempo_parado_min: number;
  pausas_texto: string | null;
  observaciones: string | null;
  ingreso_estimado: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface RegistroOperarioCreateInput {
  fecha: string;
  operario: string;
  codigo_operario: string;
  cliente: string;
  orden_compra: string;
  lote: string;
  producto: string;
  cantidad: number;
  millares: number;
  maquina: string;
  actividad: string;
  tiempo_efectivo_min: number;
  tiempo_parado_min: number;
  pausas_texto?: string | null;
  observaciones?: string | null;
  ingreso_estimado: number;
}

export interface RegistroOperarioFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  operario?: string;
  maquina?: string;
  actividad?: string;
  limit?: number;
}

/** Calcula millares redondeando hacia arriba cada 1000 unidades */
export function calcMillares(cantidad: number): number {
  if (!Number.isInteger(cantidad) || cantidad < 100) return 0;
  return Math.ceil(cantidad / 1000);
}
