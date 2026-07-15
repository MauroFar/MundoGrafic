import { AppError } from "../../../shared/errors/AppError";
import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";
import { CertificadoPdfService } from "../../../infrastructure/services/CertificadoPdfService";

export class GenerateCertificadoPdfUseCase {
  constructor(
    private readonly repo: CertificadoRepository,
    private readonly pdfService: CertificadoPdfService,
  ) {}

  async execute(id: number): Promise<{ buffer: Buffer; numero: string }> {
    const certificado = await this.repo.findById(id);
    if (!certificado) throw new AppError("Certificado no encontrado", 404);

    const logoBase64 = await this.pdfService.loadLogo();
    const html       = this.pdfService.generateHtml(certificado, certificado.caracteristicas ?? [], logoBase64);
    const buffer     = await this.pdfService.generatePdf(html);

    return { buffer, numero: certificado.numero_certificado ?? String(id) };
  }
}
