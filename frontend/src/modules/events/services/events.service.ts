import { BEARER_PREFIX } from '@/shared/constants/auth.constants';
import { parseEventItem, parseEventDetail } from '../utils/event-response';
import { readRecord, readArray, readCount } from '../utils/response-validation';
import { apiClient } from '@/shared/services/api-client';
import { withOfflineSessionCopy } from '@/shared/services/storage/offline-session-copy';
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
    requireStorage = false,
  ): Promise<EventDetail> {
    return withOfflineSessionCopy(
      'event:' + id,
      accessToken,
      async () => {
        if (!apiClient.defaults.baseURL)
          throw new Error('La URL del backend no está configurada.');
        const response = await apiClient.get<{ data: EventDetail }>(
          `/events/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: accessToken
                ? `${BEARER_PREFIX}${accessToken}`
                : '',
            },
            signal,
            timeout: REQUEST_TIMEOUT_MS,
          },
        );
        return parseEventDetail(readRecord(response.data).data);
      },
      { signal, requireStorage },
    );
  },
  async getEvents(
    params: GetEventsParams,
    signal?: AbortSignal,
    accessToken: string | null = getAccessToken(),
    requireStorage = false,
  ): Promise<EventsListResponse> {
    const copyKey = JSON.stringify([
      params.page,
      params.limit,
      Boolean(params.includeProposals),
      params.search ?? '',
      params.categoryId ?? '',
      params.statusId ?? '',
      ...(params.sort ? [params.sort] : []),
    ]);
    return withOfflineSessionCopy(
      'events:' + copyKey,
      accessToken,
      async () => {
        if (!apiClient.defaults.baseURL) {
          throw new Error('La URL del backend no está configurada.');
        }

        const response = await apiClient.get<{
          data: { items: EventItem[] };
          page: number;
          offset: number;
        }>('/events', {
          headers: {
            Authorization: accessToken ? `${BEARER_PREFIX}${accessToken}` : '',
          },
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
          ...(typeof data.isProfileComplete === 'boolean' && {
            isProfileComplete: data.isProfileComplete,
          }),
        };
      },
      { signal, requireStorage },
    );
  },
};
