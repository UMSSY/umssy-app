export const JOB_APPLICATION_STATUS = {
  IN_REVIEW: 'En revisión',
  INTERVIEW: 'Entrevista',
  ACCEPTED: 'Aceptada',
  REJECTED: 'No seleccionado',
  WITHDRAWN: 'Retirada',
} as const;

export const WITHDRAWABLE_APPLICATION_STATUSES: readonly string[] = [
  JOB_APPLICATION_STATUS.IN_REVIEW,
  JOB_APPLICATION_STATUS.INTERVIEW,
];

export const JOB_APPLICATION_MESSAGES = {
  OFFER_UNAVAILABLE: 'La vacante no existe o no está disponible.',
  DUPLICATE: 'Ya te postulaste a esta vacante.',
  STATUS_MISSING: 'No se encontró el estado inicial de la postulación.',
  APPLICATION_NOT_FOUND: 'La postulación no existe.',
  NOT_WITHDRAWABLE: 'Solo puedes retirar postulaciones en revisión o en entrevista.',
} as const;

export const UNIQUE_VIOLATION_CODE = 'P2002';
