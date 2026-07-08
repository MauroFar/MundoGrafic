import { Router } from "express";
import { PedidoController } from "../../controllers/pedidos/PedidoController";

export const createPedidoRoutes = (pedidoController: PedidoController) => {
  const router = Router();

  router.get("/", (req, res) => pedidoController.listar(req, res));

  return router;
};
