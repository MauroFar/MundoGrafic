import { AppError } from "../../../shared/errors/AppError";
import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";

export class DeleteCertificadoUseCase {
  constructor(private readonly repo: CertificadoRepository) {}
  async execute(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("Certificado no encontrado", 404);
    await this.repo.delete(id);
  }
}
