import { ClienteRepository } from "../../../domain/repositories/clientes/ClienteRepository";

export class SearchClientesUseCase {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async execute(query: string) {
    const normalizedQuery = String(query || "").trim();
    if (normalizedQuery.length < 2 || !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(normalizedQuery)) {
      return [];
    }

    return this.clienteRepository.search(normalizedQuery);
  }
}
