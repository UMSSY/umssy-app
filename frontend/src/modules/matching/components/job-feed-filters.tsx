"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { JOB_FEED_MESSAGES, JOB_FEED_MODALITIES } from "../constants/job-matching.constants";
import type { JobFeedFilters as JobFeedFiltersValue } from "../types/job-feed-filters.types";
import { hasActiveFilters } from "../utils/filter-recommended-jobs";

interface JobFeedFiltersProps {
  filters: JobFeedFiltersValue;
  onChange: (filters: JobFeedFiltersValue) => void;
  onClear: () => void;
}

export function JobFeedFilters({ filters, onChange, onClear }: JobFeedFiltersProps) {
  return (
    <div
      role="search"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 md:flex-row md:items-center"
    >
      <div className="relative md:max-w-sm md:flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder={JOB_FEED_MESSAGES.searchLabel}
          aria-label={JOB_FEED_MESSAGES.searchLabel}
          className="h-9 pl-9"
        />
      </div>

      <NativeSelect
        value={filters.modality ?? ""}
        onChange={(event) => onChange({ ...filters, modality: event.target.value || null })}
        aria-label={JOB_FEED_MESSAGES.modalityLabel}
        className="w-full md:w-48"
      >
        <NativeSelectOption value="">{JOB_FEED_MESSAGES.allModalities}</NativeSelectOption>
        {JOB_FEED_MODALITIES.map((modality) => (
          <NativeSelectOption key={modality} value={modality}>
            {modality}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <Label htmlFor="job-feed-high-affinity" className="text-ink">
        <Checkbox
          id="job-feed-high-affinity"
          checked={filters.onlyHighAffinity}
          onCheckedChange={(checked) => onChange({ ...filters, onlyHighAffinity: checked })}
        />
        {JOB_FEED_MESSAGES.onlyHighAffinity}
      </Label>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={!hasActiveFilters(filters)}
        className="font-semibold md:ml-auto"
      >
        {JOB_FEED_MESSAGES.clear}
      </Button>
    </div>
  );
}
