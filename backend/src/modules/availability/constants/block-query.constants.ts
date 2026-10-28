import type { Prisma } from '../../../prisma/client.js';
import { ACTIVE_APPOINTMENT_STATUSES } from './appointment-status.constants.js';

export const BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE = {
  appointments: {
    where: { status: { title: { in: ACTIVE_APPOINTMENT_STATUSES } } },
    select: { status: { select: { title: true } } },
  },
} satisfies Prisma.AvailabilityBlockInclude;

export const BLOCK_WITH_APPOINTMENT_DETAIL_INCLUDE = {
  appointments: {
    where: { status: { title: { in: ACTIVE_APPOINTMENT_STATUSES } } },
    select: {
      id: true,
      status: { select: { title: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      orientationType: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.AvailabilityBlockInclude;
