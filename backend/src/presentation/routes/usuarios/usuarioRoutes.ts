import { Router } from "express";
import { Client } from "pg";
import authRequired from "../../../middleware/auth";
import checkModulePermission from "../../../middleware/checkModulePermission";
import checkPermission from "../../../middleware/checkPermission";
import { UsuarioController } from "../../controllers/usuarios/UsuarioController";
import { ListUsuariosUseCase } from "../../../application/use-cases/usuarios/ListUsuariosUseCase";
import { ListVendedoresUseCase } from "../../../application/use-cases/usuarios/ListVendedoresUseCase";
import { CreateUsuarioUseCase } from "../../../application/use-cases/usuarios/CreateUsuarioUseCase";
import { UpdateUsuarioUseCase } from "../../../application/use-cases/usuarios/UpdateUsuarioUseCase";
import { DeleteUsuarioUseCase } from "../../../application/use-cases/usuarios/DeleteUsuarioUseCase";
import { GetUsuarioFirmaUseCase } from "../../../application/use-cases/usuarios/GetUsuarioFirmaUseCase";
import { UpdateUsuarioFirmaUseCase } from "../../../application/use-cases/usuarios/UpdateUsuarioFirmaUseCase";
import { PgUsuarioRepository } from "../../../infrastructure/persistence/repositories/usuarios/PgUsuarioRepository";
import { BcryptPasswordHasher } from "../../../infrastructure/security/BcryptPasswordHasher";

export const createUsuarioRoutes = (client: Client) => {
  const router = Router();

  const usuarioRepository = new PgUsuarioRepository(client);
  const listUsuariosUseCase = new ListUsuariosUseCase(usuarioRepository);
  const listVendedoresUseCase = new ListVendedoresUseCase(usuarioRepository);
  const passwordHasher = new BcryptPasswordHasher();
  const createUsuarioUseCase = new CreateUsuarioUseCase(usuarioRepository, passwordHasher);
  const updateUsuarioUseCase = new UpdateUsuarioUseCase(usuarioRepository, passwordHasher);
  const deleteUsuarioUseCase = new DeleteUsuarioUseCase(usuarioRepository);
  const getUsuarioFirmaUseCase = new GetUsuarioFirmaUseCase(usuarioRepository);
  const updateUsuarioFirmaUseCase = new UpdateUsuarioFirmaUseCase(usuarioRepository);
  const usuarioController = new UsuarioController(
    listUsuariosUseCase,
    listVendedoresUseCase,
    createUsuarioUseCase,
    updateUsuarioUseCase,
    deleteUsuarioUseCase,
    getUsuarioFirmaUseCase,
    updateUsuarioFirmaUseCase,
  );

  router.get("/", authRequired(), checkModulePermission(client, "usuarios"), usuarioController.listar);
  router.get("/vendedores", authRequired(), usuarioController.listarVendedores);
  router.post("/", authRequired(), checkPermission(client, "usuarios", "crear"), usuarioController.crear);
  router.put("/:id", authRequired(), checkPermission(client, "usuarios", "editar"), usuarioController.editar);
  router.delete("/:id", authRequired(), checkPermission(client, "usuarios", "eliminar"), usuarioController.eliminar);
  router.put("/:id/firma", authRequired(), checkPermission(client, "usuarios", "editar"), usuarioController.actualizarFirma);
  router.get("/:id/firma", authRequired(), checkPermission(client, "usuarios", "leer"), usuarioController.obtenerFirma);

  return router;
};
