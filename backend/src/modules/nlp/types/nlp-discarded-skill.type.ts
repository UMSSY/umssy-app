import type { NlpDiscardReason } from './nlp-discard-reason.type.js';

export interface NlpDiscardedSkill {
  name: string;
  reason: NlpDiscardReason;
  message: string;
}
