import { AppError } from "../../../shared/errors/AppError";
import { ReporteTrabajoRepository } from "../../../domain/repositories/reportesTrabajo/ReporteTrabajoRepository";

export class DeleteReporteUseCase {
  constructor(private readonly repo: ReporteTrabajoRepository) {}
  async execute(id: number) {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new AppError("Registro no encontrado", 404);
  }
}
