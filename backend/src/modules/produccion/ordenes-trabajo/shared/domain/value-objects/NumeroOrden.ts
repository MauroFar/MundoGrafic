/**
 * Value Object: Número de Orden
 * Genera y valida números de orden con formato consistente (9 dígitos)
 */
export class NumeroOrden {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Crea un NumeroOrden desde un número entero
   * Formatea con padding de 9 dígitos: 000000001, 000000123, etc.
   */
  static fromNumber(num: number): NumeroOrden {
    if (num < 1) {
      throw new Error('El número de orden debe ser mayor a 0');
    }
    
    const formatted = String(num).padStart(9, '0');
    return new NumeroOrden(formatted);
  }

  /**
   * Crea un NumeroOrden desde un string
   * Valida formato de 9 dígitos
   */
  static fromString(str: string): NumeroOrden {
    const trimmed = str.trim();
    
    if (!/^\d{9}$/.test(trimmed)) {
      throw new Error(`Número de orden inválido: ${str}. Debe tener 9 dígitos`);
    }
    
    return new NumeroOrden(trimmed);
  }

  /**
   * Genera el próximo número de orden basado en el último número existente
   */
  static generateNext(lastNumber: string | null): NumeroOrden {
    if (!lastNumber) {
      return NumeroOrden.fromNumber(1);
    }
    
    const lastNum = parseInt(lastNumber, 10);
    if (isNaN(lastNum)) {
      throw new Error(`No se pudo parsear el último número de orden: ${lastNumber}`);
    }
    
    return NumeroOrden.fromNumber(lastNum + 1);
  }

  getValue(): string {
    return this.value;
  }

  toNumber(): number {
    return parseInt(this.value, 10);
  }

  equals(other: NumeroOrden): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
