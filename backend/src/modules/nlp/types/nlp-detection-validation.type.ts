import type { NlpDetectedSkill } from './nlp-detected-skill.type.js';
import type { NlpDiscardedSkill } from './nlp-discarded-skill.type.js';

export interface NlpDetectionValidation {
  accepted: NlpDetectedSkill[];
  discarded: NlpDiscardedSkill[];
}
