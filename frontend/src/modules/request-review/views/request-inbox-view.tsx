"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InboxHeader } from "../components/layout/backoffice-page-header";
import { InboxFilters } from "../components/inbox/inbox-filters";
import { RequestPagination } from "../components/inbox/request-pagination";
import { RequestTable } from "../components/inbox/request-table";
import { REVIEW_TABS } from "../constants/request-review.constants";
import { useRequestList } from "../hooks/use-request-list";
import { useStatusCounts } from "../hooks/use-status-counts";
import type { ReviewStatus } from "../types/request-review.types";

const ALL_STATUSES: readonly ReviewStatus[] = REVIEW_TABS.map((tab) => tab.value);

export function RequestInboxView() {
  const list = useRequestList();
  const counts = useStatusCounts(ALL_STATUSES);

  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 [contain:inline-size]">
      <InboxHeader />

      <section className="flex w-full min-w-0 flex-col gap-6">
        <div className="relative w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border bg-surface px-4 py-3">
            <Tabs value={list.status} onValueChange={(value) => list.changeStatus(value as ReviewStatus)} className="max-w-full">
              <TabsList variant="line" className="max-w-full [scrollbar-width:none] gap-2 overflow-x-auto overflow-y-hidden p-0 group-data-horizontal/tabs:h-12 [&::-webkit-scrollbar]:hidden">
                {REVIEW_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-full flex-none px-4 text-base font-semibold text-text-secondary after:bg-accent group-data-horizontal/tabs:after:bottom-0 data-active:text-ink"
                  >
                    {tab.label}
                    {typeof counts[tab.value] === "number" && (
                      <span
                        className="ml-2 rounded-full bg-surface-soft px-2 text-xs font-semibold text-text-secondary"
                        aria-label={`${counts[tab.value]} solicitudes`}
                      >
                        {counts[tab.value]}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <InboxFilters
              search={list.searchInput}
              career={list.career}
              period={list.period}
              onSearchChange={list.changeSearch}
              onCareerChange={list.changeCareer}
              onPeriodChange={list.changePeriod}
            />
          </div>

          {list.error ? (
            <p role="alert" className="border-t border-border p-4 text-sm text-ink">
              {list.error}
            </p>
          ) : !list.isLoading && list.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border-t border-border p-8 text-center">
              <p className="text-sm text-text-secondary">
                {list.hasActiveFilters ? "No hay solicitudes que coincidan con los filtros." : "No hay solicitudes en este estado."}
              </p>
              {list.hasActiveFilters ? (
                <Button type="button" variant="brand" onClick={list.clearFilters} className="h-[34px] rounded-lg px-4 text-sm font-semibold">
                  Limpiar filtros
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="border-t border-border">
              <RequestTable items={list.items} isLoading={list.isLoading} />
              {!list.isLoading && (
                <RequestPagination
                  from={list.from}
                  to={list.to}
                  total={list.total}
                  hasPrevious={list.hasPrevious}
                  hasNext={list.hasNext}
                  onPrevious={list.goToPrevious}
                  onNext={list.goToNext}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
