import { IOrdenLegacyRepository } from '../../domain/repositories/IOrdenLegacyRepository';
import { PgEstadoOrdenDigitalRepository } from '../../../digital/infrastructure/persistence/PgEstadoOrdenDigitalRepository';
import { PgEstadoOrdenOffsetRepository } from '../../../offset/infrastructure/persistence/PgEstadoOrdenOffsetRepository';

export interface EnviarProduccionDeps {
  ordenRepo: IOrdenLegacyRepository;
  estadoDigitalRepo: PgEstadoOrdenDigitalRepository;
  estadoOffsetRepo: PgEstadoOrdenOffsetRepository;
  /**
   * Garantiza que existe el estado 'pendiente' en estado_orden_digital y lo activa.
   * Devuelve su id.
   */
  ensurePendienteDigital: () => Promise<number>;
  /** Registra una línea en el historial de estado (digital u offset) */
  registrarHistorial: (
    tabla: 'digital' | 'offset',
    ordenId: number,
    estadoId: number,
    userId: number | null,
    nota: string,
  ) => Promise<void>;
  /** Leer tipo_orden, artes_aprobados y claves de estado actuales */
  getTipoYEstado: (id: number) => Promise<{
    tipo_orden: string;
    artes_aprobados: boolean;
    estado_digital_key: string | null;
    estado_offset_key: string | null;
  } | null>;
}

export class EnviarProduccionUseCase {
  constructor(private readonly deps: EnviarProduccionDeps) {}

  async execute(
    id: number,
    observacion: string | null,
    userId: number | null,
  ): Promise<any> {
    const row = await this.deps.getTipoYEstado(id);
    if (!row) throw new Error('Orden no encontrada');

    const { tipo_orden, artes_aprobados, estado_digital_key, estado_offset_key } = row;
    const tipoOrden = (tipo_orden || 'offset').toLowerCase();
    const estadoActual =
      tipoOrden === 'digital' ? estado_digital_key : estado_offset_key;

    if (!artes_aprobados)
      throw new Error(
        'No se puede enviar a producción: los artes deben estar aprobados.',
      );
    if (String(estadoActual || '').toLowerCase() === 'cancelado')
      throw new Error('La orden está cancelada y no puede enviarse a producción.');

    let estadoId: number;
    if (tipoOrden === 'digital') {
      estadoId = await this.deps.ensurePendienteDigital();
    } else {
      const r = await this.deps.estadoOffsetRepo.getPendingStateId();
      if (!r) throw new Error('Estado pendiente offset no encontrado.');
      estadoId = r;
    }

    const ordenActualizada = await this.deps.ordenRepo.enviarAProduccion(
      id,
      estadoId,
      tipoOrden,
      observacion,
      userId,
    );
    if (!ordenActualizada) throw new Error('Orden no encontrada al actualizar.');

    const nota = observacion
      ? `Enviada a producción. Observación: ${observacion}`
      : 'Enviada a producción';
    await this.deps
      .registrarHistorial(tipoOrden as 'digital' | 'offset', id, estadoId, userId, nota)
      .catch(() => {});

    return {
      success: true,
      orden: ordenActualizada,
      message: `Orden #${ordenActualizada.numero_orden} enviada a producción correctamente`,
    };
  }
}
