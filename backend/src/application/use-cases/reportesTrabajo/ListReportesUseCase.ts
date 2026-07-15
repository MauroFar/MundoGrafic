import { ReporteTrabajoRepository } from "../../../domain/repositories/reportesTrabajo/ReporteTrabajoRepository";
import { ReporteTrabajoFilters } from "../../../domain/entities/reportesTrabajo/ReporteTrabajo";

export class ListReportesUseCase {
  constructor(private readonly repo: ReporteTrabajoRepository) {}
  async execute(filters: ReporteTrabajoFilters) {
    return this.repo.findByFilters(filters);
  }
}
