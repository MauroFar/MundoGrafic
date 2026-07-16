import { AppError } from "../../../shared/errors/AppError";
import { ListaPedidoRepository } from "../../../domain/repositories/listaPedidos/ListaPedidoRepository";
import {
  ESTADOS_PERMITIDOS,
  FASES_PERMITIDAS,
  TIPOS_PERMITIDOS,
  TipoPedido,
  normalizeCatalog,
} from "../../../domain/entities/listaPedidos/ListaPedido";

function sanitize(v: unknown, max: number) {
  return String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export class CreatePedidoUseCase {
  constructor(private readonly repo: ListaPedidoRepository) {}

  async execute(body: any, userId: number | null) {
    const errors: string[] = [];
    const tipoRaw         = sanitize(body?.tipo, 20).toLowerCase();
    const fechaIngreso    = sanitize(body?.fecha_ingreso_pedido, 10);
    const fechaEntregaRaw = sanitize(body?.fecha_entrega, 10);
    const responsable     = sanitize(body?.responsable_nombre, 180);
    const cliente         = sanitize(body?.cliente, 180);
    const descripcion     = sanitize(body?.descripcion_producto, 2000);
    const noOc            = sanitize(body?.no_oc, 100);
    const noOp            = sanitize(body?.no_op, 100);
    const noFactura       = sanitize(body?.no_factura, 100);
    const observaciones   = sanitize(body?.observaciones, 4000);
    const estadoRaw       = sanitize(body?.estado, 80);
    const faseRaw         = sanitize(body?.fase, 120);

    const tipo = TIPOS_PERMITIDOS.includes(tipoRaw as TipoPedido)
      ? (tipoRaw as TipoPedido)
      : null;
    if (!tipo) errors.push("tipo debe ser 'offset' o 'digital'.");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaIngreso))
      errors.push("fecha_ingreso_pedido debe tener formato YYYY-MM-DD.");
    if (fechaEntregaRaw && !/^\d{4}-\d{2}-\d{2}$/.test(fechaEntregaRaw))
      errors.push("fecha_entrega debe tener formato YYYY-MM-DD.");
    if (!responsable) errors.push("responsable_nombre es obligatorio.");
    if (!cliente)     errors.push("cliente es obligatorio.");
    if (!descripcion) errors.push("descripcion_producto es obligatorio.");

    const cantidadNum = Number(body?.cantidad);
    if (!Number.isFinite(cantidadNum) || cantidadNum < 0)
      errors.push("cantidad debe ser un número mayor o igual a 0.");

    const estadoMap = new Map(ESTADOS_PERMITIDOS.map(e => [normalizeCatalog(e), e]));
    const faseMap   = new Map(FASES_PERMITIDAS.map(f => [normalizeCatalog(f), f]));

    const estado = estadoRaw ? estadoMap.get(normalizeCatalog(estadoRaw)) : "Sin empezar";
    if (!estado) errors.push("estado inválido.");
    const fase = faseRaw ? faseMap.get(normalizeCatalog(faseRaw)) ?? null : null;
    if (faseRaw && !fase) errors.push("fase inválida.");

    if (errors.length) throw new AppError(errors.join(" | "), 400);

    return this.repo.create({
      tipo: tipo!,
      fecha_ingreso_pedido: fechaIngreso,
      fecha_entrega: fechaEntregaRaw || null,
      responsable_nombre: responsable,
      cliente,
      descripcion_producto: descripcion,
      cantidad: Number(cantidadNum.toFixed(2)),
      no_oc: noOc || null,
      no_op: noOp || null,
      estado: estado!,
      fase: fase ?? null,
      no_factura: noFactura || null,
      observaciones: observaciones || null,
      created_by: userId,
      updated_by: userId,
    });
  }
}
