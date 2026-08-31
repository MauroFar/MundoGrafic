import { AppError } from "../../../shared/errors/AppError";
import { ClienteRepository } from "../../../domain/repositories/clientes/ClienteRepository";

export class UpdateClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(id: number, input: any, userId: number | null | undefined) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError("ID de cliente invalido", 400);
    }

    const currentClient = await this.clienteRepository.findById(id);
    if (!currentClient) {
      throw new AppError("Cliente no encontrado", 404);
    }

    const normalizedInput = {
      nombre: input?.nombre !== undefined ? String(input.nombre).trim() || null : currentClient.nombre,
      empresa: input?.empresa !== undefined ? String(input.empresa).trim() || null : currentClient.empresa,
      direccion: input?.direccion !== undefined ? String(input.direccion).trim() || null : currentClient.direccion,
      telefono: input?.telefono !== undefined ? String(input.telefono).trim() || null : currentClient.telefono,
      email: input?.email !== undefined ? String(input.email).trim() || null : currentClient.email,
      ruc_cedula: input?.ruc_cedula !== undefined ? String(input.ruc_cedula).trim() || null : currentClient.ruc_cedula,
      estado: input?.estado || currentClient.estado || "activo",
      notas: input?.notas !== undefined ? String(input.notas).trim() || null : currentClient.notas,
    };

    const hasRelations = await this.clienteRepository.hasRelatedDocuments(id);
    const protectedFields = ["nombre", "empresa", "ruc_cedula"] as const;

    const hasProtectedChanges = protectedFields.some((field) => {
      const currentValue = String(currentClient[field as keyof typeof currentClient] ?? "").trim();
      const nextValue = String(normalizedInput[field] ?? "").trim();
      return currentValue !== nextValue;
    });

    if (hasRelations && hasProtectedChanges) {
      throw new AppError("No se puede editar el nombre, la empresa o el RUC/Cédula de un cliente con cotizaciones u órdenes de trabajo asociadas", 409);
    }

    const nombre = String(normalizedInput.nombre || "").trim();
    if (!nombre) {
      throw new AppError("Nombre de contacto es obligatorio", 400);
    }

    return this.clienteRepository.update({
      id,
      nombre,
      empresa: normalizedInput.empresa,
      direccion: normalizedInput.direccion,
      telefono: normalizedInput.telefono,
      email: normalizedInput.email,
      ruc_cedula: normalizedInput.ruc_cedula,
      estado: normalizedInput.estado,
      notas: normalizedInput.notas,
      userId: userId || null,
    });
  }
}
