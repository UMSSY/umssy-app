import type { Prisma } from '../../../prisma/client.js';
import type { REGISTRATION_SELECT } from '../constants/registrations.constants.js';

export type RegistrationRecord = Prisma.EventRegistrationGetPayload<{
  select: typeof REGISTRATION_SELECT;
}>;
