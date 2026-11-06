import type { NlpDiscardReason } from './nlp-discard-reason.type.js';
import type { NlpSourceType } from './nlp-source-type.type.js';

export interface NlpRejectedSource {
  id: string;
  type: NlpSourceType;
  reason: NlpDiscardReason;
  message: string;
}
