import {
  readRecord,
  readArray,
  readString,
} from '@/shared/utils/response-validation';
import type { EventCategoryItem } from '../types/event-category-item.types';
import { apiClient } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { withOfflineSessionCopy } from '@/shared/services/storage/offline-session-copy';

import { REQUEST_TIMEOUT_MS } from '@/shared/constants/http.constants';

export const eventCategoriesService = {
  async getAll(
    signal?: AbortSignal,
    token = getAccessToken(),
    requireStorage = false,
  ): Promise<EventCategoryItem[]> {
    return withOfflineSessionCopy(
      'event-categories',
      token,
      async () => {
        if (!apiClient.defaults.baseURL) {
          throw new Error('La URL del backend no está configurada.');
        }

        const response = await apiClient.get<{
          data: { items: EventCategoryItem[] };
        }>('/event-categories', {
          params: { page: 1, limit: 50 },
          timeout: REQUEST_TIMEOUT_MS,
          signal,
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });

        return readArray(readRecord(readRecord(response.data).data).items).map(
          (value) => {
            const category = readRecord(value);
            return {
              id: readString(category.id),
              name: readString(category.name),
            };
          },
        );
      },
      { signal, requireStorage },
    );
  },
};
