import { Injectable } from '@nestjs/common';
import { EventsRepository } from '../repositories/events.repository.js';
import { mapEventsToListResponse } from '../mappers/events.mapper.js';
import type { GetEventsPayload } from '../requests/get-events.request.js';
import type { EventsListResponse } from '../types/events.types.js';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async findAll(payload: GetEventsPayload): Promise<EventsListResponse> {
    const { page, limit, categoryId, statusId, search } = payload;
    const offset = (page - 1) * limit;

    const { items, total } = await this.eventsRepository.findAndCount({
      categoryId,
      statusId,
      search,
      skip: offset,
      take: limit,
    });

    return mapEventsToListResponse(items, total, page, limit);
  }
}
