"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationsTable } from "../components/applications-table";
import { APPLICATION_MESSAGES, VACANCIES_ROUTE } from "../constants/application.constants";
import { useMyApplications } from "../hooks/use-my-applications";
import { useWithdrawApplication } from "../hooks/use-withdraw-application";

export function ApplicationsView() {
  const { data, isPending, isError, refetch } = useMyApplications();
  const { withdraw, withdrawingId, hasWithdrawError } = useWithdrawApplication();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <h1 className="font-tight text-3xl font-bold text-ink">{APPLICATION_MESSAGES.pageTitle}</h1>

      {isPending && <Skeleton aria-busy="true" className="h-40 rounded-xl" />}

      {isError && (
        <div role="alert" className="flex max-w-xl flex-col items-start gap-3 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-ink">{APPLICATION_MESSAGES.loadError}</p>
          <Button
            variant="outline"
            onClick={() => {
              void refetch();
            }}
          >
            {APPLICATION_MESSAGES.retry}
          </Button>
        </div>
      )}

      {hasWithdrawError && (
        <p role="alert" className="text-sm text-destructive">
          {APPLICATION_MESSAGES.withdrawError}
        </p>
      )}

      {data && data.length === 0 && (
        <div className="flex max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">{APPLICATION_MESSAGES.emptyTitle}</p>
          <Link href={VACANCIES_ROUTE} className={buttonVariants({ size: "lg" })}>
            {APPLICATION_MESSAGES.exploreVacancies}
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <ApplicationsTable applications={data} withdrawingId={withdrawingId} onWithdraw={withdraw} />
      )}
    </section>
  );
}
