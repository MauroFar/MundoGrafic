import { IOrdenQueryRepository } from '../../domain/repositories/IOrdenQueryRepository';
import { NumeroOrden } from '../../domain/value-objects/NumeroOrden';

export class GetProximoNumeroUseCase {
  constructor(private readonly ordenQueryRepo: IOrdenQueryRepository) {}

  async execute(): Promise<string> {
    const lastNumero = await this.ordenQueryRepo.getLastNumeroOrden();
    const nuevoNumero = NumeroOrden.generateNext(lastNumero);
    return nuevoNumero.getValue();
  }
}
