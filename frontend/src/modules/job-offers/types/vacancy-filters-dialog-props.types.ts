import type { JobOfferFilters } from "./job-offer-filters.types";

export interface VacancyFiltersDialogProps {
  filters: JobOfferFilters;
  onChange: <K extends keyof JobOfferFilters>(key: K, value: JobOfferFilters[K]) => void;
  onReset: () => void;
  showStatusFilter?: boolean;
}
