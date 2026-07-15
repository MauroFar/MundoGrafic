import { CertificadoRepository } from "../../../domain/repositories/certificados/CertificadoRepository";
import { CertificadoCreateInput } from "../../../domain/entities/certificados/Certificado";

export class CreateCertificadoUseCase {
  constructor(private readonly repo: CertificadoRepository) {}

  async execute(body: any, userId: number | null) {
    const input: CertificadoCreateInput = {
      numero_certificado:  body.numero_certificado  ?? null,
      fecha_creacion:      body.fecha_creacion       ?? null,
      fecha_elaboracion:   body.fecha_elaboracion    ?? null,
      fecha_caducidad:     body.fecha_caducidad      ?? null,
      cliente_nombre:      body.cliente_nombre       ?? null,
      referencia:          body.referencia ?? body.producto_cod_mg ?? null,
      material:            body.material             ?? null,
      descripcion:         body.descripcion ?? body.producto_descripcion ?? null,
      cantidad:            body.cantidad             ?? null,
      codigo:              body.codigo ?? body.codigo_producto ?? null,
      lote:                body.lote                 ?? null,
      cantidad_despachada: body.cantidad_despachada  ?? null,
      lote_despacho:       body.lote_despacho        ?? null,
      tamano_cm:           body.tamano_cm            ?? null,
      orden_compra:        body.orden_compra         ?? null,
      inspeccionado_por:   body.inspeccionado_por    ?? null,
      observaciones:       body.observaciones        ?? null,
      aprobado_area:       body.aprobado_area        ?? null,
      recepcion_area:      body.recepcion_area       ?? null,
      espesor_mm:          body.espesor_mm           ?? null,
      created_by:          userId,
      caracteristicas:     Array.isArray(body.caracteristicas) ? body.caracteristicas : [],
    };
    return this.repo.create(input);
  }
}
