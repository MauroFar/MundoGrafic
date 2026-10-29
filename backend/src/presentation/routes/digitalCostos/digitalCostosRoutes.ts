import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import checkAdminRole from "../../../middleware/checkAdminRole";
import { PgDigitalCostosRepository } from "../../../infrastructure/persistence/repositories/digitalCostos/PgDigitalCostosRepository";
import { DigitalCostosController } from "../../controllers/digitalCostos/DigitalCostosController";

export const createDigitalCostosRoutes = (client: Client) => {
  const router = Router();
  const repo = new PgDigitalCostosRepository(client);
  const controller = new DigitalCostosController(repo);

  router.use(authRequired());

  router.get("/materiales", controller.listarMateriales);
  router.post("/materiales", checkAdminRole(client), controller.crearMaterial);
  router.put("/materiales/:id", checkAdminRole(client), controller.actualizarMaterial);
  router.delete("/materiales/:id", checkAdminRole(client), controller.eliminarMaterial);

  router.get("/procesos", controller.listarProcesos);
  router.post("/procesos", checkAdminRole(client), controller.crearProceso);
  router.put("/procesos/:id", checkAdminRole(client), controller.actualizarProceso);
  router.delete("/procesos/:id", checkAdminRole(client), controller.eliminarProceso);

  router.get("/costos-operativos", controller.listarCostosOperativos);
  router.post("/costos-operativos", checkAdminRole(client), controller.crearCostoOperativo);
  router.put("/costos-operativos/:id", checkAdminRole(client), controller.actualizarCostoOperativo);
  router.delete("/costos-operativos/:id", checkAdminRole(client), controller.eliminarCostoOperativo);

  router.get("/configuracion-comercial", controller.obtenerConfiguracionComercial);
  router.post("/configuracion-comercial/margenes", checkAdminRole(client), controller.crearMargen);
  router.put("/configuracion-comercial/margenes/:id", checkAdminRole(client), controller.actualizarMargen);
  router.delete("/configuracion-comercial/margenes/:id", checkAdminRole(client), controller.eliminarMargen);
  router.post("/configuracion-comercial/plazos", checkAdminRole(client), controller.crearPlazo);
  router.put("/configuracion-comercial/plazos/:id", checkAdminRole(client), controller.actualizarPlazo);
  router.delete("/configuracion-comercial/plazos/:id", checkAdminRole(client), controller.eliminarPlazo);

  return router;
};
