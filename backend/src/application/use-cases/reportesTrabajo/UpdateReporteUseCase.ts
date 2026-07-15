import { AppError } from "../../../shared/errors/AppError";
import { ReporteTrabajoRepository } from "../../../domain/repositories/reportesTrabajo/ReporteTrabajoRepository";

export class UpdateReporteUseCase {
  constructor(private readonly repo: ReporteTrabajoRepository) {}

  async execute(id: number, body: any, userId: number) {
    if (!userId) throw new AppError("Usuario no autenticado", 401);

    const { proceso, solicitado_por, inicio, fin, fecha } = body;
    if (!proceso || !inicio || !fin)
      throw new AppError("Campos requeridos: proceso, inicio, fin", 400);

    const contexto = await this.repo.getContextoUsuario(userId);
    if (!contexto) throw new AppError("No se encontró un usuario activo", 400);
    if (!contexto.area_id) throw new AppError("Tu usuario no tiene un área asignada", 400);

    const row = await this.repo.update(id, {
      area_id: contexto.area_id,
      usuario_id: contexto.operador_id,
      proceso,
      solicitado_por: solicitado_por || null,
      inicio,
      fin,
      fecha: fecha || new Date().toISOString().split("T")[0],
    });
    if (!row) throw new AppError("Registro no encontrado", 404);

    return {
      ...row,
      operador_id: row.operador_id ?? contexto.operador_id,
      operador: contexto.operador,
      area: contexto.area,
    };
  }
}
