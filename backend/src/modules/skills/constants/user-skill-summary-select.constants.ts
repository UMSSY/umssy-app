import type { Prisma } from '../../../prisma/client.js';

export const USER_SKILL_SUMMARY_SELECT = {
  userId: true,
  source: true,
  skill: { select: { id: true, name: true } },
} satisfies Prisma.UserSkillSelect;
