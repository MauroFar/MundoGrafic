import { AppError } from "../../../shared/errors/AppError";
import { ReporteTrabajoRepository } from "../../../domain/repositories/reportesTrabajo/ReporteTrabajoRepository";

export class GetFechasReporteUseCase {
  constructor(private readonly repo: ReporteTrabajoRepository) {}
  async execute(operador_id: number, filters: { area_id?: number; fecha_desde?: string; fecha_hasta?: string }) {
    if (!operador_id) throw new AppError("operador_id es requerido", 400);
    return this.repo.findFechasByOperador(operador_id, filters);
  }
}
