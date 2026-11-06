import type { ProfileSkillEvidenceRef } from "./profile-skill-evidence-ref.types";

export interface ProfileSkillRadarItem {
  id: string;
  text: string;
  name: string;
  source: "manual" | "nlp";
  areaId: string | null;
  verificationStatus: string;
  isHighRelevance: boolean;
  evidenceRefs: ProfileSkillEvidenceRef[];
}
