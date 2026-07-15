import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";

export class GetNextCertificadoNumberUseCase {
  constructor(private readonly repo: CertificadoRepository) {}
  async execute() { return this.repo.getNextNumber(); }
}
