import { AppError } from "../../../shared/errors/AppError";
import { ClienteRepository } from "../../../domain/repositories/clientes/ClienteRepository";

export class CreateClienteUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(input: any, userId: number | null | undefined) {
    const nombre = String(input?.nombre || "").trim();
    if (!nombre) {
      throw new AppError("Nombre de contacto es obligatorio", 400);
    }

    return this.clienteRepository.create({
      nombre,
      empresa: input?.empresa || null,
      direccion: input?.direccion || null,
      telefono: input?.telefono || null,
      email: input?.email || null,
      ruc_cedula: input?.ruc_cedula || null,
      estado: input?.estado || "activo",
      notas: input?.notas || null,
      userId: userId || null,
    });
  }
}
