import type { Prisma } from '../../../prisma/client.js';
import type { USER_CONTACT_SELECT } from '../constants/user-contact-select.constants.js';

export type UserContact = Prisma.UserGetPayload<{
  select: typeof USER_CONTACT_SELECT;
}>;
