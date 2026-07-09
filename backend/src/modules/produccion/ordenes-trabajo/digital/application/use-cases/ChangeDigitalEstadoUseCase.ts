import { PgEstadoOrdenDigitalRepository } from '../../infrastructure/persistence/PgEstadoOrdenDigitalRepository';

export class ChangeDigitalEstadoUseCase {
  constructor(private readonly repo: PgEstadoOrdenDigitalRepository) {}

  async execute(
    ordenTrabajoId: number,
    estado: string | number,
    usuarioId: number | null,
    nota?: string | null
  ): Promise<{ estadoId: number; historyCreated: boolean }> {
    let state = null;

    if (typeof estado === 'number' || /^[0-9]+$/.test(String(estado))) {
      state = await this.repo.getStateById(Number(estado));
    }

    if (!state && typeof estado === 'string') {
      state = await this.repo.findStateByKeyOrTitle(estado);
    }

    if (!state) {
      throw new Error('Estado digital no reconocido');
    }

    await this.repo.updateOrdenState(ordenTrabajoId, state.id);
    await this.repo.createHistory(ordenTrabajoId, state.id, usuarioId, nota || null);
    return { estadoId: state.id, historyCreated: true };
  }
}
