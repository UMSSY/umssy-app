import { normalizeSearchText } from "@/shared/utils/normalize-search-text";
import { HIGH_AFFINITY_THRESHOLD } from "../constants/job-matching.constants";
import type { JobFeedFilters } from "../types/job-feed-filters.types";
import type { RecommendedJob } from "../types/job-matching.types";

export const ALL_MODALITIES = "ALL" as const;

export interface RecommendedJobsFilters {
  search: string;
  modality: string;
  onlyHighAffinity?: boolean;
  highAffinityOnly?: boolean;
}

export const DEFAULT_FILTERS: RecommendedJobsFilters = {
  search: "",
  modality: ALL_MODALITIES,
  onlyHighAffinity: false,
};

function matchesSearch(job: RecommendedJob, search: string): boolean {
  const term = normalizeSearchText(search);
  if (!term) return true;
  const fields = [job.title, job.companyName, ...(job.skills ?? [])];
  return fields.some((field) => normalizeSearchText(field).includes(term));
}

function matchesModality(job: RecommendedJob, modality: string | null): boolean {
  if (!modality || modality === ALL_MODALITIES) return true;
  return normalizeSearchText(job.modality) === normalizeSearchText(modality);
}

export function filterRecommendedJobs(
  jobs: readonly RecommendedJob[],
  filters: JobFeedFilters | RecommendedJobsFilters,
): RecommendedJob[] {
  const onlyHigh = "onlyHighAffinity" in filters ? filters.onlyHighAffinity : filters.highAffinityOnly;
  return jobs.filter(
    (job) =>
      matchesSearch(job, filters.search) &&
      matchesModality(job, filters.modality) &&
      (!onlyHigh || job.score >= HIGH_AFFINITY_THRESHOLD),
  );
}

export function hasActiveFilters(filters: JobFeedFilters | RecommendedJobsFilters): boolean {
  const onlyHigh = "onlyHighAffinity" in filters ? filters.onlyHighAffinity : filters.highAffinityOnly;
  return (
    filters.search.trim() !== "" ||
    (filters.modality !== null && filters.modality !== ALL_MODALITIES) ||
    Boolean(onlyHigh)
  );
}