"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApplicationsMobileList } from "../components/applications-mobile-list";
import { ApplicationsStatusTabs } from "../components/applications-status-tabs";
import { ApplicationsTable } from "../components/applications-table";
import { WithdrawApplicationDialog } from "../components/withdraw-application-dialog";
import { APPLICATION_MESSAGES, VACANCIES_ROUTE } from "../constants/application.constants";
import { useMyApplications } from "../hooks/use-my-applications";
import { useWithdrawApplication } from "../hooks/use-withdraw-application";
import type { Application } from "../types/application.types";
import type { ApplicationSort, ApplicationStatusFilter } from "../types/application-list.types";
import { filterApplicationsByStatus } from "../utils/filter-applications-by-status";
import { nextApplicationSort, sortApplications } from "../utils/sort-applications";

export function ApplicationsView() {
  const { data, isPending, isError, refetch } = useMyApplications();
  const { withdraw, withdrawingId, hasWithdrawError } = useWithdrawApplication();
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>("all");
  const [sort, setSort] = useState<ApplicationSort | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<Application | null>(null);

  const visibleApplications = useMemo(
    () => sortApplications(filterApplicationsByStatus(data ?? [], statusFilter), sort),
    [data, statusFilter, sort],
  );

  const requestWithdraw = (applicationId: string) => {
    setPendingWithdrawal(data?.find((application) => application.id === applicationId) ?? null);
  };

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
        <>
          <ApplicationsStatusTabs value={statusFilter} onValueChange={setStatusFilter} />

          {visibleApplications.length === 0 && (
            <p className="text-sm text-text-secondary">{APPLICATION_MESSAGES.noApplicationsInStatus}</p>
          )}

          {visibleApplications.length > 0 &&
            (isMobile ? (
              <ApplicationsMobileList
                applications={visibleApplications}
                withdrawingId={withdrawingId}
                onWithdraw={requestWithdraw}
              />
            ) : (
              <ApplicationsTable
                applications={visibleApplications}
                withdrawingId={withdrawingId}
                onWithdraw={requestWithdraw}
                sort={sort}
                onSortChange={(key) => setSort((current) => nextApplicationSort(current, key))}
              />
            ))}
        </>
      )}

      <WithdrawApplicationDialog
        application={pendingWithdrawal}
        onCancel={() => setPendingWithdrawal(null)}
        onConfirm={(applicationId) => {
          setPendingWithdrawal(null);
          withdraw(applicationId);
        }}
      />
    </section>
  );
}
