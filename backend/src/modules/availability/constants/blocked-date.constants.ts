export const BLOCKED_DATE_MESSAGES = {
  invalidDate: 'La fecha no tiene un formato válido (AAAA-MM-DD)',
  invalidReason: 'El motivo debe ser un texto',
  reasonTooLong: `El motivo admite hasta 100 caracteres`,
  invalidId: 'El id de la fecha bloqueada no es válido',
} as const;

export const MENTOR_DAY_TRANSACTION_OPTIONS = {
  maxWait: 5_000,
  timeout: 10_000,
} as const;
