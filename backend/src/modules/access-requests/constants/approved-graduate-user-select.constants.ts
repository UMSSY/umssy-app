import type { Prisma } from '../../../prisma/client.js';

export const APPROVED_GRADUATE_USER_SELECT = {
  approvedUserId: true,
} satisfies Prisma.AccessRequestSelect;
