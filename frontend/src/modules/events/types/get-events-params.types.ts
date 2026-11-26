import type { EventSort } from './event-sort.types';
import type { EventCatalogScope } from './event-catalog-scope.types';

export interface GetEventsParams {
  includeProposals?: boolean;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  sort?: EventSort;
  statusId?: string;
  scope?: EventCatalogScope;
}
