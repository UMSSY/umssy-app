import type { SkillEvidenceRefPayload } from './skill-evidence-ref-payload.type.js';

export interface DetectedSkillPayload {
  id: string;
  name: string;
  evidenceRefs: readonly SkillEvidenceRefPayload[];
}
