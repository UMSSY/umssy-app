import type { Prisma } from '../../../prisma/client.js';
import type { USER_SKILL_SUMMARY_SELECT } from '../constants/user-skill-summary-select.constants.js';

export type UserSkillSummaryRecord = Prisma.UserSkillGetPayload<{
  select: typeof USER_SKILL_SUMMARY_SELECT;
}>;
