import { Injectable } from '@nestjs/common';
import { mapEventsToListResponse } from '../mappers/events.mapper.js';
import { EventAffinitySignalsService } from './event-affinity-signals.service.js';
import type {
  EventWithRelations,
  EventsListResponse,
} from '../types/events.types.js';
import type { GetEventsPayload } from '../types/get-events-payload.types.js';
import { rankEventsByAffinity } from '../utils/rank-events-by-affinity.js';
import { rankEventsByPopularity } from '../utils/rank-events-by-popularity.js';
import { hasAffinitySignals } from '../utils/score-event-affinity.js';
import { EventsService } from './events.service.js';

@Injectable()
export class EventsCatalogService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly affinitySignals: EventAffinitySignalsService,
  ) {}

  async findAll(
    payload: GetEventsPayload,
    userId?: string,
  ): Promise<EventsListResponse> {
    if (payload.scope === 'finished' && payload.statusId === undefined)
      return this.eventsService.findAll(payload, userId);
    if (payload.sort === 'popular')
      return this.paginate(
        rankEventsByPopularity(await this.findCatalog(payload, userId)),
        payload,
      );
    if (payload.sort !== 'recommended' || !userId)
      return this.eventsService.findAll(payload, userId);

    const [signals, events] = await Promise.all([
      this.affinitySignals.findByUserId(userId),
      this.findCatalog(payload, userId),
    ]);
    if (!hasAffinitySignals(signals))
      return this.withProfileState(
        this.paginate(rankEventsByPopularity(events), payload),
        false,
      );

    const ranked = rankEventsByAffinity(events, signals);
    const response = this.paginate(
      ranked.map(({ event }) => event),
      payload,
    );
    const offset = (payload.page - 1) * payload.limit;
    return this.withProfileState(
      {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map((item, index) => ({
            ...item,
            recommendation: ranked[offset + index].recommendation,
          })),
        },
      },
      true,
    );
  }

  private async findCatalog(
    payload: GetEventsPayload,
    userId?: string,
  ): Promise<EventWithRelations[]> {
    const { categoryId, statusId, search } = payload;
    const { items } = await this.eventsService.findAndCount({
      categoryId,
      statusId,
      ...(payload.includeProposals && { includeProposals: true }),
      search,
      userId,
      visibility: this.eventsService.getCatalogVisibilityFilter(payload),
    });
    return items;
  }

  private paginate(
    events: EventWithRelations[],
    { page, limit }: GetEventsPayload,
  ): EventsListResponse {
    const offset = (page - 1) * limit;
    return mapEventsToListResponse(
      events.slice(offset, offset + limit),
      events.length,
      page,
      limit,
    );
  }

  private withProfileState(
    response: EventsListResponse,
    isProfileComplete: boolean,
  ): EventsListResponse {
    return { ...response, data: { ...response.data, isProfileComplete } };
  }
}
