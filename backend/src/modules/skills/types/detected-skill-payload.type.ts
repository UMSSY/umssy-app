import type { SkillEvidenceRefPayload } from './skill-evidence-ref-payload.type.js';

export interface DetectedSkillPayload {
  id: string;
  evidenceRefs: readonly SkillEvidenceRefPayload[];
}
