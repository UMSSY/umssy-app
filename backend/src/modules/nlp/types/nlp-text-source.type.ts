import type { NlpSourceType } from './nlp-source-type.type.js';

export interface NlpTextSource {
  id: string;
  type: NlpSourceType;
  text: string;
}
