"use client";

import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { APPOINTMENTS_PAGINATION_TEXT } from "../constants/appointments-pagination.constants";
import type { AppointmentsPaginationProps } from "../types/appointments-pagination-props.types";
import { getAppointmentsPageRange, getAppointmentsTotalPages } from "../utils/appointments-pagination.utils";

export function AppointmentsPagination({
  page,
  pageSize,
  total,
  isDisabled,
  onPageChange,
}: AppointmentsPaginationProps) {
  if (total <= pageSize) return null;

  const totalPages = getAppointmentsTotalPages(pageSize, total);
  const { from, to } = getAppointmentsPageRange(page, pageSize, total);

  return (
    <nav
      aria-label={APPOINTMENTS_PAGINATION_TEXT.ariaLabel}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-text-secondary" aria-live="polite">
        {APPOINTMENTS_PAGINATION_TEXT.summary(from, to, total)}
      </p>

      <Pagination className="mx-0 w-auto">
        <PaginationContent className="flex-nowrap gap-2">
          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisabled || page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              {APPOINTMENTS_PAGINATION_TEXT.previous}
            </Button>
          </PaginationItem>

          <PaginationItem aria-live="polite" className="text-sm whitespace-nowrap text-text-secondary">
            {APPOINTMENTS_PAGINATION_TEXT.pageOf(page, totalPages)}
          </PaginationItem>

          <PaginationItem>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisabled || page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              {APPOINTMENTS_PAGINATION_TEXT.next}
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </nav>
  );
}
