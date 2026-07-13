import { IOrdenLegacyRepository } from '../../domain/repositories/IOrdenLegacyRepository';

export interface CancelarProduccionDeps {
  ordenRepo: IOrdenLegacyRepository;
  /**
   * Garantiza que existe el estado 'cancelado' en el catálogo (digital u offset)
   * y lo activa. Devuelve su id.
   */
  ensureCancelado: (tipo: 'digital' | 'offset') => Promise<number>;
  /** Leer tipo_orden y claves de estado actuales */
  getTipoYEstado: (id: number) => Promise<{
    tipo_orden: string;
    estado_digital_key: string | null;
    estado_offset_key: string | null;
  } | null>;
  /** Actualizar orden_trabajo directamente (estado + motivo cancelacion) */
  cancelarEnDB: (
    id: number,
    estadoCanceladoId: number,
    tipoOrden: 'digital' | 'offset',
    motivo: string,
    userId: number | null,
  ) => Promise<any>;
  /** Registra una línea en el historial de estado */
  registrarHistorial: (
    tabla: 'digital' | 'offset',
    ordenId: number,
    estadoId: number,
    userId: number | null,
    nota: string,
  ) => Promise<void>;
}

export class CancelarProduccionUseCase {
  constructor(private readonly deps: CancelarProduccionDeps) {}

  async execute(id: number, motivo: string, userId: number | null): Promise<any> {
    if (!motivo.trim()) throw new Error('El motivo de cancelación es obligatorio');

    const row = await this.deps.getTipoYEstado(id);
    if (!row) throw new Error('Orden no encontrada');

    const fueEnviada = await this.deps.ordenRepo.fueEnviadaAProduccion(id);
    if (!fueEnviada)
      throw new Error('La orden todavía no ha sido enviada a producción.');

    const tipoOrden = (row.tipo_orden || 'offset').toLowerCase() as 'digital' | 'offset';
    const estadoActual = String(
      tipoOrden === 'digital' ? row.estado_digital_key : row.estado_offset_key,
    ).toLowerCase();

    if (estadoActual !== 'pendiente')
      throw new Error('Solo se puede cancelar cuando la orden está en pendiente.');

    const estadoCanceladoId = await this.deps.ensureCancelado(tipoOrden);

    const ordenActualizada = await this.deps.cancelarEnDB(
      id,
      estadoCanceladoId,
      tipoOrden,
      motivo.trim(),
      userId,
    );
    if (!ordenActualizada) throw new Error('Orden no encontrada al actualizar');

    await this.deps
      .registrarHistorial(
        tipoOrden,
        id,
        estadoCanceladoId,
        userId,
        `Producción cancelada. Motivo: ${motivo.trim()}`,
      )
      .catch(() => {});

    return {
      success: true,
      orden: ordenActualizada,
      message: 'Producción cancelada correctamente',
    };
  }
}
