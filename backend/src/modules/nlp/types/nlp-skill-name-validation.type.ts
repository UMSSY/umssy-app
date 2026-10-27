import type { NlpDiscardReason } from './nlp-discard-reason.type.js';

export type NlpSkillNameValidation =
  | { isValid: true; name: string }
  | { isValid: false; reason: NlpDiscardReason };
