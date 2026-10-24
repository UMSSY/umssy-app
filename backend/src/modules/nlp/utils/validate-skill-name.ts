import {
  NLP_SKILL_NAME_ALLOWED_CHARACTERS,
  NLP_SKILL_NAME_LETTER,
  NLP_SKILL_NAME_MAX_LENGTH,
  NLP_SKILL_NAME_REPEATED_CHARACTER,
} from '../constants/nlp-validation.constants.js';
import type { NlpSkillNameValidation } from '../types/nlp-skill-name-validation.type.js';

// Extra spaces are corrected; any other rule breach discards the name.
export function validateSkillName(rawName: string): NlpSkillNameValidation {
  const name = (rawName ?? '').trim().split(/\s+/).filter(Boolean).join(' ');

  if (!name) return { isValid: false, reason: 'empty-name' };
  if (name.length > NLP_SKILL_NAME_MAX_LENGTH) return { isValid: false, reason: 'name-too-long' };
  if (!NLP_SKILL_NAME_ALLOWED_CHARACTERS.test(name)) return { isValid: false, reason: 'invalid-characters' };
  if (!NLP_SKILL_NAME_LETTER.test(name)) return { isValid: false, reason: 'missing-letter' };
  if (NLP_SKILL_NAME_REPEATED_CHARACTER.test(name)) return { isValid: false, reason: 'repeated-characters' };
  return { isValid: true, name };
}
