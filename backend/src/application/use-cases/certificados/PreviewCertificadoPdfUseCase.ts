import { AppError } from "../../../shared/errors/AppError";
import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";
import { CertificadoPdfService } from "../../../infrastructure/services/CertificadoPdfService";

export class PreviewCertificadoPdfUseCase {
  constructor(
    private readonly repo: CertificadoRepository,
    private readonly pdfService: CertificadoPdfService,
  ) {}

  async execute(id: number): Promise<string> {
    const certificado = await this.repo.findById(id);
    if (!certificado) throw new AppError("Certificado no encontrado", 404);

    const logoBase64 = await this.pdfService.loadLogo();
    const firmaBase64 = await this.pdfService.loadFirmaPorNombre(certificado.inspeccionado_por ?? null);
    const html = this.pdfService.generateHtml(certificado, certificado.caracteristicas ?? [], logoBase64, firmaBase64);
    const buffer = await this.pdfService.generatePdf(html);

    return `data:application/pdf;base64,${buffer.toString("base64")}`;
  }
}
