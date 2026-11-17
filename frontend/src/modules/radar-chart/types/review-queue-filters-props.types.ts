import type { ReviewQueueFilter } from './review-queue-filter.types';

export interface ReviewQueueFiltersProps {
  activeFilter: ReviewQueueFilter;
  onFilterChange: (filter: ReviewQueueFilter) => void;
}
