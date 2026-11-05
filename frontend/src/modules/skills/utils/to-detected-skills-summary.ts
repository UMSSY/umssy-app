import type { DetectedSkillsSummary } from "../types/detected-skills-summary.types";
import type { SkillsRadarResponse } from "../types/skills-radar-response.types";

// Manual skills are already listed in the section; only the ones found by the analysis are added here.
export function toDetectedSkillsSummary(response: SkillsRadarResponse | null | undefined): DetectedSkillsSummary {
  return {
    status: response?.status ?? "pending",
    skills: (response?.skills ?? [])
      .filter((skill) => skill.source === "nlp")
      .map((skill) => ({ id: skill.id, name: skill.name, evidenceCount: (skill.evidenceRefs ?? []).length, verificationStatus: skill.verificationStatus })),
  };
}
