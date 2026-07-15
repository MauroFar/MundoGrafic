import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import checkPermission from "../../../middleware/checkPermission";
import { PgReporteTrabajoRepository } from "../../../infrastructure/persistence/repositories/reportesTrabajo/PgReporteTrabajoRepository";
import { ListReportesUseCase } from "../../../application/use-cases/reportesTrabajo/ListReportesUseCase";
import { CreateReporteUseCase } from "../../../application/use-cases/reportesTrabajo/CreateReporteUseCase";
import { UpdateReporteUseCase } from "../../../application/use-cases/reportesTrabajo/UpdateReporteUseCase";
import { DeleteReporteUseCase } from "../../../application/use-cases/reportesTrabajo/DeleteReporteUseCase";
import { GetFechasReporteUseCase } from "../../../application/use-cases/reportesTrabajo/GetFechasReporteUseCase";
import { ReporteTrabajoController } from "../../controllers/reportesTrabajo/ReporteTrabajoController";

export const createReporteTrabajoRoutes = (client: Client) => {
  const router = Router();

  const repo          = new PgReporteTrabajoRepository(client);
  const listUseCase   = new ListReportesUseCase(repo);
  const createUseCase = new CreateReporteUseCase(repo);
  const updateUseCase = new UpdateReporteUseCase(repo);
  const deleteUseCase = new DeleteReporteUseCase(repo);
  const fechasUseCase = new GetFechasReporteUseCase(repo);
  const controller    = new ReporteTrabajoController(
    listUseCase, createUseCase, updateUseCase, deleteUseCase, fechasUseCase, repo,
  );

  router.get("/catalogos",   authRequired(), checkPermission(client, "reportes", "leer"),    controller.catalogos);
  router.get("/mi-contexto", authRequired(),                                                  controller.miContexto);
  router.get("/fechas",      authRequired(), checkPermission(client, "reportes", "leer"),    controller.fechas);
  router.get("/",            authRequired(), checkPermission(client, "reportes", "leer"),    controller.listar);
  router.post("/",           authRequired(), checkPermission(client, "reportes", "crear"),   controller.crear);
  router.put("/:id",         authRequired(), checkPermission(client, "reportes", "editar"),  controller.editar);
  router.delete("/:id",      authRequired(), checkPermission(client, "reportes", "eliminar"), controller.eliminar);

  return router;
};
