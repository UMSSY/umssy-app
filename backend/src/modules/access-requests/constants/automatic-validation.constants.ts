export const AUTO_APPROVAL_THRESHOLD = 90;

export const AUTO_REJECTION_THRESHOLD = 20;

export const LOW_LEGIBILITY_CONFIDENCE = 0.6;

export const FIELD_WEIGHTS = {
  fullName: 0.6,
  career: 0.25,
  graduationYear: 0.15,
} as const;

export const VALIDATION_REASONS = {
  OCR_FAILED: 'No se pudo leer el documento automáticamente. Requiere revisión manual.',
  NOT_A_DIPLOMA: 'El archivo no es un diploma',
  ILLEGIBLE: 'El documento es ilegible',
  LOW_LEGIBILITY: 'Documento poco legible',
  LAST_NAME_MISMATCH: 'El apellido no coincide',
  FIRST_NAME_MISMATCH: 'El nombre no coincide',
  CAREER_MISMATCH: 'La carrera no coincide',
  YEAR_MISMATCH: 'El año de titulación no coincide',
  BELOW_THRESHOLD: 'La coincidencia está por debajo del umbral',
  APPROVAL_REVERTED: 'Aprobación automática revertida por el administrador',
  ALREADY_IN_REVIEW: 'La solicitud ya estaba en revisión manual',
} as const;

export const VALIDATION_FILTERS = ['auto_approved', 'auto_rejected', 'manual_review', 'queued'] as const;
