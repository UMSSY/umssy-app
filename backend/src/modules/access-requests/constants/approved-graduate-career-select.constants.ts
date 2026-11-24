import type { Prisma } from '../../../prisma/client.js';

export const APPROVED_GRADUATE_CAREER_SELECT = {
  approvedUserId: true,
  careerId: true,
} satisfies Prisma.AccessRequestSelect;
