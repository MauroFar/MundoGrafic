import { PgEstadoOrdenDigitalRepository } from '../../../digital/infrastructure/persistence/PgEstadoOrdenDigitalRepository';
import { PgEstadoOrdenOffsetRepository } from '../../../offset/infrastructure/persistence/PgEstadoOrdenOffsetRepository';

export interface CambiarEstadoDeps {
  estadoDigitalRepo: PgEstadoOrdenDigitalRepository;
  estadoOffsetRepo: PgEstadoOrdenOffsetRepository;
  /** Devuelve tipo_orden de la orden; null si no existe */
  getTipoOrden: (id: number) => Promise<string | null>;
  /** Actualiza estado_orden_digital_id o estado_orden_offset_id en orden_trabajo */
  updateEstadoOrden: (
    id: number,
    estadoId: number,
    isDigital: boolean,
  ) => Promise<any>;
  /** Actualiza responsables en detalle_orden_trabajo_offset */
  updateResponsablesOffset: (
    id: number,
    campos: { preprensa?: string; prensa?: string; terminados?: string },
  ) => Promise<void>;
  /** Registra historial */
  registrarHistorial: (
    tabla: 'digital' | 'offset',
    ordenId: number,
    estadoId: number,
    userId: number | null,
    nota: string | null,
  ) => Promise<void>;
}

export class CambiarEstadoProduccionUseCase {
  constructor(private readonly deps: CambiarEstadoDeps) {}

  async execute(id: number, body: any, userId: number | null): Promise<any> {
    const { estado, preprensa, prensa, terminados, nota } = body;
    const notaNorm = typeof nota === 'string' ? nota.trim() : '';

    const tipoRaw = await this.deps.getTipoOrden(id);
    if (tipoRaw === null) throw new Error('Orden no encontrada');

    const isDigital = tipoRaw.toLowerCase() === 'digital';
    const stateRepo = isDigital ? this.deps.estadoDigitalRepo : this.deps.estadoOffsetRepo;

    let estadoId: number | null = null;
    if (estado !== undefined) {
      if (typeof estado === 'number' || /^\d+$/.test(String(estado))) {
        const s = await stateRepo.getStateById(Number(estado));
        estadoId = s?.id ?? null;
      } else if (typeof estado === 'string') {
        const normalize = (v: string) =>
          v
            .toString()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .trim()
            .replace(/[_\s]+/g, '');
        const target = normalize(estado);
        const rows = await stateRepo.getActiveStates();
        const matched = rows.find((r: any) => {
          const kn = normalize(r.key || '');
          const tn = normalize(r.titulo || '');
          return (
            kn === target ||
            tn === target ||
            kn.includes(target) ||
            tn.includes(target) ||
            target.includes(kn) ||
            target.includes(tn)
          );
        });
        estadoId = matched?.id ?? null;
      }
      if (!estadoId) {
        const allowed = (await stateRepo.getActiveStates()).map((r: any) => ({
          id: r.id,
          key: r.key,
          titulo: r.titulo,
        }));
        throw Object.assign(
          new Error(`Estado ${isDigital ? 'digital' : 'offset'} no reconocido`),
          { allowed, status: 400 },
        );
      }
    }

    const ordenActualizada = await this.deps.updateEstadoOrden(id, estadoId!, isDigital);
    if (!ordenActualizada) throw new Error('Orden no encontrada');

    // Actualizar responsables offset si vienen
    if (!isDigital && (preprensa !== undefined || prensa !== undefined || terminados !== undefined)) {
      await this.deps.updateResponsablesOffset(id, { preprensa, prensa, terminados });
    }

    // Historial
    if (estadoId !== null) {
      await this.deps
        .registrarHistorial(
          isDigital ? 'digital' : 'offset',
          id,
          estadoId,
          userId,
          notaNorm || null,
        )
        .catch(() => {});
    }

    return { success: true, orden: ordenActualizada };
  }
}
