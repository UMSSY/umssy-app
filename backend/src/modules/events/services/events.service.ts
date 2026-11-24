import type { RegistrationScheduleEvent } from '../types/registration-schedule-event.types.js';
import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import type { FinishedEventThreshold } from '../types/finished-event-threshold.types.js';
import {
  FINISHED_STATUS_TITLE,
  PUBLISHED_STATUS_TITLE,
} from '../constants/events.constants.js';
import { getScheduleEnd } from '../utils/event-session-schedule.js';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { EventNotFoundException } from '../exceptions/event-not-found.exception.js';
import { EventsRepository } from '../repositories/events.repository.js';
import { mapEventsToListResponse } from '../mappers/events.mapper.js';
import { mapEventDetailToResponse } from '../mappers/event-detail.mapper.js';
import { mapManagedWorkshops } from '../mappers/managed-workshops.mapper.js';
import type { ManagedWorkshopResponse } from '../types/managed-workshop-response.types.js';
import type { GetEventsPayload } from '../types/get-events-payload.types.js';
import type {
  EventDetailResponse,
  EventsListResponse,
  FindEventsPayload,
} from '../types/events.types.js';

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  async findManaged(userId: string): Promise<ManagedWorkshopResponse[]> {
    const events = await this.repository.findManaged(userId);
    return mapManagedWorkshops(events);
  }

  findManagedWorkshop(
    eventId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.repository.findManagedWorkshop(eventId, userId, tx);
  }

  getFinishedEventThreshold(now: Date = new Date()): FinishedEventThreshold {
    const localNow = new Date(now.getTime() + BOLIVIA_OFFSET_MS);
    return {
      eventDate: new Date(
        Date.UTC(
          localNow.getUTCFullYear(),
          localNow.getUTCMonth(),
          localNow.getUTCDate(),
        ),
      ),
      endTime: new Date(
        Date.UTC(
          1970,
          0,
          1,
          localNow.getUTCHours(),
          localNow.getUTCMinutes(),
          localNow.getUTCSeconds(),
          localNow.getUTCMilliseconds(),
        ),
      ),
    };
  }

  getActiveRegistrationEventFilter(
    now: Date = new Date(),
  ): Prisma.EventWhereInput {
    const threshold = this.getFinishedEventThreshold(now);
    return {
      status: { title: PUBLISHED_STATUS_TITLE },
      OR: [
        { sessions: { some: { endsAt: { gt: now } } } },
        {
          sessions: { none: {} },
          OR: [
            { eventDate: { gt: threshold.eventDate } },
            {
              eventDate: threshold.eventDate,
              endTime: { gt: threshold.endTime },
            },
          ],
        },
      ],
    };
  }

  // Un taller con sesiones finaliza al terminar su última sesión; sin sesiones se usa la fecha original.
  getFinishedEventFilter(now: Date = new Date()): Prisma.EventWhereInput {
    const threshold = this.getFinishedEventThreshold(now);
    return {
      status: {
        title: { in: [PUBLISHED_STATUS_TITLE, FINISHED_STATUS_TITLE] },
      },
      OR: [
        { sessions: { some: {}, none: { endsAt: { gt: now } } } },
        {
          sessions: { none: {} },
          OR: [
            { eventDate: { lt: threshold.eventDate } },
            {
              eventDate: threshold.eventDate,
              endTime: { lte: threshold.endTime },
            },
          ],
        },
      ],
    };
  }

  isFinished(
    event: Pick<
      RegistrationScheduleEvent,
      'eventDate' | 'endTime' | 'sessions'
    >,
    now: Date = new Date(),
  ): boolean {
    if (event.sessions?.length)
      return getScheduleEnd(event.sessions).getTime() <= now.getTime();
    const threshold = this.getFinishedEventThreshold(now);
    return (
      event.eventDate.getTime() < threshold.eventDate.getTime() ||
      (event.eventDate.getTime() === threshold.eventDate.getTime() &&
        event.endTime.getTime() <= threshold.endTime.getTime())
    );
  }

  async findAll(
    payload: GetEventsPayload,
    userId?: string,
  ): Promise<EventsListResponse> {
    const { page, limit, categoryId, statusId, search } = payload;
    const offset = (page - 1) * limit;

    const { items, total } = await this.findAndCount({
      categoryId,
      statusId,
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

    return mapEventDetailToResponse(event);
  }

  expireOverdueProposals(now: Date): Promise<number> {
    return this.repository.expireOverdueProposals(now);
  }

  findAndCount(payload: FindEventsPayload) {
    return this.repository.findAndCount(payload);
  }

  findById(id: string, userId?: string) {
    return this.repository.findById(id, userId);
  }

  async hasScheduleConflict(
    tx: Prisma.TransactionClient,
    event: RegistrationScheduleEvent,
    registeredEventIds: string[],
  ): Promise<boolean> {
    if (!registeredEventIds.length) return false;
    return Boolean(
      await this.repository.findScheduleConflict(tx, event, registeredEventIds),
    );
  }

  async findForRegistration(id: string, tx?: Prisma.TransactionClient) {
    const event = await this.repository.findForRegistration(id, tx);
    if (!event) throw new EventNotFoundException(id);
    return event;
  }
  lockEventRow(tx: Prisma.TransactionClient, eventId: string): Promise<void> {
    return this.repository.lockEventRow(tx, eventId);
  }

  loadSupportContext(tx: Prisma.TransactionClient, eventId: string) {
    return this.repository.loadSupportContext(tx, eventId);
  }

  publish(tx: Prisma.TransactionClient, eventId: string) {
    return this.repository.publish(tx, eventId);
  }
}
