import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import checkAdminRole from "../../../middleware/checkAdminRole";
import { PgAreaRepository } from "../../../infrastructure/persistence/repositories/areas/PgAreaRepository";
import { GetActiveAreasUseCase } from "../../../application/use-cases/areas/GetActiveAreasUseCase";
import { GetAllAreasUseCase } from "../../../application/use-cases/areas/GetAllAreasUseCase";
import { GetAreaByIdUseCase } from "../../../application/use-cases/areas/GetAreaByIdUseCase";
import { CreateAreaUseCase } from "../../../application/use-cases/areas/CreateAreaUseCase";
import { UpdateAreaUseCase } from "../../../application/use-cases/areas/UpdateAreaUseCase";
import { DeleteAreaUseCase } from "../../../application/use-cases/areas/DeleteAreaUseCase";
import { AreaController } from "../../controllers/areas/AreaController";

export const createAreaRoutes = (client: Client) => {
  const router = Router();

  const areaRepository = new PgAreaRepository(client);
  const getActiveAreasUseCase = new GetActiveAreasUseCase(areaRepository);
  const getAllAreasUseCase = new GetAllAreasUseCase(areaRepository);
  const getAreaByIdUseCase = new GetAreaByIdUseCase(areaRepository);
  const createAreaUseCase = new CreateAreaUseCase(areaRepository);
  const updateAreaUseCase = new UpdateAreaUseCase(areaRepository);
  const deleteAreaUseCase = new DeleteAreaUseCase(areaRepository);

  const areaController = new AreaController(
    getActiveAreasUseCase,
    getAllAreasUseCase,
    getAreaByIdUseCase,
    createAreaUseCase,
    updateAreaUseCase,
    deleteAreaUseCase,
  );

  router.get("/", authRequired(), areaController.listarActivas);
  router.get("/all", authRequired(), checkAdminRole(client), areaController.listarTodas);
  router.get("/:id", authRequired(), checkAdminRole(client), areaController.obtenerPorId);
  router.post("/", authRequired(), checkAdminRole(client), areaController.crear);
  router.put("/:id", authRequired(), checkAdminRole(client), areaController.editar);
  router.delete("/:id", authRequired(), checkAdminRole(client), areaController.eliminar);

  return router;
};
