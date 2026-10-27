import type { SkillEvidenceRefPayload } from './skill-evidence-ref-payload.type.js';

export interface SkillRowUpdatePayload {
  id: string;
  evidenceRefs: readonly SkillEvidenceRefPayload[];
  isHighRelevance: boolean;
}
