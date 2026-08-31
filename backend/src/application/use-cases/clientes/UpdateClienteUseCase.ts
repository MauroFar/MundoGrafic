import { AppError } from "../../../shared/errors/AppError";
import { ClienteRepository } from "../../../domain/repositories/clientes/ClienteRepository";

export class UpdateClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(id: number, input: any, userId: number | null | undefined) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de cliente invalido", 400);
    }

    const hasRelations = await this.clienteRepository.hasRelatedDocuments(id);
    if (hasRelations) {
      throw new AppError("No se puede editar un cliente con cotizaciones u órdenes de trabajo asociadas", 409);
    }

    const nombre = String(input?.nombre || "").trim();
    if (!nombre) {
      throw new AppError("Nombre de contacto es obligatorio", 400);
    }

    const email = input?.email ? String(input.email).trim() : null;
    const ruc_cedula = input?.ruc_cedula ? String(input.ruc_cedula).trim() : null;

    return this.clienteRepository.update({
      id,
      nombre,
      empresa: input?.empresa ? String(input.empresa).trim() : null,
      direccion: input?.direccion ? String(input.direccion).trim() : null,
      telefono: input?.telefono ? String(input.telefono).trim() : null,
      email,
      ruc_cedula,
      estado: input?.estado || "activo",
      notas: input?.notas ? String(input.notas).trim() : null,
      userId: userId || null,
    });
  }
}
