"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBreadcrumb } from "@/shared/components/layout";
import { JobRecommendationCard } from "../components/job-recommendation-card";
import { JobsEmptyState } from "../components/jobs-empty-state";
import { RecommendedJobsFilters } from "../components/recommended-jobs-filters";
import {
  JOB_MATCHING_MESSAGES,
  RECOMMENDED_JOBS_BREADCRUMB,
} from "../constants/job-matching.constants";
import { useRecommendedJobs } from "../hooks/use-recommended-jobs";
import {
  DEFAULT_FILTERS,
  filterRecommendedJobs,
  getModalityOptions,
  type RecommendedJobsFilters as Filters,
} from "../utils/filter-recommended-jobs";

const SKELETON_CARDS = ["a", "b", "c", "d"];

export function RecommendedJobsView() {
  const { data, isPending, isError, refetch } = useRecommendedJobs();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const items = data?.items ?? [];
  const visibleJobs = filterRecommendedJobs(items, filters);
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <PageBreadcrumb items={RECOMMENDED_JOBS_BREADCRUMB} />
        <h1 className="font-tight text-3xl font-extrabold text-ink">
          {JOB_MATCHING_MESSAGES.pageTitle}
        </h1>
        <p className="text-base text-text-secondary">
          {JOB_MATCHING_MESSAGES.pageDescription}
        </p>
      </header>

      {isPending && (
        <div aria-busy="true" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {SKELETON_CARDS.map((id) => (
            <Skeleton key={id} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="flex max-w-xl flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4"
        >
          <p className="text-sm font-bold text-danger">{JOB_MATCHING_MESSAGES.loadError}</p>
          <Button
            variant="outline"
            onClick={() => {
              void refetch();
            }}
          >
            {JOB_MATCHING_MESSAGES.retry}
          </Button>
        </div>
      )}

      {data && !data.isProfileComplete && <JobsEmptyState variant="incomplete-profile" />}

      {data && data.isProfileComplete && items.length === 0 && (
        <JobsEmptyState variant="no-matches" />
      )}

      {items.length > 0 && (
        <>
          <aside className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-ink-soft">
            <strong className="font-semibold text-ink">
              {JOB_MATCHING_MESSAGES.scoreInfoTitle}
            </strong>{" "}
            {JOB_MATCHING_MESSAGES.scoreInfoText}
          </aside>

          <RecommendedJobsFilters
            filters={filters}
            modalities={getModalityOptions(items)}
            onChange={setFilters}
            onClear={clearFilters}
          />

          {visibleJobs.length === 0 ? (
            <div
              role="status"
              className="flex max-w-xl flex-col items-start gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-8"
            >
              <h2 className="font-tight text-lg font-bold text-ink">
                {JOB_MATCHING_MESSAGES.noFilterResultsTitle}
              </h2>
              <p className="text-sm text-text-secondary">
                {JOB_MATCHING_MESSAGES.noFilterResultsText}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {visibleJobs.map((job) => (
                <li key={job.jobOfferId}>
                  <JobRecommendationCard job={job} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
