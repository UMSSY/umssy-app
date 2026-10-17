"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { JOB_MATCHING_MESSAGES } from "../constants/job-matching.constants";
import { ALL_MODALITIES, type RecommendedJobsFilters } from "../utils/filter-recommended-jobs";

interface RecommendedJobsFiltersProps {
  filters: RecommendedJobsFilters;
  modalities: string[];
  onChange: (filters: RecommendedJobsFilters) => void;
  onClear: () => void;
}

const SEARCH_ID = "recommended-jobs-search";
const MODALITY_ID = "recommended-jobs-modality";
const HIGH_AFFINITY_ID = "recommended-jobs-high-affinity";

export function RecommendedJobsFilters({
  filters,
  modalities,
  onChange,
  onClear,
}: RecommendedJobsFiltersProps) {
  return (
    <div
      role="search"
      aria-label={JOB_MATCHING_MESSAGES.filtersLabel}
      className="flex flex-wrap items-center gap-x-4 gap-y-3"
    >
      <div className="relative w-full sm:w-64">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <Label htmlFor={SEARCH_ID} className="sr-only">
          {JOB_MATCHING_MESSAGES.searchLabel}
        </Label>
        <Input
          id={SEARCH_ID}
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder={JOB_MATCHING_MESSAGES.searchPlaceholder}
          className="pl-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor={MODALITY_ID} className="text-sm font-semibold text-ink">
          {JOB_MATCHING_MESSAGES.modalityLabel}:
        </Label>
        <NativeSelect
          id={MODALITY_ID}
          value={filters.modality}
          onChange={(event) => onChange({ ...filters, modality: event.target.value })}
        >
          <NativeSelectOption value={ALL_MODALITIES}>
            {JOB_MATCHING_MESSAGES.allOptions}
          </NativeSelectOption>
          {modalities.map((modality) => (
            <NativeSelectOption key={modality} value={modality}>
              {modality}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={HIGH_AFFINITY_ID}
          checked={filters.highAffinityOnly}
          onCheckedChange={(checked) => onChange({ ...filters, highAffinityOnly: checked })}
        />
        <Label htmlFor={HIGH_AFFINITY_ID} className="text-sm font-semibold text-ink">
          {JOB_MATCHING_MESSAGES.highAffinityLabel}
        </Label>
      </div>

      <Button type="button" variant="link" className="h-auto p-0 text-ink" onClick={onClear}>
        {JOB_MATCHING_MESSAGES.clearFilters}
      </Button>
    </div>
  );
}
