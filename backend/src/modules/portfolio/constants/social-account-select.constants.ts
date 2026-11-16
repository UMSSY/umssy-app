import type { Prisma } from '../../../prisma/client.js';

export const SOCIAL_ACCOUNT_SELECT = {
  id: true,
  userId: true,
  externalId: true,
  username: true,
  profileUrl: true,
  createdAt: true,
  updatedAt: true,
  provider: {
    select: {
      name: true,
    },
  },
} as const satisfies Prisma.UserSocialAccountSelect;
