import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import checkPermission from "../../../middleware/checkPermission";
import { PgClienteRepository } from "../../../infrastructure/persistence/repositories/clientes/PgClienteRepository";
import { ListClientesUseCase } from "../../../application/use-cases/clientes/ListClientesUseCase";
import { SearchClientesUseCase } from "../../../application/use-cases/clientes/SearchClientesUseCase";
import { GetClienteByIdUseCase } from "../../../application/use-cases/clientes/GetClienteByIdUseCase";
import { CreateClienteUseCase } from "../../../application/use-cases/clientes/CreateClienteUseCase";
import { UpdateClienteUseCase } from "../../../application/use-cases/clientes/UpdateClienteUseCase";
import { DeleteClienteUseCase } from "../../../application/use-cases/clientes/DeleteClienteUseCase";
import { ClienteController } from "../../controllers/clientes/ClienteController";

export const createClienteRoutes = (client: Client) => {
  const router = Router();

  const clienteRepository = new PgClienteRepository(client);
  const listClientesUseCase = new ListClientesUseCase(clienteRepository);
  const searchClientesUseCase = new SearchClientesUseCase(clienteRepository);
  const getClienteByIdUseCase = new GetClienteByIdUseCase(clienteRepository);
  const createClienteUseCase = new CreateClienteUseCase(clienteRepository);
  const updateClienteUseCase = new UpdateClienteUseCase(clienteRepository);
  const deleteClienteUseCase = new DeleteClienteUseCase(clienteRepository);

  const clienteController = new ClienteController(
    listClientesUseCase,
    searchClientesUseCase,
    getClienteByIdUseCase,
    createClienteUseCase,
    updateClienteUseCase,
    deleteClienteUseCase,
  );

  router.get("/test", clienteController.test);
  router.get("/", authRequired(), checkPermission(client, "clientes", "leer"), clienteController.listar);
  router.get("/buscar", authRequired(), checkPermission(client, "clientes", "leer"), clienteController.buscar);
  router.get("/:id", authRequired(), checkPermission(client, "clientes", "leer"), clienteController.obtenerPorId);
  router.post("/", authRequired(), checkPermission(client, "clientes", "crear"), clienteController.crear);
  router.put("/:id", authRequired(), checkPermission(client, "clientes", "editar"), clienteController.editar);
  router.delete("/:id", authRequired(), checkPermission(client, "clientes", "eliminar"), clienteController.eliminar);

  return router;
};
