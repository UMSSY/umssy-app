import type { NlpEvidenceRef } from '../types/nlp-evidence-ref.type.js';

// "text" and "name" carry the same canonical name until the radar contract settles on one of them.
export interface ProfileSkillRadarItemResponse {
  id: string;
  text: string;
  name: string;
  source: 'manual' | 'nlp';
  areaId: string | null;
  verificationStatus: string;
  isHighRelevance: boolean;
  evidenceRefs: NlpEvidenceRef[];
}
