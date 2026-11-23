"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { ApplicationsMobileList } from "../components/applications-mobile-list";
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
import { excludeWithdrawnApplications } from "../utils/exclude-withdrawn-applications";
import { sortApplications } from "../utils/sort-applications";

export function ApplicationsView() {
  const { data, isPending, isError, refetch } = useMyApplications();
  const { withdraw, retryWithdraw, withdrawingId, hasWithdrawError } = useWithdrawApplication();
  const { reactivate, resetReactivation, reactivatingId, hasReactivateError } = useReactivateApplication();
  const { contact, contactingId } = useContactApplication();
  const isMobile = useIsMobile();
  const [sort, setSort] = useState<ApplicationSort | null>(null);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<Application | null>(null);
  const [pendingReactivation, setPendingReactivation] = useState<Application | null>(null);
  const [showWithdrawn, setShowWithdrawn] = useState(false);

  const withdrawnCount = useMemo(
    () => (data ?? []).filter((application) => application.status === WITHDRAWN_STATUS).length,
    [data],
  );


  const viewingWithdrawn = showWithdrawn && withdrawnCount > 0;

  const visibleApplications = useMemo(() => {
    const listed = viewingWithdrawn
      ? (data ?? []).filter((application) => application.status === WITHDRAWN_STATUS)
      : excludeWithdrawnApplications(data ?? []);
    return sortApplications(listed, sort);
  }, [data, viewingWithdrawn, sort]);

  const handleShowWithdrawnChange = (pressed: boolean) => {
    setShowWithdrawn(pressed);
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
          <div className="flex flex-wrap items-center gap-3">
            {withdrawnCount > 0 && (
              <ShowWithdrawnToggle pressed={viewingWithdrawn} onPressedChange={handleShowWithdrawnChange} />
            )}
            <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
              <span className="shrink-0 text-sm text-text-secondary">Ordenar:</span>
              <Select
                items={APPLICATION_SORT_OPTIONS}
                value={sort ? `${sort.key}:${sort.direction}` : "date:desc"}
                onValueChange={(value) => {
                  const option = APPLICATION_SORT_OPTIONS.find((item) => item.value === value);
                  if (option) setSort({ key: option.key, direction: option.direction });
                }}
              >
                <SelectTrigger aria-label="Ordenar postulaciones" className="flex-1 bg-surface sm:w-[210px] sm:flex-none">
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
              {viewingWithdrawn
                ? APPLICATION_MESSAGES.noWithdrawnApplications
                : APPLICATION_MESSAGES.noActiveApplications}
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
          reactivate(pendingReactivation.id, {
            onSuccess: () => {
              setPendingReactivation(null);
              
              if (showWithdrawn && withdrawnCount <= 1) {
                setShowWithdrawn(false);
              }
            },
          });
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
