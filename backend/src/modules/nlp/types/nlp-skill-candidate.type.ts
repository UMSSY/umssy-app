import type { NlpEvidenceRef } from './nlp-evidence-ref.type.js';

export interface NlpSkillCandidate {
  name: string;
  evidenceRefs: readonly NlpEvidenceRef[];
}
