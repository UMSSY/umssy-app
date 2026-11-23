import type { EventSort } from './event-sort.types';

export interface GetEventsParams {
  includeProposals?: boolean;
  isPublishedOnly?: boolean;
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  sort?: EventSort;
  statusId?: string;
}