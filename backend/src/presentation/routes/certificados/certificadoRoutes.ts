import { Router } from "express";
import { Client } from "pg";
import authRequired    from "../../../middleware/auth";
import checkPermission from "../../../middleware/checkPermission";

import { PgCertificadoRepository }           from "../../../infrastructure/persistence/repositories/certificados/PgCertificadoRepository";
import { CertificadoPdfService }             from "../../../infrastructure/services/CertificadoPdfService";

import { ListCertificadosUseCase }           from "../../../application/use-cases/certificados/ListCertificadosUseCase";
import { GetCertificadoByIdUseCase }         from "../../../application/use-cases/certificados/GetCertificadoByIdUseCase";
import { GetNextCertificadoNumberUseCase }   from "../../../application/use-cases/certificados/GetNextCertificadoNumberUseCase";
import { GetCaracteristicasCatalogoUseCase } from "../../../application/use-cases/certificados/GetCaracteristicasCatalogoUseCase";
import { CreateCertificadoUseCase }          from "../../../application/use-cases/certificados/CreateCertificadoUseCase";
import { UpdateCertificadoUseCase }          from "../../../application/use-cases/certificados/UpdateCertificadoUseCase";
import { DeleteCertificadoUseCase }          from "../../../application/use-cases/certificados/DeleteCertificadoUseCase";
import { GenerateCertificadoPdfUseCase }     from "../../../application/use-cases/certificados/GenerateCertificadoPdfUseCase";
import { PreviewCertificadoPdfUseCase }      from "../../../application/use-cases/certificados/PreviewCertificadoPdfUseCase";

import { CertificadoController }             from "../../controllers/certificados/CertificadoController";

export const createCertificadoRoutes = (client: Client) => {
  const router = Router();

  // ── Instanciar dependencias ─────────────────────────────────────────────────
  const repo       = new PgCertificadoRepository(client);
  const pdfService = new CertificadoPdfService();

  const ctrl = new CertificadoController(
    new ListCertificadosUseCase(repo),
    new GetCertificadoByIdUseCase(repo),
    new GetNextCertificadoNumberUseCase(repo),
    new GetCaracteristicasCatalogoUseCase(repo),
    new CreateCertificadoUseCase(repo),
    new UpdateCertificadoUseCase(repo),
    new DeleteCertificadoUseCase(repo),
    new GenerateCertificadoPdfUseCase(repo, pdfService),
    new PreviewCertificadoPdfUseCase(repo, pdfService),
  );

  const canRead   = [authRequired(), checkPermission(client, "certificados", "leer")];
  const canCreate = [authRequired(), checkPermission(client, "certificados", "crear")];
  const canEdit   = [authRequired(), checkPermission(client, "certificados", "editar")];
  const canDelete = [authRequired(), checkPermission(client, "certificados", "eliminar")];

  // ── Rutas específicas ANTES de /:id ─────────────────────────────────────────
  router.get("/next-number",      ...canRead,   ctrl.nextNumber);
  router.get("/caracteristicas",  ...canRead,   ctrl.catalogo);

  // ── CRUD + PDF ───────────────────────────────────────────────────────────────
  router.get("/",          ...canRead,   ctrl.listar);
  router.get("/:id/pdf",   ...canRead,   ctrl.pdf);
  router.get("/:id/preview", ...canRead, ctrl.preview);
  router.get("/:id",       ...canRead,   ctrl.obtenerPorId);
  router.post("/",         ...canCreate, ctrl.crear);
  router.put("/:id",       ...canEdit,   ctrl.editar);
  router.delete("/:id",    ...canDelete, ctrl.eliminar);

  return router;
};
