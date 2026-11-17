import { Injectable } from '@nestjs/common';
import { mapEventsToListResponse } from '../mappers/events.mapper.js';
import type { EventsListResponse } from '../types/events.types.js';
import type { GetEventsPayload } from '../types/get-events-payload.types.js';
import { rankEventsByPopularity } from '../utils/rank-events-by-popularity.js';
import { EventsService } from './events.service.js';

@Injectable()
export class EventsCatalogService {
  constructor(private readonly eventsService: EventsService) {}

  async findAll(
    payload: GetEventsPayload,
    userId?: string,
  ): Promise<EventsListResponse> {
    if (payload.sort !== 'popular')
      return this.eventsService.findAll(payload, userId);

    await this.eventsService.expireOverdueProposals(new Date());
    const { page, limit, categoryId, statusId, search } = payload;
    const { items } = await this.eventsService.findAndCount({
      categoryId,
      statusId,
      isPublishedOnly: statusId === undefined,
      ...(payload.includeProposals && { includeProposals: true }),
      search,
      userId,
    });
    const offset = (page - 1) * limit;
    const ranked = rankEventsByPopularity(items);

    return mapEventsToListResponse(
      ranked.slice(offset, offset + limit),
      ranked.length,
      page,
      limit,
    );
  }
}
