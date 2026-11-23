import type { EventFiltersPayload } from '../types/event-filters.types';

export const NO_EVENT_FILTERS: EventFiltersPayload = {
  search: '',
  categoryId: null,
};

export const DEFAULT_EVENT_SORT = 'recommended' as const;
export const POPULAR_EVENT_SORT = 'popular' as const;
export const POPULAR_FILTER_LABEL = 'Populares';

export { REQUEST_TIMEOUT_MS } from '@/shared/constants/http.constants';
