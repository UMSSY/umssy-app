import { Injectable } from '@nestjs/common';
import { EventNotFoundException } from '../exceptions/event-not-found.exception.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { escapePgWildcards } from '../../../common/utils/escape-pg-wildcards.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FindEventsPayload, FindEventsResponse, EventWithRelations } from '../types/events.types.js';
import { PUBLISHED_STATUS_TITLE, CONFIRMED_REGISTRATION_TITLE } from '../constants/events.constants.js';
import {
  mapEventToResponse,
  mapEventsToListResponse,
} from '../mappers/events.mapper.js';
import type { GetEventsPayload } from '../requests/get-events.request.js';
import type {
  EventDetailResponse,
  EventsListResponse,
} from '../types/events.types.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(payload: GetEventsPayload): Promise<EventsListResponse> {
    const { page, limit, categoryId, statusId, search } = payload;
    const offset = (page - 1) * limit;
    const isPublishedOnly = statusId === undefined;

    const { items, total } = await this.findAndCount({
      categoryId,
      statusId,
      isPublishedOnly,
      ...(payload.includeProposals && { includeProposals: true }),
      search,
      skip: offset,
      take: limit,
    });

    return mapEventsToListResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<EventDetailResponse> {
    const event = await this.findById(id);

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
    const { categoryId, statusId, isPublishedOnly, search, skip, take } =
      payload;

    const where: Prisma.EventWhereInput = {
      ...(categoryId !== undefined && { categoryId }),
      ...(statusId !== undefined
        ? { statusId }
        : isPublishedOnly
          ? { status: { title: payload.includeProposals ? { in: [PUBLISHED_STATUS_TITLE, 'En votación'] } : PUBLISHED_STATUS_TITLE } }
          : {}),
      ...(search !== undefined && {
        title: {
          contains: escapePgWildcards(search),
          mode: 'insensitive',
        },
      }),
    };

    const select = {
      coverMimeType: true,
      status: { select: { title: true } },
      supportThreshold: true,
      votingDeadline: true,
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
      category: {
        select: {
          id: true,
          name: true,
        },
      },
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
    } as const;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        select,
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
  ): Promise<
    (EventWithRelations & { modality: { id: string; title: string } }) | null
  > {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: {
        coverMimeType: true,
        status: { select: { title: true } },
        supportThreshold: true,
        votingDeadline: true,
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
        modality: { select: { id: true, title: true } },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
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
      },
    });

    return event;
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
