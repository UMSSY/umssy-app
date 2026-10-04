"use client";

import { useState } from "react";
import { REQUEST_STATUS_TABS, REQUESTS_PAGE_SIZE } from "../constants/request-review.constants";
import { useAccessRequests } from "../hooks/use-access-requests";
import type { RequestStatus } from "../types/request-review.types";
import { RequestsEmptyState } from "../components/requests-empty-state";
import { RequestsPagination } from "../components/requests-pagination";
import { RequestsStatusTabs } from "../components/requests-status-tabs";
import { RequestsTable } from "../components/requests-table";
import { RequestsTableSkeleton } from "../components/requests-table-skeleton";

export function RequestInboxView() {
  const [status, setStatus] = useState<RequestStatus>("PENDING");
  const [page, setPage] = useState(1);
  const { result, error, isLoading } = useAccessRequests({
    status,
    page,
    limit: REQUESTS_PAGE_SIZE,
  });

  const activeLabel = REQUEST_STATUS_TABS.find((tab) => tab.status === status)?.label ?? "";
  const items = result?.items ?? [];

  function handleStatusChange(nextStatus: RequestStatus) {
    setStatus(nextStatus);
    setPage(1);
  }

  function handleReview(requestId: string) {
    // TODO: navegar al detalle de la solicitud cuando exista la pantalla de la HU 1.2.2
    console.info("Revisar solicitud", requestId);
  }

  return (
    <section className="rounded-[10px] border border-[#E3E7EC] bg-white">
      <RequestsStatusTabs activeStatus={status} onStatusChange={handleStatusChange} />

      {isLoading && <RequestsTableSkeleton />}

      {error && (
        <p role="alert" className="px-4 py-12 text-center text-[13px] font-bold text-[#B4050F]">
          {error}
        </p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <RequestsEmptyState statusLabel={activeLabel} />
      )}

      {!isLoading && !error && items.length > 0 && (
        <RequestsTable requests={items} onReview={handleReview} />
      )}

      {!isLoading && !error && (
        <RequestsPagination
          page={page}
          limit={REQUESTS_PAGE_SIZE}
          total={result?.total ?? 0}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}