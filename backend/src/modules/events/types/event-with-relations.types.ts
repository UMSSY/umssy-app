import type { Prisma } from '../../../prisma/client.js';
import { EVENT_SELECT } from '../constants/event-select.constants.js';

export type EventWithRelations = Prisma.EventGetPayload<{
  select: typeof EVENT_SELECT;
}>;
