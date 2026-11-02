export const VALIDATION_RESULT = {
  QUEUED: 'queued',
  AUTO_APPROVED: 'auto_approved',
  MANUAL_REVIEW: 'manual_review',
  AUTO_REJECTED: 'auto_rejected',
} as const;

export type ValidationResult = (typeof VALIDATION_RESULT)[keyof typeof VALIDATION_RESULT];

export const FIELD_RESULT = {
  MATCH: 'match',
  MISMATCH: 'mismatch',
  NOT_COMPARED: 'not_compared',
} as const;

export type FieldResult = (typeof FIELD_RESULT)[keyof typeof FIELD_RESULT];

export const VALIDATION_FIELD = {
  FULL_NAME: 'fullName',
  CAREER: 'career',
  GRADUATION_YEAR: 'graduationYear',
  ID_CARD_NUMBER: 'idCardNumber',
  SIS_CODE: 'sisCode',
} as const;

export type ValidationField = (typeof VALIDATION_FIELD)[keyof typeof VALIDATION_FIELD];
