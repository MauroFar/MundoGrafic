import { IOrdenQueryRepository } from '../../domain/repositories/IOrdenQueryRepository';
import { OrdenTrabajoBase } from '../../domain/entities/OrdenTrabajoBase';
import { OrdenSearchFilters } from '../../types';

export class SearchOrdenesUseCase {
  constructor(private readonly ordenQueryRepo: IOrdenQueryRepository) {}

  async execute(filters: OrdenSearchFilters): Promise<OrdenTrabajoBase[]> {
    return await this.ordenQueryRepo.findByFilters(filters);
  }
}
