import { EstadoCanonicoKey } from '../../types';

/**
 * Estados canónicos reconocidos por el sistema
 */
export const CANONICAL_STATES = new Set<EstadoCanonicoKey>([
  'en_preprensa',
  'en_prensa',
  'laminado',
  'troquelado',
  'terminados',
  'liberado',
  'entregado',
  'cancelado',
]);

/**
 * Mapeo de variantes display a estados canónicos
 * Maneja diferentes formas de escribir el mismo estado
 */
export const DISPLAY_TO_CANON: Record<string, EstadoCanonicoKey> = {
  // Preprensa variants
  'preprensa': 'en_preprensa',
  'pre prensa': 'en_preprensa',
  'en preprensa': 'en_preprensa',

  // Impresión / prensa variants
  'impresion': 'en_prensa',
  'prensa / impresion': 'en_prensa',
  'prensa / impresión': 'en_prensa',
  'prensa impresion': 'en_prensa',
  'en prensa': 'en_prensa',

  // Laminado variants
  'laminado/barnizado': 'laminado',
  'laminado barnizado': 'laminado',
  'laminado': 'laminado',

  // Otros estados
  'troquelado': 'troquelado',
  'terminados': 'terminados',
  'producto liberado': 'liberado',
  'liberado': 'liberado',
  'producto entregado': 'entregado',
  'entregado': 'entregado',
  'cancelado': 'cancelado',
};

/**
 * Normaliza un string removiendo acentos, convirtiendo a minúsculas
 */
function normalizeString(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza un estado a su forma canónica
 * @param input - Estado en cualquier formato (display o canónico)
 * @returns Estado canónico o null si no se reconoce
 */
export function normalizeEstado(input: any): EstadoCanonicoKey | null {
  if (input === null || input === undefined) return null;
  
  const normalized = normalizeString(input);
  
  // Si ya es un canonical conocido
  if (CANONICAL_STATES.has(normalized as EstadoCanonicoKey)) {
    return normalized as EstadoCanonicoKey;
  }
  
  // Buscar en display map
  if (DISPLAY_TO_CANON[normalized]) {
    return DISPLAY_TO_CANON[normalized];
  }
  
  return null;
}

/**
 * Valida si un estado es válido (reconocido por el sistema)
 */
export function isValidEstado(input: any): boolean {
  return normalizeEstado(input) !== null;
}
