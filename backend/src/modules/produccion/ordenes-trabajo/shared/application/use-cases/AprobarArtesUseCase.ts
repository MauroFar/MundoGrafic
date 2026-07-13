import { IOrdenLegacyRepository } from '../../domain/repositories/IOrdenLegacyRepository';

export interface AprobarArtesHistorialFn {
  (
    ordenId: number,
    estadoId: number,
    userId: number | null,
    nota: string,
  ): Promise<void>;
}

export class AprobarArtesUseCase {
  constructor(
    private readonly ordenRepo: IOrdenLegacyRepository,
    private readonly registrarHistorial: AprobarArtesHistorialFn,
  ) {}

  async execute(id: number, fechaEntrega: string, userId: number | null): Promise<any> {
    if (!fechaEntrega || !/^\d{4}-\d{2}-\d{2}$/.test(String(fechaEntrega))) {
      throw new Error('Debes seleccionar una fecha de entrega válida (YYYY-MM-DD).');
    }

    const bloqueada = await this.ordenRepo.fueEnviadaAProduccion(id);
    if (bloqueada)
      throw new Error('La orden ya fue enviada a producción y no se puede modificar.');

    const ordenAprobada = await this.ordenRepo.aprobarArtes(id, fechaEntrega, userId);
    if (!ordenAprobada) throw new Error('Orden no encontrada');

    const esDigital =
      (ordenAprobada.tipo_orden || 'offset').toLowerCase() === 'digital';
    const estadoId = esDigital
      ? ordenAprobada.estado_orden_digital_id
      : ordenAprobada.estado_orden_offset_id;

    if (estadoId) {
      await this.registrarHistorial(id, estadoId, userId, 'Artes aprobados').catch(
        () => {},
      );
    }

    return {
      success: true,
      message: 'Artes aprobados correctamente',
      orden: {
        id: ordenAprobada.id,
        numero_orden: ordenAprobada.numero_orden,
        artes_aprobados: ordenAprobada.artes_aprobados,
        fecha_entrega: ordenAprobada.fecha_entrega,
      },
    };
  }
}
