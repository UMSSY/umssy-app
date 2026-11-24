import type { DocumentSkill } from './document-skill.types.js';
import type { DocumentDecision } from './document-decision.types.js';
export type VerificationResult = {
  status: DocumentDecision;
  confidence: number | null;
  reason: string;
  skills: DocumentSkill[];
};
