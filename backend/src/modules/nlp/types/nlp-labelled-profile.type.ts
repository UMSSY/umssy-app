import type { NlpSourceType } from './nlp-source-type.type.js';

export interface NlpLabelledProfile {
  id: string;
  sources: { type: NlpSourceType; text: string }[];
  expectedSkills: string[];
}
