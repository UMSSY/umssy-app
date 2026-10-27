import type { NlpRejectedSource } from './nlp-rejected-source.type.js';
import type { NlpTextSource } from './nlp-text-source.type.js';

export interface NlpSourceValidation {
  accepted: NlpTextSource[];
  rejected: NlpRejectedSource[];
}
