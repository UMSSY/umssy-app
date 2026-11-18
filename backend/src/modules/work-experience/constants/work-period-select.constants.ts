import type { Prisma } from '../../../prisma/client.js';

export const WORK_PERIOD_SELECT = {
  userId: true,
  startDate: true,
  endDate: true,
} satisfies Prisma.WorkExperienceSelect;
