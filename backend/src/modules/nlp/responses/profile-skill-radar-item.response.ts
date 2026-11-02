import type { NlpEvidenceRef } from '../types/nlp-evidence-ref.type.js';

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
