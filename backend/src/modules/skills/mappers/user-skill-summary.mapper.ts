import type { UserSkillSummaryResponse } from '../responses/user-skill-summary.response.js';
import type { UserSkillSummaryRecord } from '../types/user-skill-summary-record.type.js';

export function toUserSkillSummary(
  record: UserSkillSummaryRecord,
): UserSkillSummaryResponse {
  return {
    userId: record.userId,
    skillId: record.skill.id,
    skillName: record.skill.name,
    source: record.source,
  };
}
