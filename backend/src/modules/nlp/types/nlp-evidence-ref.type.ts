import type { NlpSourceType } from './nlp-source-type.type.js';

export interface NlpEvidenceRef {
  type: NlpSourceType;
  id: string;
}
