import { AppError } from "../../../shared/errors/AppError";
import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";

export class GetCertificadoByIdUseCase {
  constructor(private readonly repo: CertificadoRepository) {}
  async execute(id: number) {
    const cert = await this.repo.findById(id);
    if (!cert) throw new AppError("Certificado no encontrado", 404);
    return cert;
  }
}
