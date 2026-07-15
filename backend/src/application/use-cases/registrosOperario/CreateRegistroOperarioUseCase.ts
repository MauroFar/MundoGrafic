import { AppError } from "../../../shared/errors/AppError";
import { RegistroOperarioRepository } from "../../../domain/repositories/registrosOperario/RegistroOperarioRepository";
import {
  MAQUINAS_PERMITIDAS,
  ACTIVIDADES_PERMITIDAS,
  TARIFAS_POR_MILLAR,
  calcMillares,
} from "../../../domain/entities/registrosOperario/RegistroOperario";

function sanitize(v: unknown, max: number) {
  return String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export class CreateRegistroOperarioUseCase {
  constructor(private readonly repo: RegistroOperarioRepository) {}

  async execute(body: any) {
    const cleaned = {
      fecha:          sanitize(body?.fecha, 10),
      operario:       sanitize(body?.operario, 150),
      codigoOperario: sanitize(body?.codigoOperario, 50),
      cliente:        sanitize(body?.cliente, 180),
      ordenCompra:    sanitize(body?.ordenCompra, 80),
      lote:           sanitize(body?.lote, 80),
      producto:       sanitize(body?.producto, 500),
      maquina:        sanitize(body?.maquina, 80),
      actividad:      sanitize(body?.actividad, 120),
      pausasTexto:    sanitize(body?.pausasTexto, 2000),
      observaciones:  sanitize(body?.observaciones, 2000),
    };

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned.fecha))
      throw new AppError("Fecha inválida. Usa formato YYYY-MM-DD.", 400);

    const required: [string, string][] = [
      [cleaned.operario,       "operario"],
      [cleaned.codigoOperario, "codigoOperario"],
      [cleaned.cliente,        "cliente"],
      [cleaned.ordenCompra,    "ordenCompra"],
      [cleaned.lote,           "lote"],
      [cleaned.producto,       "producto"],
      [cleaned.maquina,        "maquina"],
      [cleaned.actividad,      "actividad"],
    ];
    for (const [val, name] of required)
      if (!val) throw new AppError(`El campo ${name} es obligatorio.`, 400);

    const cantidadInt       = Number.parseInt(String(body?.cantidad), 10);
    const tiempoEfectivoInt = Number.parseInt(String(body?.tiempoEfectivoMin), 10);
    const tiempoParadoInt   = Number.parseInt(String(body?.tiempoParadoMin ?? 0), 10);

    if (!Number.isInteger(cantidadInt) || cantidadInt < 100)
      throw new AppError("cantidad debe ser un entero mayor o igual a 100.", 400);
    if (!Number.isInteger(tiempoEfectivoInt) || tiempoEfectivoInt < 0)
      throw new AppError("tiempoEfectivoMin debe ser un entero mayor o igual a 0.", 400);
    if (!Number.isInteger(tiempoParadoInt) || tiempoParadoInt < 0)
      throw new AppError("tiempoParadoMin debe ser un entero mayor o igual a 0.", 400);
    if (!(MAQUINAS_PERMITIDAS as readonly string[]).includes(cleaned.maquina))
      throw new AppError("Máquina inválida.", 400);
    if (!(ACTIVIDADES_PERMITIDAS as readonly string[]).includes(cleaned.actividad))
      throw new AppError("Actividad inválida.", 400);

    const millares         = calcMillares(cantidadInt);
    const ingresoEstimado  = Number((millares * (TARIFAS_POR_MILLAR[cleaned.actividad] ?? 0)).toFixed(2));

    return this.repo.create({
      fecha:              cleaned.fecha,
      operario:           cleaned.operario,
      codigo_operario:    cleaned.codigoOperario,
      cliente:            cleaned.cliente,
      orden_compra:       cleaned.ordenCompra,
      lote:               cleaned.lote,
      producto:           cleaned.producto,
      cantidad:           cantidadInt,
      millares,
      maquina:            cleaned.maquina,
      actividad:          cleaned.actividad,
      tiempo_efectivo_min: tiempoEfectivoInt,
      tiempo_parado_min:  tiempoParadoInt,
      pausas_texto:       cleaned.pausasTexto || null,
      observaciones:      cleaned.observaciones || null,
      ingreso_estimado:   ingresoEstimado,
    });
  }
}
