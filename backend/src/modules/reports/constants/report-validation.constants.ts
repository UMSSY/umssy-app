export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const FIRST_REPORT_YEAR = 2020;
export const MAX_SEARCH_LENGTH = 100;

export const REPORT_VALIDATION_MESSAGES = {
  pageInvalid: 'La página debe ser un número entero',
  pageMin: 'La página debe ser mayor o igual a 1',
  limitInvalid: 'El límite debe ser un número entero',
  limitMin: 'El límite debe ser mayor o igual a 1',
  limitMax: `El límite no puede ser mayor a ${MAX_PAGE_SIZE}`,
  userTypeInvalid: 'El tipo de usuario no es válido',
  yearInvalid: 'El año debe ser un número entero',
  yearMin: `El año debe ser mayor o igual a ${FIRST_REPORT_YEAR}`,
  searchInvalid: 'La búsqueda debe ser un texto',
  searchMax: `La búsqueda no puede superar los ${MAX_SEARCH_LENGTH} caracteres`,
} as const;
