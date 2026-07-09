import { IOrdenCommandRepository } from '../../domain/repositories/IOrdenCommandRepository';
import { CreateOrdenBaseInput, OrdenTrabajoBaseData } from '../../types';

export class CreateOrdenUseCase {
  constructor(private readonly ordenCommandRepo: IOrdenCommandRepository) {}

  async execute(input: CreateOrdenBaseInput): Promise<OrdenTrabajoBaseData> {
    return await this.ordenCommandRepo.create(input);
  }
}
