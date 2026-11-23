import type { EventSort } from './event-sort.types';

export interface EventFiltersPayload {
  search: string;
  categoryId: string | null;
  sort?: EventSort;
  statusId?: string;
}