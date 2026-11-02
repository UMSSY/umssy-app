import type { Prisma } from '../../../prisma/client.js';

export const REJECTION_MAIL_SELECT = {
  email: true,
  rejectionReason: true,
  updatedAt: true,
} satisfies Prisma.AccessRequestSelect;
