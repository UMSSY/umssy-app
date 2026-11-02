// @vitest-environment node
import { describe, expect, it } from "vitest";
import { EMPTY_JOB_FEED_FILTERS } from "../constants/job-matching.constants";
import type { RecommendedJob } from "../types/job-matching.types";
import { filterRecommendedJobs, hasActiveFilters } from "./filter-recommended-jobs";

function buildJob(overrides: Partial<RecommendedJob>): RecommendedJob {
  return {
    jobOfferId: "job",
    title: "Vacante",
    companyName: "Empresa",
    modality: "Remoto",
    score: 50,
    matchedSkills: [],
    skills: [],
    ...overrides,
  };
}

const JOBS: RecommendedJob[] = [
  buildJob({ jobOfferId: "devops", title: "DevOps Senior", companyName: "TechBolivia", modality: "Remoto", score: 92, skills: ["Docker", "Terraform"] }),
  buildJob({ jobOfferId: "backend", title: "Backend Developer", companyName: "Sofía Corp", modality: "Híbrido", score: 77, skills: ["Node.js", "PostgreSQL"] }),
  buildJob({ jobOfferId: "qa", title: "QA Automation Engineer", companyName: "Quantex", modality: "Híbrido", score: 70, skills: ["Cypress"] }),
  buildJob({ jobOfferId: "data", title: "Data Analyst Jr.", companyName: "Sofía Corp", modality: "Presencial", score: 41, skills: ["SQL"] }),
];

function ids(jobs: RecommendedJob[]): string[] {
  return jobs.map((job) => job.jobOfferId);
}

describe("filterRecommendedJobs", () => {
  it("returns every job in the same order when no filter is active", () => {
    expect(ids(filterRecommendedJobs(JOBS, EMPTY_JOB_FEED_FILTERS))).toEqual(["devops", "backend", "qa", "data"]);
  });

  it("searches by title, company or required skill ignoring case and accents", () => {
    const search = (value: string) => ids(filterRecommendedJobs(JOBS, { ...EMPTY_JOB_FEED_FILTERS, search: value }));

    expect(search("devops")).toEqual(["devops"]);
    expect(search("sofia corp")).toEqual(["backend", "data"]);
    expect(search("  CYPRESS ")).toEqual(["qa"]);
  });

  it("filters by modality without depending on accents", () => {
    const result = filterRecommendedJobs(JOBS, { ...EMPTY_JOB_FEED_FILTERS, modality: "Hibrido" });

    expect(ids(result)).toEqual(["backend", "qa"]);
  });

  it("keeps only jobs at or above the high affinity threshold", () => {
    const result = filterRecommendedJobs(JOBS, { ...EMPTY_JOB_FEED_FILTERS, onlyHighAffinity: true });

    expect(ids(result)).toEqual(["devops", "backend", "qa"]);
  });

  it("combines filters and keeps the affinity order", () => {
    const result = filterRecommendedJobs(JOBS, {
      search: "sofia",
      modality: "Híbrido",
      onlyHighAffinity: true,
    });

    expect(ids(result)).toEqual(["backend"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterRecommendedJobs(JOBS, { ...EMPTY_JOB_FEED_FILTERS, search: "cobol" })).toEqual([]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filters", () => {
    expect(hasActiveFilters(EMPTY_JOB_FEED_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_JOB_FEED_FILTERS, search: "   " })).toBe(false);
  });

  it("is true when any filter is set", () => {
    expect(hasActiveFilters({ ...EMPTY_JOB_FEED_FILTERS, search: "qa" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_JOB_FEED_FILTERS, modality: "Remoto" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_JOB_FEED_FILTERS, onlyHighAffinity: true })).toBe(true);
  });
});
