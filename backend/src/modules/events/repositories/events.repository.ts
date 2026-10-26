import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { escapePgWildcards } from '../../../common/utils/escape-pg-wildcards.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FindEventsPayload, FindEventsResponse, EventWithRelations } from '../types/events.types.js';
import { CATALOG_STATUS_TITLES, COMMUNITY_ORIGIN_TITLE, CONFIRMED_REGISTRATION_TITLE, EXPIRED_STATUS_TITLE, PUBLISHED_STATUS_TITLE, VOTING_STATUS_TITLES } from '../constants/events.constants.js';

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
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async expireOverdueProposals(now: Date): Promise<number> {
    const expiredStatus = await this.prisma.eventStatus.findUnique({
      where: { title: EXPIRED_STATUS_TITLE },
      select: { id: true },
    });

    if (!expiredStatus) return 0;

    const { count } = await this.prisma.event.updateMany({
      where: {
        status: { title: { in: VOTING_STATUS_TITLES } },
        origin: { title: COMMUNITY_ORIGIN_TITLE },
        votingDeadline: { lte: now },
      },
      data: { statusId: expiredStatus.id },
    });

    return count;
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
        endTime: true,
        status: { select: { title: true } },
      },
    });
    return event;
  }
}
