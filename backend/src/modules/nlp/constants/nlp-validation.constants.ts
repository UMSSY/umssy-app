import type { NlpDiscardReason } from '../types/nlp-discard-reason.type.js';

export const NLP_SOURCE_TEXT_MAX_LENGTH = 20_000;

export const NLP_SKILL_NAME_MAX_LENGTH = 50;

export const NLP_SKILL_NAME_ALLOWED_CHARACTERS = /^[\p{L}\p{N} +#.\-_/&()]+$/u;
export const NLP_SKILL_NAME_LETTER = /\p{L}/u;
export const NLP_SKILL_NAME_REPEATED_CHARACTER = /(.)\1{3,}/iu;

export const NLP_VALIDATION_MESSAGES: Readonly<Record<NlpDiscardReason, string>> = {
  'not-in-catalog': 'La habilidad detectada no pertenece al catálogo de habilidades.',
  'empty-name': 'La habilidad no tiene nombre.',
  'name-too-long': 'El nombre de la habilidad supera los 50 caracteres.',
  'invalid-characters': 'El nombre de la habilidad contiene caracteres no permitidos.',
  'missing-letter': 'El nombre de la habilidad debe contener al menos una letra.',
  'repeated-characters': 'El nombre de la habilidad repite el mismo carácter más de 3 veces seguidas.',
  'source-too-long': 'El texto supera el máximo permitido y no se analizó.',
};
