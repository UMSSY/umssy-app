"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isApiError } from "@/shared/services/api-client";
import { PageHeading } from "@/shared/components/layout";
import { ApplicantsTable } from "../components/applicants-table";
import { APPLICANTS_TEXT, RECRUITERS_HOME_ROUTE } from "../constants/job-offers.constants";
import { useJobOfferApplicants } from "../hooks/use-job-offer-applicants";
import type { JobOfferApplicantsViewProps } from "../types/job-offer-applicants-view-props.types";

const NOT_FOUND_STATUS = 404;

export function JobOfferApplicantsView({ jobOfferId }: JobOfferApplicantsViewProps) {
  const { data, error, isPending, isError, refetch } = useJobOfferApplicants(jobOfferId);
  const isNotFound = isApiError(error) && error.response?.status === NOT_FOUND_STATUS;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <Link
        href={RECRUITERS_HOME_ROUTE}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "max-md:min-h-11")}
      >
        <ArrowLeft aria-hidden="true" />
        {APPLICANTS_TEXT.back}
      </Link>

      <PageHeading
        title={APPLICANTS_TEXT.title}
        description={
          data ? `${data.jobTitle} · ${data.total} ${data.total === 1 ? "postulante" : "postulantes"}` : undefined
        }
      />

      {isPending ? (
        <div role="status" aria-label={APPLICANTS_TEXT.loading} className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          {isNotFound ? APPLICANTS_TEXT.notFound : APPLICANTS_TEXT.loadError}
          {!isNotFound ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="max-md:min-h-11"
              onClick={() => void refetch()}
            >
              {APPLICANTS_TEXT.retry}
            </Button>
          ) : null}
        </div>
      ) : data.applicants.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-text-secondary">
          {APPLICANTS_TEXT.empty}
        </p>
      ) : (
        <ApplicantsTable applicants={data.applicants} />
      )}
    </main>
  );
}
