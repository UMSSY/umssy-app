import { Injectable } from '@nestjs/common';
import { EventNotFoundException } from '../exceptions/event-not-found.exception.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { escapePgWildcards } from '../../../common/utils/escape-pg-wildcards.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FindEventsPayload, FindEventsResponse, EventWithRelations } from '../types/events.types.js';
import { CATALOG_STATUS_TITLES, PUBLISHED_STATUS_TITLE, CONFIRMED_REGISTRATION_TITLE } from '../constants/events.constants.js';
import {
  mapEventToResponse,
  mapEventsToListResponse,
} from '../mappers/events.mapper.js';
import type { GetEventsPayload } from '../requests/get-events.request.js';
import type {
  EventDetailResponse,
  EventsListResponse,
} from '../types/events.types.js';

function buildSelect(userId?: string): Prisma.EventSelect {
  return {
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
    _count: {
      select: {
        registrations: {
          where: {
            cancelledAt: null,
            status: { title: CONFIRMED_REGISTRATION_TITLE },
          },
        },
      },
    },
    ...(userId !== undefined && {
      registrations: {
        where: {
          userId,
          cancelledAt: null,
          status: { title: CONFIRMED_REGISTRATION_TITLE },
        },
        select: { id: true },
        take: 1,
      },
    }),
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(payload: GetEventsPayload, userId?: string): Promise<EventsListResponse> {
    const { page, limit, categoryId, statusId, search } = payload;
    const offset = (page - 1) * limit;
    const isPublishedOnly = statusId === undefined;

    const { items, total } = await this.findAndCount({
      categoryId,
      statusId,
      isPublishedOnly,
      ...(payload.includeProposals && { includeProposals: true }),
      search,
      userId,
      skip: offset,
      take: limit,
    });

    return mapEventsToListResponse(items, total, page, limit);
  }

  async findOne(id: string, userId?: string): Promise<EventDetailResponse> {
    const event = await this.findById(id, userId);

    if (!event) {
      throw new EventNotFoundException(id);
    }

    const availableSpots =
      event.capacity === null
        ? null
        : Math.max(0, event.capacity - event._count.registrations);
    return {
      ...mapEventToResponse(event, availableSpots),
      modality: event.modality,
    };
  }
  async findAndCount(payload: FindEventsPayload): Promise<FindEventsResponse> {
    const { categoryId, statusId, isPublishedOnly, search, userId, skip, take } =
      payload;

    const where: Prisma.EventWhereInput = {
      ...(categoryId !== undefined && { categoryId }),
      ...(statusId !== undefined
        ? { statusId }
        : isPublishedOnly
          ? { status: { title: payload.includeProposals ? { in: CATALOG_STATUS_TITLES } : PUBLISHED_STATUS_TITLE } }
          : {}),
      ...(search !== undefined && {
        title: {
          contains: escapePgWildcards(search),
          mode: 'insensitive',
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        select: buildSelect(userId),
        where,
        orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
        skip,
        take,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items: items as unknown as EventWithRelations[],
      total,
    };
  }

  async findById(
    id: string,
    userId?: string,
  ): Promise<
    (EventWithRelations & { modality: { id: string; title: string } }) | null
  > {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: {
        ...buildSelect(userId),
        modality: { select: { id: true, title: true } },
      },
    });

    return event as unknown as
      | (EventWithRelations & { modality: { id: string; title: string } })
      | null;
  }

  async findForRegistration(id: string, tx: Prisma.TransactionClient = this.prisma) {
    const event = await tx.event.findUnique({
      where: { id },
      select: {
        id: true,
        capacity: true,
        eventDate: true,
        startTime: true,
        status: { select: { title: true } },
      },
    });
    if (!event) throw new EventNotFoundException(id);
    return event;
  }
}
