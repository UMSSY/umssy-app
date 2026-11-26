import type { Prisma } from '../../../prisma/client.js';

export const REGISTRATION_SELECT = {
  id: true,
  eventId: true,
  userId: true,
  status: { select: { title: true } },
  qrToken: true,
  registeredAt: true,
  cancelledAt: true,
} as const;

export const MY_REGISTRATION_EVENT_SELECT = {
  title: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  location: true,
  sessions: {
    select: { id: true, startsAt: true, endsAt: true, location: true },
    orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.EventSelect;
