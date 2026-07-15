import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";

export class ListCertificadosUseCase {
  constructor(private readonly repo: CertificadoRepository) {}
  async execute() { return this.repo.findAll(); }
}
