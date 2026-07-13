import { IOrdenLegacyRepository } from '../../domain/repositories/IOrdenLegacyRepository';
import { PgOrdenDigitalRepository } from '../../../digital/infrastructure/persistence/PgOrdenDigitalRepository';
import { PgOrdenOffsetRepository } from '../../../offset/infrastructure/persistence/PgOrdenOffsetRepository';

export interface GetOrdenByIdDeps {
  ordenRepo: IOrdenLegacyRepository;
  detalleDigitalRepo: PgOrdenDigitalRepository;
  detalleOffsetRepo: PgOrdenOffsetRepository;
  /**
   * Ejecuta queries de trazabilidad que no tienen repo propio todavía.
   * Recibe el id de la orden y devuelve los tres resultados raw.
   */
  getTrazabilidadRaw: (id: number) => Promise<{
    envioRow: any | null;
    artesRow: any | null;
    inicioRow: any | null;
  }>;
}

export class GetOrdenByIdUseCase {
  constructor(private readonly deps: GetOrdenByIdDeps) {}

  async execute(id: number): Promise<any | null> {
    const orden = await this.deps.ordenRepo.findByIdFull(id);
    if (!orden) return null;

    // Detalle específico según tipo
    orden.detalle = {};
    if (orden.tipo_orden === 'digital') {
      const detalle = await this.deps.detalleDigitalRepo.findDetalleByOrdenId(id);
      if (detalle) orden.detalle = detalle;
      orden.detalle.productos_digital = await this.deps.detalleDigitalRepo.listProductosByOrden(id);
    } else {
      const detalle = await this.deps.detalleOffsetRepo.findDetalleByOrdenId(id);
      if (detalle) orden.detalle = detalle;
      orden.detalle.productos_offset = await this.deps.detalleOffsetRepo.listProductosByOrden(id);
    }

    // Normalizar campos duplicados de contacto
    orden.telefono  = orden.telefono  || orden.telefono_cliente  || null;
    orden.email     = orden.email     || orden.email_cliente     || null;
    orden.direccion = orden.direccion || orden.direccion_cliente || null;
    delete orden.telefono_cliente;
    delete orden.email_cliente;
    delete orden.direccion_cliente;

    // Trazabilidad general
    const { envioRow, artesRow, inicioRow } = await this.deps.getTrazabilidadRaw(id);

    const trazabilidadGeneral: any[] = [
      {
        evento: orden.artes_aprobados
          ? 'Orden creada (con artes aprobados)'
          : 'Orden creada (sin artes aprobados)',
        fecha_hora: orden.created_at,
        usuario: orden.created_by_nombre || 'Sistema',
      },
    ];

    if (artesRow) {
      trazabilidadGeneral.push({
        evento: 'Artes aprobados',
        fecha_hora: artesRow.created_at,
        usuario: artesRow.usuario,
      });
    } else if (orden.artes_aprobados && orden.updated_at) {
      trazabilidadGeneral.push({
        evento: 'Artes aprobados (registro inferido)',
        fecha_hora: orden.updated_at,
        usuario: orden.updated_by_nombre || 'Sistema',
      });
    }

    if (envioRow) {
      trazabilidadGeneral.push({
        evento: 'Orden enviada a producción',
        fecha_hora: envioRow.created_at,
        usuario: envioRow.usuario,
      });
    }

    if (inicioRow) {
      trazabilidadGeneral.push({
        evento: `Inicio de proceso en producción${inicioRow.etapa_titulo ? ` (${inicioRow.etapa_titulo})` : ''}`,
        fecha_hora: inicioRow.created_at,
        usuario: inicioRow.created_by || 'Sistema',
        fecha_inicio: inicioRow.fecha_inicio,
        hora_inicio: inicioRow.hora_inicio,
      });
    }

    orden.trazabilidad_general = trazabilidadGeneral.sort(
      (a: any, b: any) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
    );

    return orden;
  }
}
