import { TipoOrden } from '../../types';

/**
 * Value Object: Tipo de Orden
 * Garantiza que solo se usen valores válidos para tipo_orden
 */
export class TipoOrdenVO {
  private readonly value: TipoOrden;

  private constructor(value: TipoOrden) {
    this.value = value;
  }

  static create(value: string): TipoOrdenVO {
    const normalized = value?.toLowerCase().trim();
    
    if (normalized !== 'digital' && normalized !== 'offset') {
      throw new Error(`Tipo de orden inválido: ${value}. Debe ser 'digital' o 'offset'`);
    }
    
    return new TipoOrdenVO(normalized as TipoOrden);
  }

  getValue(): TipoOrden {
    return this.value;
  }

  isDigital(): boolean {
    return this.value === 'digital';
  }

  isOffset(): boolean {
    return this.value === 'offset';
  }

  equals(other: TipoOrdenVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
