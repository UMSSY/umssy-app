import type { Prisma } from '../../../prisma/client.js';

export type EventWithRelations = Prisma.EventGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    eventDate: true;
    startTime: true;
    endTime: true;
    location: true;
    capacity: true;
    statusId: true;
    instructorName: true;
    modalityId: true;
    supportThreshold: true;
    votingDeadline: true;
    status: { select: { title: true } };
    origin: { select: { title: true } };
    category: {
      select: {
        id: true;
        name: true;
      };
    };
    _count: {
      select: {
        registrations: true;
      };
    };
  };
}> & { registrations?: { id: string }[]; coverMimeType?: string | null };