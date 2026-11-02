import type { Prisma } from '../../../prisma/client.js';
import type { APPOINTMENT_SELECT } from '../constants/appointment-select.constants.js';

export type AppointmentRecord = Prisma.AppointmentGetPayload<{
  select: typeof APPOINTMENT_SELECT;
}>;
