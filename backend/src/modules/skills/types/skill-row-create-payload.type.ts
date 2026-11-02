import type { SkillEvidenceRefPayload } from './skill-evidence-ref-payload.type.js';

export interface SkillRowCreatePayload {
  skillId: string;
  evidenceRefs: readonly SkillEvidenceRefPayload[];
}
