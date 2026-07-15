import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";

export class GetCaracteristicasCatalogoUseCase {
  constructor(private readonly repo: CertificadoRepository) {}
  async execute() { return this.repo.getCatalogoCar(); }
}
