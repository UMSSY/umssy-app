import type { JobFeedFilters as JobFeedFiltersValue } from "./job-feed-filters.types";

export interface JobFeedFiltersProps {
  filters: JobFeedFiltersValue;
  onChange: (filters: JobFeedFiltersValue) => void;
  onClear: () => void;
}
