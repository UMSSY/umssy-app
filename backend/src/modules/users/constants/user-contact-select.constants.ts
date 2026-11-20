import type { Prisma } from '../../../prisma/client.js';

export const USER_CONTACT_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
} satisfies Prisma.UserSelect;
