import type { NlpEvidenceRef } from './nlp-evidence-ref.type.js';

export interface NlpDetectedSkill {
  id: string;
  name: string;
  source: 'nlp';
  verificationStatus: 'pending';
  evidenceRefs: readonly NlpEvidenceRef[];
}
