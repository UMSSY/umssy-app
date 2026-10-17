import { HIGH_AFFINITY_THRESHOLD } from "../constants/job-matching.constants";
import type { RecommendedJob } from "../types/job-matching.types";

export interface RecommendedJobsFilters {
  search: string;
  modality: string;
  highAffinityOnly: boolean;
}

export const ALL_MODALITIES = "";

export const DEFAULT_FILTERS: RecommendedJobsFilters = {
  search: "",
  modality: ALL_MODALITIES,
  highAffinityOnly: false,
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function hasActiveFilters(filters: RecommendedJobsFilters): boolean {
  return (
    normalizeSearchText(filters.search).length > 0 ||
    filters.modality !== ALL_MODALITIES ||
    filters.highAffinityOnly
  );
}

export function getModalityOptions(jobs: RecommendedJob[]): string[] {
  return [...new Set(jobs.map((job) => job.modality))].sort((left, right) =>
    left.localeCompare(right, "es"),
  );
}

function matchesSearch(job: RecommendedJob, search: string): boolean {
  if (search.length === 0) return true;
  const haystack = [job.title, job.companyName, job.modality, ...job.skills]
    .map(normalizeSearchText)
    .join(" ");
  return haystack.includes(search);
}

export function filterRecommendedJobs(
  jobs: RecommendedJob[],
  filters: RecommendedJobsFilters,
): RecommendedJob[] {
  const search = normalizeSearchText(filters.search);

  return jobs.filter(
    (job) =>
      matchesSearch(job, search) &&
      (filters.modality === ALL_MODALITIES || job.modality === filters.modality) &&
      (!filters.highAffinityOnly || job.score >= HIGH_AFFINITY_THRESHOLD),
  );
}
