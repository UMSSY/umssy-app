export const JOB_APPLICATION_STATUS = {
  IN_REVIEW: 'En revisión',
  INTERVIEW: 'Entrevista',
  ACCEPTED: 'Aceptada',
  REJECTED: 'No seleccionado',
  WITHDRAWN: 'Retirada',
} as const;

export const ACTIVE_JOB_APPLICATION_WHERE = {
  status: { title: { not: JOB_APPLICATION_STATUS.WITHDRAWN } },
} as const;

export const JOB_APPLICATION_MESSAGES = {
  OFFER_UNAVAILABLE: 'La vacante no existe o no está disponible.',
  DUPLICATE: 'Ya te postulaste a esta vacante.',
  STATUS_MISSING: 'No se encontró el estado inicial de la postulación.',
} as const;

export const UNIQUE_VIOLATION_CODE = 'P2002';
