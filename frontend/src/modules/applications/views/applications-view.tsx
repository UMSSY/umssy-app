"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApplicationsMobileList } from "../components/applications-mobile-list";
import { ApplicationsStatusSelect } from "../components/applications-status-select";
import { ApplicationsTable } from "../components/applications-table";
import { ShowWithdrawnToggle } from "../components/show-withdrawn-toggle";
import { WithdrawApplicationDialog } from "../components/withdraw-application-dialog";
import { ReactivateApplicationDialog } from "../components/reactivate-application-dialog";
import { APPLICATION_MESSAGES, APPLICATION_SORT_OPTIONS, WITHDRAWN_STATUS } from "../constants/application.constants";
import { useContactApplication } from "../hooks/use-contact-application";
import { useMyApplications } from "../hooks/use-my-applications";
import { useWithdrawApplication } from "../hooks/use-withdraw-application";
import { useReactivateApplication } from "../hooks/use-reactivate-application";
import type { Application } from "../types/application.types";
import type { ApplicationSort } from "../types/application-sort.types";
import type { ApplicationStatusFilter } from "../types/application-status-filter.types";
import { excludeWithdrawnApplications } from "../utils/exclude-withdrawn-applications";
import { filterApplicationsByStatus } from "../utils/filter-applications-by-status";
import { sortApplications } from "../utils/sort-applications";

export function ApplicationsView() {
  const { data, isPending, isError, refetch } = useMyApplications();
  const { withdraw, retryWithdraw, withdrawingId, hasWithdrawError } = useWithdrawApplication();
  const { reactivate, resetReactivation, reactivatingId, hasReactivateError } = useReactivateApplication();
  const { contact, contactingId } = useContactApplication();
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusFilter>("all");
  const [sort, setSort] = useState<ApplicationSort | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<Application | null>(null);
  const [pendingReactivation, setPendingReactivation] = useState<Application | null>(null);
  const [showWithdrawn, setShowWithdrawn] = useState(false);

  const withdrawnCount = useMemo(
    () => (data ?? []).filter((application) => application.status === WITHDRAWN_STATUS).length,
    [data],
  );

  const visibleApplications = useMemo(() => {
    const listed = showWithdrawn ? (data ?? []) : excludeWithdrawnApplications(data ?? []);
    return sortApplications(filterApplicationsByStatus(listed, statusFilter), sort);
  }, [data, showWithdrawn, statusFilter, sort]);

  const handleShowWithdrawnChange = (pressed: boolean) => {
    setShowWithdrawn(pressed);
    if (!pressed && statusFilter === WITHDRAWN_STATUS) setStatusFilter("all");
  };

  const requestWithdraw = (applicationId: string) => {
    setPendingWithdrawal(data?.find((application) => application.id === applicationId) ?? null);
  };

  const requestReactivate = (applicationId: string) => {
    resetReactivation();
    setPendingReactivation(data?.find((application) => application.id === applicationId) ?? null);
  };

  const cancelReactivation = () => {
    resetReactivation();
    setPendingReactivation(null);
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
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
          <p>{APPLICATION_MESSAGES.withdrawError}</p>
          <Button variant="outline" size="sm" onClick={retryWithdraw}>
            {APPLICATION_MESSAGES.retry}
          </Button>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="flex max-w-xl flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
          <p className="text-sm text-text-secondary">{APPLICATION_MESSAGES.emptyTitle}</p>
          <Link href={"/vacancies"} className={buttonVariants({ size: "lg" })}>
            {APPLICATION_MESSAGES.exploreVacancies}
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <ApplicationsStatusSelect
                value={statusFilter}
                onValueChange={setStatusFilter}
                showWithdrawn={showWithdrawn}
              />
              {withdrawnCount > 0 && (
                <ShowWithdrawnToggle pressed={showWithdrawn} onPressedChange={handleShowWithdrawnChange} />
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-text-secondary">Ordenar:</span>
              <Select
                items={APPLICATION_SORT_OPTIONS}
                value={sort ? `${sort.key}:${sort.direction}` : "date:desc"}
                onValueChange={(value) => {
                  const option = APPLICATION_SORT_OPTIONS.find((item) => item.value === value);
                  if (option) setSort({ key: option.key, direction: option.direction });
                }}
              >
                <SelectTrigger aria-label="Ordenar postulaciones" className="w-[210px] max-w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {visibleApplications.length === 0 && (
            <p className="text-sm text-text-secondary">
              {statusFilter === "all"
                ? APPLICATION_MESSAGES.noActiveApplications
                : APPLICATION_MESSAGES.noApplicationsInStatus}
            </p>
          )}

          {visibleApplications.length > 0 &&
            (isMobile ? (
              <ApplicationsMobileList
                applications={visibleApplications}
                withdrawingId={withdrawingId}
                onWithdraw={requestWithdraw}
                contactingId={contactingId}
                onContact={contact}
                onReactivate={requestReactivate}
                reactivatingId={reactivatingId}
              />
            ) : (
              <ApplicationsTable
                applications={visibleApplications}
                withdrawingId={withdrawingId}
                onWithdraw={requestWithdraw}
                contactingId={contactingId}
                onContact={contact}
                onReactivate={requestReactivate}
                reactivatingId={reactivatingId}
              />
            ))}
        </>
      )}

      <ReactivateApplicationDialog
        application={pendingReactivation}
        isPending={reactivatingId !== null}
        hasError={hasReactivateError}
        onCancel={cancelReactivation}
        onConfirm={() => {
          if (!pendingReactivation || reactivatingId !== null) return;
          reactivate(pendingReactivation.id, { onSuccess: () => setPendingReactivation(null) });
        }}
      />
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
