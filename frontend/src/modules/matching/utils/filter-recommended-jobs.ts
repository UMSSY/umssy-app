import { normalizeSearchText } from "@/shared/utils/normalize-search-text";
import { HIGH_AFFINITY_THRESHOLD } from "../constants/job-matching.constants";
import type { JobFeedFilters } from "../types/job-feed-filters.types";
import type { RecommendedJob } from "../types/job-matching.types";

function matchesSearch(job: RecommendedJob, search: string): boolean {
  const term = normalizeSearchText(search);
  if (!term) return true;
  const fields = [job.title, job.companyName, ...job.skills];
  return fields.some((field) => normalizeSearchText(field).includes(term));
}

function matchesModality(job: RecommendedJob, modality: string | null): boolean {
  if (!modality) return true;
  return normalizeSearchText(job.modality) === normalizeSearchText(modality);
}

export function filterRecommendedJobs(
  jobs: readonly RecommendedJob[],
  filters: JobFeedFilters,
): RecommendedJob[] {
  return jobs.filter(
    (job) =>
      matchesSearch(job, filters.search) &&
      matchesModality(job, filters.modality) &&
      (!filters.onlyHighAffinity || job.score >= HIGH_AFFINITY_THRESHOLD),
  );
}

export function hasActiveFilters(filters: JobFeedFilters): boolean {
  return filters.search.trim() !== "" || filters.modality !== null || filters.onlyHighAffinity;
}
