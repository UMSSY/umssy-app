import { parseEventItem, parseEventDetail } from '../utils/event-response';
import { readRecord, readArray, readCount } from '../utils/response-validation';
import { apiClient } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import type {
  EventItem,
  EventsListResponse,
  GetEventsParams,
} from '../types/event.types';

import type { EventDetail } from '../types/event-detail.types';

import { REQUEST_TIMEOUT_MS } from '../constants/events.constants';

export const eventsService = {
  async getEvent(
    id: string,
    signal?: AbortSignal,
    accessToken: string | null = getAccessToken(),
  ): Promise<EventDetail> {
    if (!apiClient.defaults.baseURL)
      throw new Error('La URL del backend no está configurada.');
    const response = await apiClient.get<{ data: EventDetail }>(
      `/events/${encodeURIComponent(id)}`,
      {
        headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' },
        signal,
        timeout: REQUEST_TIMEOUT_MS,
      },
    );
    return parseEventDetail(readRecord(response.data).data);
  },
  async getEvents(
    params: GetEventsParams,
    signal?: AbortSignal,
    accessToken: string | null = getAccessToken(),
  ): Promise<EventsListResponse> {
    if (!apiClient.defaults.baseURL) {
      throw new Error('La URL del backend no está configurada.');
    }

    const response = await apiClient.get<{
      data: { items: EventItem[] };
      page: number;
      offset: number;
    }>('/events', {
      headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' },
      params,
      signal,
      timeout: REQUEST_TIMEOUT_MS,
    });

    const body = readRecord(response.data);
    const data = readRecord(body.data);
    return {
      data: readArray(data.items).map(parseEventItem),
      page: readCount(body.page),
      offset: readCount(body.offset),
    };
  },
};
