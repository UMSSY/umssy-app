import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { EventNotFoundException } from '../exceptions/event-not-found.exception.js';
import { EventsRepository } from '../repositories/events.repository.js';
import { mapEventsToListResponse } from '../mappers/events.mapper.js';
import { mapEventDetailToResponse } from '../mappers/event-detail.mapper.js';
import type { GetEventsPayload } from '../types/get-events-payload.types.js';
import type { EventDetailResponse, EventsListResponse, FindEventsPayload } from '../types/events.types.js';

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  async findAll(payload: GetEventsPayload, userId?: string): Promise<EventsListResponse> {
    await this.expireOverdueProposals(new Date());
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
    await this.expireOverdueProposals(new Date());
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
