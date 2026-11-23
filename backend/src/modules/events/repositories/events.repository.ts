import type { RegistrationScheduleEvent } from '../types/registration-schedule-event.types.js';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';
import { mapSupportContext } from '../mappers/support-context.mapper.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { escapePgWildcards } from '../../../common/utils/escape-pg-wildcards.js';
import type { Prisma } from '../../../prisma/client.js';
import type {
  FindEventsPayload,
  FindEventsResponse,
  EventWithRelations,
} from '../types/events.types.js';
import { EVENT_SELECT } from '../constants/event-select.constants.js';
import { formatUtcDate, formatUtcTime } from '../utils/event-date-time.js';
import { toBoliviaInstant } from '../utils/event-session-schedule.js';
import {
  CATALOG_STATUS_TITLES,
  COMMUNITY_ORIGIN_TITLE,
  EXPIRED_STATUS_TITLE,
  PUBLISHED_STATUS_TITLE,
  VOTING_STATUS_TITLES,
} from '../constants/events.constants.js';

function buildSelect(userId?: string) {
  return {
    ...EVENT_SELECT,
    registrations: {
      ...EVENT_SELECT.registrations,
      where: {
        ...EVENT_SELECT.registrations.where,
        userId: userId ? userId : { in: [] },
      },
    },
  } as const satisfies Prisma.EventSelect;
}

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManaged(userId: string) {
    return this.prisma.event.findMany({
      where: {
        createdById: userId,
        status: { title: PUBLISHED_STATUS_TITLE },
      },
      select: {
        id: true,
        title: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
        coverMimeType: true,
        sessions: EVENT_SELECT.sessions,
      },
      orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }, { id: 'asc' }],
    });
  }

  findManagedWorkshop(
    eventId: string,
    userId: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.event.findFirst({
      where: {
        id: eventId,
        createdById: userId,
        status: { title: PUBLISHED_STATUS_TITLE },
      },
      select: {
        id: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        sessions: { select: { id: true, startsAt: true, endsAt: true } },
      },
    });
  }

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
    const {
      categoryId,
      statusId,
      isPublishedOnly,
      search,
      userId,
      skip,
      take,
    } = payload;

    const where: Prisma.EventWhereInput = {
      ...(categoryId !== undefined && { categoryId }),
      ...(statusId !== undefined
        ? { statusId }
        : isPublishedOnly
          ? {
              status: {
                title: payload.includeProposals
                  ? { in: CATALOG_STATUS_TITLES }
                  : PUBLISHED_STATUS_TITLE,
              },
            }
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
        orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items,
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

    return event;
  }

  findScheduleConflict(
    tx: Prisma.TransactionClient,
    event: RegistrationScheduleEvent,
    registeredEventIds: string[],
  ) {
    const ownSessions = event.sessions ?? [];
    const legacyDate = formatUtcDate(event.eventDate);
    const legacyStartsAt = toBoliviaInstant(
      legacyDate,
      formatUtcTime(event.startTime),
    );
    const legacyEndsAt = toBoliviaInstant(
      legacyDate,
      formatUtcTime(event.endTime),
    );
    const sessionOverlaps = ownSessions.length
      ? ownSessions.map((session) => ({
          startsAt: { lt: session.endsAt },
          endsAt: { gt: session.startsAt },
        }))
      : [{ startsAt: { lt: legacyEndsAt }, endsAt: { gt: legacyStartsAt } }];
    const legacyOverlaps = ownSessions.length
      ? ownSessions.map((session) => {
          const localStart = new Date(
            session.startsAt.getTime() + BOLIVIA_OFFSET_MS,
          );
          const localEnd = new Date(
            session.endsAt.getTime() + BOLIVIA_OFFSET_MS,
          );
          return {
            eventDate: new Date(
              Date.UTC(
                localStart.getUTCFullYear(),
                localStart.getUTCMonth(),
                localStart.getUTCDate(),
              ),
            ),
            startTime: {
              lt: new Date(
                Date.UTC(
                  1970,
                  0,
                  1,
                  localEnd.getUTCHours(),
                  localEnd.getUTCMinutes(),
                ),
              ),
            },
            endTime: {
              gt: new Date(
                Date.UTC(
                  1970,
                  0,
                  1,
                  localStart.getUTCHours(),
                  localStart.getUTCMinutes(),
                ),
              ),
            },
          };
        })
      : [
          {
            eventDate: event.eventDate,
            startTime: { lt: event.endTime },
            endTime: { gt: event.startTime },
          },
        ];
    const overlap: Prisma.EventWhereInput = {
      OR: [
        { sessions: { some: { OR: sessionOverlaps } } },
        { sessions: { none: {} }, OR: legacyOverlaps },
      ],
    };
    return tx.event.findFirst({
      where: {
        id: { in: registeredEventIds, not: event.id },
        status: { title: PUBLISHED_STATUS_TITLE },
        ...overlap,
      },
      select: { id: true },
    });
  }

  async findForRegistration(
    id: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const event = await tx.event.findUnique({
      where: { id },
      select: {
        id: true,
        capacity: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        sessions: { select: { startsAt: true, endsAt: true } },
        status: { select: { title: true } },
      },
    });
    return event;
  }
  async lockEventRow(
    tx: Prisma.TransactionClient,
    eventId: string,
  ): Promise<void> {
    await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;
  }

  publish(tx: Prisma.TransactionClient, eventId: string) {
    return tx.event.update({
      where: { id: eventId },
      data: { status: { connect: { title: PUBLISHED_STATUS_TITLE } } },
      select: { id: true },
    });
  }

  async loadSupportContext(
    tx: Prisma.TransactionClient,
    eventId: string,
  ): Promise<EventSupportContext | null> {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        votingDeadline: true,
        supportThreshold: true,
        status: { select: { title: true } },
        origin: { select: { title: true } },
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
      },
    });

    if (!event) return null;

    return mapSupportContext(event);
  }
}
