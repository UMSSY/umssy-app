import type { DocumentSkill } from './document-skill.type.js';
import type { DocumentDecision } from './document-decision.type.js';
export type VerificationResult = {
  status: DocumentDecision;
  confidence: number | null;
  reason: string;
  skills: DocumentSkill[];
};
