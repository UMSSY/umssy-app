import type { ProfileSkillEvidenceRef } from "./profile-skill-evidence-ref.types";
import type { ProfileSkillsRadarResponse } from "./profile-skills-radar-response.types";

export interface ProfileSkillsAnalysisResponse extends ProfileSkillsRadarResponse {
  analysis: {
    rejectedSources: (ProfileSkillEvidenceRef & { reason: string; message: string })[];
  };
}
