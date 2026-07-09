import { Router } from "express";
import authRequired from "../../../../../middleware/auth";
import checkPermission from "../../../../../middleware/checkPermission";
import { PgCotizacionCodeRepository } from "../../infrastructure/persistence/PgCotizacionCodeRepository";
import { GetNextCotizacionCodeUseCase } from "../../application/use-cases/GetNextCotizacionCodeUseCase";
import { CotizacionCodeController } from "../controllers/CotizacionCodeController";
import { PgCotizacionQueryRepository } from "../../infrastructure/persistence/PgCotizacionQueryRepository";
import { ListCotizacionesUseCase } from "../../application/use-cases/ListCotizacionesUseCase";
import { GetCotizacionByIdUseCase } from "../../application/use-cases/GetCotizacionByIdUseCase";
import { CotizacionQueryController } from "../controllers/CotizacionQueryController";
import { PgCotizacionCommandRepository } from "../../infrastructure/persistence/PgCotizacionCommandRepository";
import { CreateCotizacionUseCase } from "../../application/use-cases/CreateCotizacionUseCase";
import { UpdateCotizacionUseCase } from "../../application/use-cases/UpdateCotizacionUseCase";
import { DeleteCotizacionUseCase } from "../../application/use-cases/DeleteCotizacionUseCase";
import { CotizacionCommandController } from "../controllers/CotizacionCommandController";
import { ApproveCotizacionUseCase } from "../../application/use-cases/ApproveCotizacionUseCase";
import { RejectCotizacionUseCase } from "../../application/use-cases/RejectCotizacionUseCase";
import { PgCotizacionDetalleRepository } from "../../infrastructure/persistence/PgCotizacionDetalleRepository";
import { GetCotizacionDetallesUseCase } from "../../application/use-cases/GetCotizacionDetallesUseCase";
import { CreateCotizacionDetalleUseCase } from "../../application/use-cases/CreateCotizacionDetalleUseCase";
import { ReplaceCotizacionDetallesUseCase } from "../../application/use-cases/ReplaceCotizacionDetallesUseCase";
import { CotizacionDetalleController } from "../controllers/CotizacionDetalleController";
import { CotizacionDocumentDataService } from "../../infrastructure/services/CotizacionDocumentDataService";
import { CotizacionEmailService } from "../../infrastructure/services/CotizacionEmailService";
import { GenerateCotizacionPdfUseCase } from "../../application/use-cases/GenerateCotizacionPdfUseCase";
import { SendCotizacionEmailUseCase } from "../../application/use-cases/SendCotizacionEmailUseCase";
import { PreviewCotizacionPdfUseCase } from "../../application/use-cases/PreviewCotizacionPdfUseCase";
import { CotizacionDocumentController } from "../controllers/CotizacionDocumentController";

export const createCotizacionesModuleRoutes = (client: any) => {
  const router = Router();

  const cotizacionCodeRepository = new PgCotizacionCodeRepository(client);
  const getNextCotizacionCodeUseCase = new GetNextCotizacionCodeUseCase(cotizacionCodeRepository);
  const cotizacionCodeController = new CotizacionCodeController(getNextCotizacionCodeUseCase);

  const cotizacionQueryRepository = new PgCotizacionQueryRepository(client);
  const listCotizacionesUseCase = new ListCotizacionesUseCase(cotizacionQueryRepository);
  const getCotizacionByIdUseCase = new GetCotizacionByIdUseCase(cotizacionQueryRepository);
  const cotizacionQueryController = new CotizacionQueryController(
    listCotizacionesUseCase,
    getCotizacionByIdUseCase,
  );

  const cotizacionCommandRepository = new PgCotizacionCommandRepository(client);
  const createCotizacionUseCase = new CreateCotizacionUseCase(cotizacionCommandRepository);
  const updateCotizacionUseCase = new UpdateCotizacionUseCase(cotizacionCommandRepository);
  const deleteCotizacionUseCase = new DeleteCotizacionUseCase(cotizacionCommandRepository);
  const approveCotizacionUseCase = new ApproveCotizacionUseCase(cotizacionCommandRepository);
  const rejectCotizacionUseCase = new RejectCotizacionUseCase(cotizacionCommandRepository);
  const cotizacionCommandController = new CotizacionCommandController(
    createCotizacionUseCase,
    updateCotizacionUseCase,
    deleteCotizacionUseCase,
    approveCotizacionUseCase,
    rejectCotizacionUseCase,
  );

  const cotizacionDetalleRepository = new PgCotizacionDetalleRepository(client);
  const getCotizacionDetallesUseCase = new GetCotizacionDetallesUseCase(cotizacionDetalleRepository);
  const createCotizacionDetalleUseCase = new CreateCotizacionDetalleUseCase(cotizacionDetalleRepository);
  const replaceCotizacionDetallesUseCase = new ReplaceCotizacionDetallesUseCase(cotizacionDetalleRepository);
  const cotizacionDetalleController = new CotizacionDetalleController(
    getCotizacionDetallesUseCase,
    createCotizacionDetalleUseCase,
    replaceCotizacionDetallesUseCase,
  );

  const cotizacionDocumentDataService = new CotizacionDocumentDataService(client);
  const cotizacionEmailService = new CotizacionEmailService(client);
  const generateCotizacionPdfUseCase = new GenerateCotizacionPdfUseCase(cotizacionDocumentDataService);
  const sendCotizacionEmailUseCase = new SendCotizacionEmailUseCase(
    cotizacionDocumentDataService,
    cotizacionEmailService,
  );
  const previewCotizacionPdfUseCase = new PreviewCotizacionPdfUseCase();
  const cotizacionDocumentController = new CotizacionDocumentController(
    generateCotizacionPdfUseCase,
    sendCotizacionEmailUseCase,
    previewCotizacionPdfUseCase,
  );

  // First migrated endpoint inside the cotizaciones module.
  router.get("/cotizaciones/ultima", authRequired(), cotizacionCodeController.getNextCode);
  router.post(
    "/cotizaciones",
    authRequired(),
    checkPermission(client, "cotizaciones", "crear"),
    cotizacionCommandController.crear,
  );
  router.get(
    "/cotizaciones/todas",
    authRequired(),
    checkPermission(client, "cotizaciones", "leer"),
    cotizacionQueryController.listarTodas,
  );
  router.get(
    "/cotizaciones/:id",
    authRequired(),
    checkPermission(client, "cotizaciones", "leer"),
    cotizacionQueryController.obtenerPorId,
  );
  router.get(
    "/cotizacionesEditar/:id",
    authRequired(),
    checkPermission(client, "cotizaciones", "leer"),
    cotizacionQueryController.obtenerPorId,
  );
  router.put(
    "/cotizaciones/:id",
    authRequired(),
    checkPermission(client, "cotizaciones", "editar"),
    cotizacionCommandController.actualizar,
  );
  router.delete(
    "/cotizaciones/:id",
    authRequired(),
    checkPermission(client, "cotizaciones", "eliminar"),
    cotizacionCommandController.eliminar,
  );
  router.put("/cotizaciones/:id/aprobar", authRequired(), cotizacionCommandController.aprobar);
  router.put("/cotizaciones/:id/rechazar", authRequired(), cotizacionCommandController.rechazar);

  router.get("/cotizacionesDetalles/:id", cotizacionDetalleController.obtenerPorCotizacionId);
  router.post("/cotizacionesDetalles", cotizacionDetalleController.crear);
  router.put("/cotizacionesDetalles/:id", cotizacionDetalleController.reemplazarPorCotizacionId);

  router.get("/cotizaciones/:id/pdf", authRequired(), cotizacionDocumentController.generarPdf);
  router.post("/cotizaciones/:id/enviar-correo", authRequired(), cotizacionDocumentController.enviarCorreo);
  router.post("/cotizaciones/preview", authRequired(), cotizacionDocumentController.previewPdf);

  return router;
};
