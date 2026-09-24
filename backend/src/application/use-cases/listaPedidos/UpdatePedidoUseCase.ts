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

function normalizarOrdenTrabajoId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const texto = String(value).trim();
  if (!texto || texto.toLowerCase() === "null") return null;

  const numero = Number(texto);
  if (!Number.isInteger(numero) || numero <= 0) return null;

  // Los timestamps de expiración / valores temporales no son IDs reales de OT.
  if (numero > 1_000_000_000) return null;

  return numero;
}

function normalizarCantidad(value: unknown): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return NaN;

  const sinCeros = String(numericValue).replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
  return Number(sinCeros);
}

export class UpdatePedidoUseCase {
  constructor(private readonly repo: ListaPedidoRepository) {}

  async execute(id: number, body: any, userId: number | null) {
    const errors: string[] = [];
    const pedidoActual = await this.repo.findById(id);
    if (!pedidoActual) throw new AppError("Pedido no encontrado.", 404);

    const tipoRaw         = sanitize(body?.tipo, 20).toLowerCase();
    const fechaIngreso       = sanitize(body?.fecha_ingreso_pedido, 10);
    const fechaAprobacionRaw = sanitize(body?.fecha_aprobacion, 10);
    const fechaEntregaRaw   = sanitize(body?.fecha_entrega, 10);
    const responsable     = sanitize(body?.responsable_nombre, 180);
    const cliente         = sanitize(body?.cliente, 180);
    const clienteIdRaw    = body?.cliente_id;
    const clienteId       = clienteIdRaw === undefined || clienteIdRaw === null || clienteIdRaw === "" ? null : Number(clienteIdRaw);
    const descripcion     = sanitize(body?.descripcion_producto, 2000);
    const rawOrdenTrabajoId: unknown = body?.orden_trabajo_id;
    const pedidoActualOtId = pedidoActual.orden_trabajo_id != null ? Number(pedidoActual.orden_trabajo_id) : null;
    const ordenTrabajoId = normalizarOrdenTrabajoId(rawOrdenTrabajoId) ?? pedidoActualOtId;
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
    if (fechaAprobacionRaw && !/^\d{4}-\d{2}-\d{2}$/.test(fechaAprobacionRaw))
      errors.push("fecha_aprobacion debe tener formato YYYY-MM-DD.");
    if (fechaEntregaRaw && !/^\d{4}-\d{2}-\d{2}$/.test(fechaEntregaRaw))
      errors.push("fecha_entrega debe tener formato YYYY-MM-DD.");
    if (!responsable) errors.push("responsable_nombre es obligatorio.");
    if (!cliente)     errors.push("cliente es obligatorio.");
    if (clienteIdRaw !== undefined && clienteIdRaw !== null && clienteIdRaw !== "" && (!Number.isInteger(clienteId) || clienteId! <= 0)) {
      errors.push("cliente_id inválido.");
    }
    if (rawOrdenTrabajoId !== undefined && rawOrdenTrabajoId !== null && String(rawOrdenTrabajoId).trim() !== "" && String(rawOrdenTrabajoId).trim().toLowerCase() !== "null") {
      const numeroRaw = Number(rawOrdenTrabajoId);
      if (!Number.isInteger(numeroRaw) || numeroRaw <= 0 || numeroRaw > 1_000_000_000) {
        // Ignore temporal/timestamp values and preserve the current OT already linked to the pedido.
      }
    }
    if (!descripcion) errors.push("descripcion_producto es obligatorio.");

    const cantidadNum = normalizarCantidad(body?.cantidad);
    if (!Number.isFinite(cantidadNum) || cantidadNum < 0)
      errors.push("cantidad debe ser un número mayor o igual a 0.");

    const estadoMap = new Map(ESTADOS_PERMITIDOS.map(e => [normalizeCatalog(e), e]));
    const faseMap   = new Map(FASES_PERMITIDAS.map(f => [normalizeCatalog(f), f]));

    const estado = estadoRaw ? estadoMap.get(normalizeCatalog(estadoRaw)) : "Sin empezar";
    if (!estado) errors.push("estado inválido.");

    const fase = faseRaw ? faseMap.get(normalizeCatalog(faseRaw)) ?? null : null;
    if (faseRaw && !fase) errors.push("fase inválida.");

    if (errors.length) throw new AppError(errors.join(" | "), 400);

    if (ordenTrabajoId !== null) {
      const pedidoYaVinculado = await this.repo.findByOrdenTrabajoId(ordenTrabajoId);
      const pedidoYaVinculadoId = pedidoYaVinculado ? Number(pedidoYaVinculado.id) : null;
      if (pedidoYaVinculado && pedidoYaVinculadoId !== id) {
        throw new AppError("La orden de trabajo ya está vinculada a otro pedido.", 409);
      }
      if (pedidoActualOtId !== null && pedidoActualOtId !== ordenTrabajoId) {
        throw new AppError("Este pedido ya tiene una orden de trabajo vinculada.", 409);
      }
    }

    if (pedidoActualOtId !== null && ordenTrabajoId === null) {
      const ordenTrabajoIdPreservado = pedidoActualOtId;
      const pedidoYaVinculado = await this.repo.findByOrdenTrabajoId(ordenTrabajoIdPreservado);
      const pedidoYaVinculadoId = pedidoYaVinculado ? Number(pedidoYaVinculado.id) : null;
      if (pedidoYaVinculado && pedidoYaVinculadoId !== id) {
        throw new AppError("La orden de trabajo ya está vinculada a otro pedido.", 409);
      }
    }

    const result = await this.repo.update({
      id,
      tipo: tipo!,
      fecha_ingreso_pedido: fechaIngreso,
      fecha_aprobacion: fechaAprobacionRaw || null,
      fecha_entrega: fechaEntregaRaw || null,
      responsable_nombre: responsable,
      cliente,
      cliente_id: clienteId,
      orden_trabajo_id: ordenTrabajoId,
      descripcion_producto: descripcion,
      cantidad: cantidadNum,
      no_oc: noOc || null,
      no_op: noOp || null,
      estado: estado!,
      fase: fase ?? null,
      no_factura: noFactura || null,
      observaciones: observaciones || null,
      updated_by: userId,
    });
    if (!result) throw new AppError("Pedido no encontrado.", 404);
    return result;
  }
}
