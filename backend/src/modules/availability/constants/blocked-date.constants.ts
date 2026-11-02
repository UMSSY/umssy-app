export const BLOCKED_DATE_REASON_MAX_LENGTH = 100;

export const BLOCKED_DATE_MESSAGES = {
  invalidDate: 'La fecha no tiene un formato válido (AAAA-MM-DD)',
  invalidReason: 'El motivo debe ser un texto',
  reasonTooLong: `El motivo admite hasta ${BLOCKED_DATE_REASON_MAX_LENGTH} caracteres`,
  invalidId: 'El id de la fecha bloqueada no es válido',
} as const;

export const MENTOR_DAY_TRANSACTION_OPTIONS = { maxWait: 5_000, timeout: 10_000 } as const;
