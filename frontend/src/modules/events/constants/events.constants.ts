import type { EventFiltersPayload } from '../types/event-filters.types';

export const EVENTS_PAGE_SIZE = 50;

export const NO_EVENT_FILTERS: EventFiltersPayload = {
  search: '',
  categoryId: null,
};
export const SEARCH_MAX_LENGTH = 50;
export const SEARCH_DEBOUNCE_MS = 300;
export { REQUEST_TIMEOUT_MS } from '@/shared/constants/http.constants';
