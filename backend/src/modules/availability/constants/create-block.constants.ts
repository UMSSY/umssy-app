// TODO: confirmar con el PO los pasos de 30 minutos y la duración de los bloques.
export const BLOCK_MIN_HOUR = 7;
export const BLOCK_MAX_HOUR = 22;
export const BLOCK_STEP_MINUTES = 30;
export const MAX_REPEAT_WEEKS = 12;

export const CREATE_BLOCK_MESSAGES = {
  invalidDate: 'La fecha y hora no tienen un formato válido',
  endBeforeStart: 'La hora de fin debe ser posterior a la hora de inicio',
  startInPast: 'La hora de inicio ya pasó',
  outOfRange: `El horario debe estar entre las ${String(BLOCK_MIN_HOUR).padStart(2, '0')}:00 y las ${String(BLOCK_MAX_HOUR).padStart(2, '0')}:00`,
  invalidStep: `Las horas deben ir en intervalos de ${BLOCK_STEP_MINUTES} minutos`,
  differentDays: 'El bloque debe empezar y terminar el mismo día',
  invalidRepeatUntil: 'La fecha de fin de repetición debe tener formato YYYY-MM-DD',
  repeatUntilRequired: 'Elige hasta qué fecha se repite el bloque',
  repeatNotEnabled: 'La fecha de fin requiere activar la repetición semanal',
  repeatUntilOutOfRange: `La fecha límite debe estar dentro de las próximas ${MAX_REPEAT_WEEKS} semanas`,
} as const;

export const OVERLAP_ERROR_CODE = '23P01';
