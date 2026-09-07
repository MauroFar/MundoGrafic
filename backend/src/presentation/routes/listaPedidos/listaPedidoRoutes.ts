import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import { checkPermission } from "../../../middleware/checkPermission";
import { PgListaPedidoRepository } from "../../../infrastructure/persistence/repositories/listaPedidos/PgListaPedidoRepository";
import { ListPedidosUseCase } from "../../../application/use-cases/listaPedidos/ListPedidosUseCase";
import { CreatePedidoUseCase } from "../../../application/use-cases/listaPedidos/CreatePedidoUseCase";
import { UpdatePedidoUseCase } from "../../../application/use-cases/listaPedidos/UpdatePedidoUseCase";
import { DeletePedidoUseCase } from "../../../application/use-cases/listaPedidos/DeletePedidoUseCase";
import { GetPedidoByIdUseCase } from "../../../application/use-cases/listaPedidos/GetPedidoByIdUseCase";
import { ListaPedidoController } from "../../controllers/listaPedidos/ListaPedidoController";

export const createListaPedidoRoutes = (client: Client) => {
  const router = Router();

  const repo          = new PgListaPedidoRepository(client);
  const listUseCase   = new ListPedidosUseCase(repo);
  const createUseCase = new CreatePedidoUseCase(repo);
  const updateUseCase = new UpdatePedidoUseCase(repo);
  const deleteUseCase = new DeletePedidoUseCase(repo);
  const getByIdUseCase = new GetPedidoByIdUseCase(repo);
  const controller    = new ListaPedidoController(listUseCase, createUseCase, updateUseCase, deleteUseCase, getByIdUseCase);

  router.get("/",       authRequired(), checkPermission(client, "lista_pedidos", "leer"),     controller.listar);
  router.get("/:id",    authRequired(), checkPermission(client, "lista_pedidos", "leer"),     controller.obtenerPorId);
  router.post("/",      authRequired(), checkPermission(client, "lista_pedidos", "crear"),    controller.crear);
  router.put("/:id",    authRequired(), checkPermission(client, "lista_pedidos", "editar"),   controller.editar);
  router.delete("/:id", authRequired(), checkPermission(client, "lista_pedidos", "eliminar"), controller.eliminar);

  return router;
};
