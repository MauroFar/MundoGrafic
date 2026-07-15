import {
  ReporteTrabajo,
  ReporteTrabajoCreateInput,
  ReporteTrabajoFilters,
  ReporteFechaItem,
} from "../../entities/reportesTrabajo/ReporteTrabajo";

export interface ReporteTrabajoRepository {
  findByFilters(filters: ReporteTrabajoFilters): Promise<ReporteTrabajo[]>;
  findById(id: number): Promise<ReporteTrabajo | null>;
  create(input: ReporteTrabajoCreateInput): Promise<ReporteTrabajo>;
  update(id: number, input: ReporteTrabajoCreateInput): Promise<ReporteTrabajo | null>;
  delete(id: number): Promise<boolean>;
  findFechasByOperador(
    operador_id: number,
    filters: { area_id?: number; fecha_desde?: string; fecha_hasta?: string }
  ): Promise<ReporteFechaItem[]>;
  getContextoUsuario(userId: number): Promise<{
    operador_id: number;
    operador: string;
    area_id: number | null;
    area: string | null;
  } | null>;
  getCatalogos(): Promise<{ areas: any[]; operadores: any[] }>;
}
