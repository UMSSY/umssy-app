import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  APPLICATION_MESSAGES,
  APPLICATION_SORT_COLUMNS,
} from "../constants/application.constants";
import type { ApplicationSort } from "../types/application-sort.types";
import type { ApplicationSortKey } from "../types/application-sort-key.types";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";
import { formatApplicationDate } from "../utils/format-application-date";
import { ApplicationActions } from "./application-actions";
import { ApplicationStatusBadge } from "./application-status-badge";

const HEADER_CELL_CLASS = "first:rounded-l-lg last:rounded-r-lg";

const CARD_CELL_CLASS =
  "border-y border-border bg-surface transition-colors group-focus-within:border-availability-border group-hover:border-availability-border group-hover:bg-availability/30 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r";

function ariaSortFor(
  sort: ApplicationSort | null | undefined,
  key: ApplicationSortKey,
) {
  if (sort?.key !== key) return "none" as const;
  return sort.direction === "asc"
    ? ("ascending" as const)
    : ("descending" as const);
}

function SortIcon({
  sort,
  columnKey,
}: {
  sort: ApplicationSort | null | undefined;
  columnKey: ApplicationSortKey;
}) {
  if (sort?.key !== columnKey)
    return <ArrowUpDown className="size-3.5" aria-hidden="true" />;
  return sort.direction === "asc" ? (
    <ArrowUp className="size-3.5" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden="true" />
  );
}

export function ApplicationsTable({
  applications,
  withdrawingId,
  onWithdraw,
  contactingId,
  onContact,
  onReactivate,
  reactivatingId,
  sort,
  onSortChange,
}: ApplicationsTableProps) {
  return (
    <Table className="border-separate border-spacing-y-3">
      <TableHeader>
        <TableRow>
          {APPLICATION_SORT_COLUMNS.map((column) => (
            <TableHead
              key={column.key}
              className={cn(
                HEADER_CELL_CLASS,
                column.key !== "vacancy" && "text-center",
              )}
              aria-sort={onSortChange ? ariaSortFor(sort, column.key) : undefined}
            >
              {onSortChange ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-xs font-semibold tracking-wide text-text-secondary uppercase hover:text-ink"
                  onClick={() => onSortChange(column.key)}
                >
                  {column.label}
                  <SortIcon sort={sort} columnKey={column.key} />
                </Button>
              ) : (
                column.label
              )}
            </TableHead>
          ))}
          <TableHead className={cn(HEADER_CELL_CLASS, "text-center")}>
            {APPLICATION_MESSAGES.date}
          </TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-center")}>
            {APPLICATION_MESSAGES.status}
          </TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-center")}>
            {APPLICATION_MESSAGES.actions}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.id} className="group border-0 hover:bg-transparent">
            <TableCell className={CARD_CELL_CLASS}>
              <p className="font-semibold text-ink">{application.vacancyTitle}</p>
              <p className="text-sm text-text-secondary">{application.companyName}</p>
            </TableCell>
            <TableCell className={cn(CARD_CELL_CLASS, "text-center text-text-secondary")}>
              {application.affinityPercentage}%
            </TableCell>
            <TableCell className={cn(CARD_CELL_CLASS, "text-center text-text-secondary")}>
              {formatApplicationDate(application.appliedDate)}
            </TableCell>
            <TableCell className={cn(CARD_CELL_CLASS, "text-center")}>
              <ApplicationStatusBadge status={application.status} />
            </TableCell>
            <TableCell className={CARD_CELL_CLASS}>
              <ApplicationActions
                application={application}
                withdrawingId={withdrawingId}
                onWithdraw={onWithdraw}
                contactingId={contactingId}
                onContact={onContact}
                reactivatingId={reactivatingId}
                onReactivate={onReactivate}
                className="mx-auto w-36 flex-col"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}