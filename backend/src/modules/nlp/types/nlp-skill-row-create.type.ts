import type { NlpEvidenceRef } from './nlp-evidence-ref.type.js';

export interface NlpSkillRowCreate {
  skillId: string;
  evidenceRefs: readonly NlpEvidenceRef[];
}
