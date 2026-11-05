import type { NlpEvidenceRef } from './nlp-evidence-ref.type.js';

export interface NlpDetectedSkillEvidence {
  name: string;
  evidenceRefs: NlpEvidenceRef[];
}
