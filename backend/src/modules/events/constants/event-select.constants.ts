import type { Prisma } from '../../../prisma/client.js';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';

export const EVENT_SELECT = {
  coverMimeType: true,
  id: true,
  title: true,
  description: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  location: true,
  capacity: true,
  statusId: true,
  instructorName: true,
  modalityId: true,
  supportThreshold: true,
  votingDeadline: true,
  status: { select: { title: true } },
  origin: { select: { title: true } },
  category: { select: { id: true, name: true } },
  sessions: {
    select: { id: true, startsAt: true, endsAt: true, location: true },
    orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
  },
  registrations: {
    where: {
      cancelledAt: null,
      status: { title: REGISTRATION_STATUS_TITLES.confirmed },
    },
    select: { id: true },
    take: 1,
  },
  _count: {
    select: {
      registrations: {
        where: {
          cancelledAt: null,
          status: { title: REGISTRATION_STATUS_TITLES.confirmed },
        },
      },
    },
  },
} as const satisfies Prisma.EventSelect;
