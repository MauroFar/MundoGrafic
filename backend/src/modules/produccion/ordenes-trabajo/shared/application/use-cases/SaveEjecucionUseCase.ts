import { PgEjecucionEtapaRepository, SaveEjecucionInput } from '../../infrastructure/persistence/PgEjecucionEtapaRepository';

export class SaveEjecucionUseCase {
  constructor(private readonly repo: PgEjecucionEtapaRepository) {}

  async execute(input: SaveEjecucionInput): Promise<any> {
    if (!input.etapa_id || !input.operario) throw new Error('etapa_id y operario son obligatorios');
    return this.repo.save(input);
  }
}
