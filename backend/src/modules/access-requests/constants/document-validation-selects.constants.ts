import type { Prisma } from '../../../prisma/client.js';

export const VALIDATION_SUMMARY_SELECT = {
  result: true,
  matchScore: true,
  reason: true,
} satisfies Prisma.DocumentValidationSelect;

export const VALIDATION_DETAIL_SELECT = {
  ...VALIDATION_SUMMARY_SELECT,
  fieldResults: true,
  readAt: true,
  revertedAt: true,
  revertedBy: { select: { firstName: true, lastName: true } },
} satisfies Prisma.DocumentValidationSelect;
