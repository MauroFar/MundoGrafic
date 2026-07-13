import { IOrdenLegacyRepository } from '../../domain/repositories/IOrdenLegacyRepository';

export class DeleteOrdenUseCase {
  constructor(private readonly ordenRepo: IOrdenLegacyRepository) {}

  async execute(id: number): Promise<void> {
    const bloqueada = await this.ordenRepo.fueEnviadaAProduccion(id);
    if (bloqueada)
      throw new Error(
        'No se puede eliminar la orden porque ya fue enviada a producción.',
      );

    const deleted = await this.ordenRepo.delete(id);
    if (!deleted) throw new Error('Orden no encontrada');
  }
}
