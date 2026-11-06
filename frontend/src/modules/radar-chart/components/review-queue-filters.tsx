import { Button } from "@/components/ui/button";
import { REVIEW_QUEUE_FILTERS } from "../data/review-queue.data";
import type { ReviewQueueFilter } from "../types/review-queue.types";

interface ReviewQueueFiltersProps {
  activeFilter: ReviewQueueFilter;
  onFilterChange: (filter: ReviewQueueFilter) => void;
}

export function ReviewQueueFilters({
  activeFilter,
  onFilterChange,
}: ReviewQueueFiltersProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {REVIEW_QUEUE_FILTERS.map((filter) => {
        const isActive = activeFilter === filter;

        return (
          <Button
            key={filter}
            type="button"
            variant="ghost"
            aria-pressed={isActive}
            onClick={() => onFilterChange(filter)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-accent/30 bg-interaction text-accent"
                : "border-border bg-surface text-text-secondary hover:bg-surface-soft hover:text-ink"
            }`}
          >
            {filter}
          </Button>
        );
      })}
    </div>
  );
}