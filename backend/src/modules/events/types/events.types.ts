import type { Prisma } from '../../../prisma/client.js';

export interface EventCategoryResponse {
  id: string;
  name: string;
}

export interface EventItemResponse {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  capacity: number | null;
  availableSpots: number | null;
  registeredCount: number;
  category: EventCategoryResponse;
  statusId: string;
}

export interface EventsListDataResponse {
  items: EventItemResponse[];
  total: number;
  limit: number;
  totalPages: number;
}

export interface EventsListResponse {
  data: EventsListDataResponse;
  page: number;
  offset: number;
}

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
}>;

export interface FindEventsPayload {
  categoryId?: string;
  statusId?: string;
  search?: string;
  skip: number;
  take: number;
}

export interface FindEventsResponse {
  items: EventWithRelations[];
  total: number;
}
