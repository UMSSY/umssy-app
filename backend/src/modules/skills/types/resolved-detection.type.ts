import type { SkillEvidenceRefPayload } from './skill-evidence-ref-payload.type.js';

export interface ResolvedDetection {
  skillId: string;
  nameKey: string;
  evidenceRefs: SkillEvidenceRefPayload[];
}
