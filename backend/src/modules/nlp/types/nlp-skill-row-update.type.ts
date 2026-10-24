import type { NlpEvidenceRef } from './nlp-evidence-ref.type.js';

export interface NlpSkillRowUpdate {
  id: string;
  evidenceRefs: readonly NlpEvidenceRef[];
  isHighRelevance: boolean;
}
