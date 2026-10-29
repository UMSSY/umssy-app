export const JOB_APPLICATION_STATUS = {
  IN_REVIEW: 'En revisión',
  INTERVIEW: 'Entrevista',
  ACCEPTED: 'Aceptada',
  REJECTED: 'No seleccionado',
} as const;

export const JOB_APPLICATION_MESSAGES = {
  OFFER_UNAVAILABLE: 'La vacante no existe o no está disponible.',
  DUPLICATE: 'Ya te postulaste a esta vacante.',
  STATUS_MISSING: 'No se encontró el estado inicial de la postulación.',
} as const;

export const UNIQUE_VIOLATION_CODE = 'P2002';
