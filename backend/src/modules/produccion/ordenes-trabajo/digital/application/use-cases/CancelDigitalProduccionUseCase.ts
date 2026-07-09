import { PgEstadoOrdenDigitalRepository } from '../../infrastructure/persistence/PgEstadoOrdenDigitalRepository';

export class CancelDigitalProduccionUseCase {
  constructor(private readonly repo: PgEstadoOrdenDigitalRepository) {}

  async execute(
    ordenTrabajoId: number,
    motivoCancelacion: string,
    usuarioId: number | null
  ): Promise<{ cancelado: boolean; estadoId: number }> {
    // Get the 'cancelado' state
    const canceladoState = await this.repo.getStateByKey('cancelado');
    
    if (!canceladoState) {
      throw new Error('Estado cancelado no encontrado en el catálogo');
    }

    // Update order state to cancelado
    await this.repo.updateOrdenState(ordenTrabajoId, canceladoState.id);
    
    // Create history entry with the cancellation reason
    await this.repo.createHistory(
      ordenTrabajoId,
      canceladoState.id,
      usuarioId,
      `Producción cancelada. Motivo: ${motivoCancelacion}`
    );

    return { cancelado: true, estadoId: canceladoState.id };
  }
}
