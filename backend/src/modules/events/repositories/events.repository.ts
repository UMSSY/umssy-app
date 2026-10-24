import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { escapePgWildcards } from '../../../common/utils/escape-pg-wildcards.js';
import type { Prisma } from '../../../prisma/client.js';
import type {
  FindEventsPayload,
  FindEventsResponse,
  EventWithRelations,
} from '../types/events.types.js';

import {
  CATALOG_STATUS_TITLES,
  CONFIRMED_REGISTRATION_TITLE,
} from '../constants/events.constants.js';
export { PUBLISHED_STATUS_TITLE } from '../constants/events.constants.js';

function buildSelect(userId?: string): Prisma.EventSelect {
  return {
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
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAndCount(payload: FindEventsPayload): Promise<FindEventsResponse> {
    const { categoryId, statusId, isPublishedOnly, search, userId, skip, take } =
      payload;

    const where: Prisma.EventWhereInput = {
      ...(categoryId !== undefined && { categoryId }),
      ...(statusId !== undefined
        ? { statusId }
        : isPublishedOnly
          ? { status: { title: { in: CATALOG_STATUS_TITLES } } }
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
}