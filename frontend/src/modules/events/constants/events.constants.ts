import type { EventFiltersPayload } from '../types/event-filters.types';

export const NO_EVENT_FILTERS: EventFiltersPayload = {
  search: '',
  categoryId: null,
};

export { REQUEST_TIMEOUT_MS } from '@/shared/constants/http.constants';
