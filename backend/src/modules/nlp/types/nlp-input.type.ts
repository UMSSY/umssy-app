import type { NlpTextSource } from './nlp-text-source.type.js';

export interface NlpInput {
  userId: string;
  sources: readonly NlpTextSource[];
}
