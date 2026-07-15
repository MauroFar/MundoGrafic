export interface ReporteTrabajo {
  id: number;
  area_id: number;
  area?: string;
  operador_id: number;
  operador?: string;
  proceso: string;
  solicitado_por: string | null;
  inicio: string;
  fin: string;
  fecha: string;
  created_at?: Date;
}

export interface ReporteTrabajoCreateInput {
  area_id: number;
  usuario_id: number;
  proceso: string;
  solicitado_por?: string | null;
  inicio: string;
  fin: string;
  fecha: string;
}

export interface ReporteTrabajoFilters {
  area_id?: number;
  operador_id?: number;
  fecha?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export interface ReporteFechaItem {
  fecha: string;
  dia_semana_raw: string;
  total: number;
}
