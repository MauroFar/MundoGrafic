import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import checkAdminRole from "../../../middleware/checkAdminRole";
import { PgRolRepository } from "../../../infrastructure/persistence/repositories/roles/PgRolRepository";
import { GetActiveRolesUseCase } from "../../../application/use-cases/roles/GetActiveRolesUseCase";
import { GetAllRolesUseCase } from "../../../application/use-cases/roles/GetAllRolesUseCase";
import { GetRolByIdUseCase } from "../../../application/use-cases/roles/GetRolByIdUseCase";
import { CreateRolUseCase } from "../../../application/use-cases/roles/CreateRolUseCase";
import { UpdateRolUseCase } from "../../../application/use-cases/roles/UpdateRolUseCase";
import { DeleteRolUseCase } from "../../../application/use-cases/roles/DeleteRolUseCase";
import { RolController } from "../../controllers/roles/RolController";

export const createRolRoutes = (client: Client) => {
  const router = Router();

  const rolRepository = new PgRolRepository(client);
  const getActiveRolesUseCase = new GetActiveRolesUseCase(rolRepository);
  const getAllRolesUseCase = new GetAllRolesUseCase(rolRepository);
  const getRolByIdUseCase = new GetRolByIdUseCase(rolRepository);
  const createRolUseCase = new CreateRolUseCase(rolRepository);
  const updateRolUseCase = new UpdateRolUseCase(rolRepository);
  const deleteRolUseCase = new DeleteRolUseCase(rolRepository);

  const rolController = new RolController(
    getActiveRolesUseCase,
    getAllRolesUseCase,
    getRolByIdUseCase,
    createRolUseCase,
    updateRolUseCase,
    deleteRolUseCase,
  );

  router.get("/", authRequired(), rolController.listarActivos);
  router.get("/all", authRequired(), checkAdminRole(client), rolController.listarTodos);
  router.get("/:id", authRequired(), checkAdminRole(client), rolController.obtenerPorId);
  router.post("/", authRequired(), checkAdminRole(client), rolController.crear);
  router.put("/:id", authRequired(), checkAdminRole(client), rolController.editar);
  router.delete("/:id", authRequired(), checkAdminRole(client), rolController.eliminar);

  return router;
};
