import type { EventSort } from './event-sort.types';
import type { EventCatalogScope } from './event-catalog-scope.types';

export interface EventFiltersPayload {
  search: string;
  categoryId: string | null;
  sort?: EventSort;
  statusId?: string;
  scope?: EventCatalogScope;
}