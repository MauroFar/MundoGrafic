import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { ListCertificadosUseCase }          from "../../../application/use-cases/certificados/ListCertificadosUseCase";
import { GetCertificadoByIdUseCase }        from "../../../application/use-cases/certificados/GetCertificadoByIdUseCase";
import { GetNextCertificadoNumberUseCase }  from "../../../application/use-cases/certificados/GetNextCertificadoNumberUseCase";
import { GetCaracteristicasCatalogoUseCase } from "../../../application/use-cases/certificados/GetCaracteristicasCatalogoUseCase";
import { CreateCertificadoUseCase }         from "../../../application/use-cases/certificados/CreateCertificadoUseCase";
import { UpdateCertificadoUseCase }         from "../../../application/use-cases/certificados/UpdateCertificadoUseCase";
import { DeleteCertificadoUseCase }         from "../../../application/use-cases/certificados/DeleteCertificadoUseCase";
import { GenerateCertificadoPdfUseCase }    from "../../../application/use-cases/certificados/GenerateCertificadoPdfUseCase";
import { PreviewCertificadoPdfUseCase }     from "../../../application/use-cases/certificados/PreviewCertificadoPdfUseCase";

export class CertificadoController {
  constructor(
    private readonly listUseCase:         ListCertificadosUseCase,
    private readonly getByIdUseCase:      GetCertificadoByIdUseCase,
    private readonly nextNumberUseCase:   GetNextCertificadoNumberUseCase,
    private readonly catalogoUseCase:     GetCaracteristicasCatalogoUseCase,
    private readonly createUseCase:       CreateCertificadoUseCase,
    private readonly updateUseCase:       UpdateCertificadoUseCase,
    private readonly deleteUseCase:       DeleteCertificadoUseCase,
    private readonly generatePdfUseCase:  GenerateCertificadoPdfUseCase,
    private readonly previewPdfUseCase:   PreviewCertificadoPdfUseCase,
  ) {}

  listar = async (_req: Request, res: Response) => {
    try {
      res.json(await this.listUseCase.execute());
    } catch (e) { this._handle(res, e); }
  };

  obtenerPorId = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      res.json(await this.getByIdUseCase.execute(id));
    } catch (e) { this._handle(res, e); }
  };

  nextNumber = async (_req: Request, res: Response) => {
    try {
      res.json(await this.nextNumberUseCase.execute());
    } catch (e) { this._handle(res, e); }
  };

  catalogo = async (_req: Request, res: Response) => {
    try {
      res.json(await this.catalogoUseCase.execute());
    } catch (e) { this._handle(res, e); }
  };

  crear = async (req: any, res: Response) => {
    try {
      const result = await this.createUseCase.execute(req.body, req.user?.id ?? null);
      res.status(201).json(result);
    } catch (e) { this._handle(res, e); }
  };

  editar = async (req: any, res: Response) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      await this.updateUseCase.execute(id, req.body, req.user?.id ?? null);
      res.json({ success: true });
    } catch (e) { this._handle(res, e); }
  };

  eliminar = async (req: Request, res: Response) => {
    try {
      await this.deleteUseCase.execute(Number.parseInt(req.params.id, 10));
      res.json({ success: true });
    } catch (e) { this._handle(res, e); }
  };

  pdf = async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(req.params.id, 10);
      const { buffer, numero } = await this.generatePdfUseCase.execute(id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="certificado_${numero}.pdf"`);
      res.send(buffer);
    } catch (e) { this._handle(res, e); }
  };

  preview = async (req: Request, res: Response) => {
    try {
      const id  = Number.parseInt(req.params.id, 10);
      const pdf = await this.previewPdfUseCase.execute(id);
      res.json({ success: true, pdf });
    } catch (e) { this._handle(res, e); }
  };

  private _handle(res: Response, e: unknown) {
    if (e instanceof AppError)
      return res.status(e.statusCode).json({ error: e.message });
    const msg = e instanceof Error ? e.message : "Error interno";
    console.error(e);
    res.status(500).json({ error: msg });
  }
}
