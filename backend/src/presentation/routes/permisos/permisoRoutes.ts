import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import checkAdminRole from "../../../middleware/checkAdminRole";
import { PgPermisoRepository } from "../../../infrastructure/persistence/repositories/permisos/PgPermisoRepository";
import { GetModulosDisponiblesUseCase } from "../../../application/use-cases/permisos/GetModulosDisponiblesUseCase";
import { GetPermisosUsuarioUseCase } from "../../../application/use-cases/permisos/GetPermisosUsuarioUseCase";
import { UpdatePermisosUsuarioUseCase } from "../../../application/use-cases/permisos/UpdatePermisosUsuarioUseCase";
import { VerificarPermisoUseCase } from "../../../application/use-cases/permisos/VerificarPermisoUseCase";
import { PermisoController } from "../../controllers/permisos/PermisoController";

export const createPermisoRoutes = (client: Client) => {
  const router = Router();

  const repo            = new PgPermisoRepository(client);
  const modulosUseCase  = new GetModulosDisponiblesUseCase(repo);
  const getUseCase      = new GetPermisosUsuarioUseCase(repo);
  const updateUseCase   = new UpdatePermisosUsuarioUseCase(repo);
  const verificarUseCase = new VerificarPermisoUseCase(repo);
  const controller      = new PermisoController(modulosUseCase, getUseCase, updateUseCase, verificarUseCase, repo);

  // Orden importa: rutas específicas antes que /:param
  router.get("/modulos-disponibles",    authRequired(),                        controller.modulosDisponibles);
  router.get("/catalogo",               authRequired(), checkAdminRole(client), controller.catalogo);
  router.get("/mis-permisos/actual",    authRequired(),                        controller.misPermisos);
  router.get("/:usuarioId",             authRequired(), checkAdminRole(client), controller.getByUsuario);
  router.put("/:usuarioId",             authRequired(), checkAdminRole(client), controller.update);
  router.post("/verificar",             authRequired(),                        controller.verificar);

  return router;
};
