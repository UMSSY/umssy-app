import type { Prisma } from '../../../prisma/client.js';
import type { SOCIAL_ACCOUNT_SELECT } from '../constants/social-account-select.constants.js';

export type SocialAccountRecord = Prisma.UserSocialAccountGetPayload<{
  select: typeof SOCIAL_ACCOUNT_SELECT;
}>;
