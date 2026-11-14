import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  APPLICATION_MESSAGES,
  APPLICATION_SORT_COLUMNS,
} from "../constants/application.constants";
import type { ApplicationSort } from "../types/application-sort.types";
import type { ApplicationSortKey } from "../types/application-sort-key.types";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";
import { ReactivateApplicationButton } from "./reactivate-application-button";
import { WithdrawApplicationButton } from "./withdraw-application-button";

const dateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/La_Paz",
});

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
  if (sort?.key !== columnKey) {
    return <ArrowUpDown className="size-3.5" aria-hidden="true" />;
  }

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
  onReactivate,
  reactivatingId,
  sort,
  onSortChange,
}: ApplicationsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            {APPLICATION_SORT_COLUMNS.map((column) => (
              <TableHead
                key={column.key}
                aria-sort={
                  onSortChange ? ariaSortFor(sort, column.key) : undefined
                }
              >
                {onSortChange ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 gap-1 px-2 font-medium"
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
            <TableHead>{APPLICATION_MESSAGES.actions}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-semibold text-ink">
                {application.vacancyTitle}
              </TableCell>

              <TableCell className="text-text-secondary">
                {application.companyName}
              </TableCell>

              <TableCell className="text-text-secondary">
                {application.affinityPercentage}%
              </TableCell>

              <TableCell>
                <Badge variant="outline">{application.status}</Badge>
              </TableCell>

              <TableCell className="text-text-secondary">
                {dateFormatter.format(new Date(application.appliedDate))}
              </TableCell>

              <TableCell>
                {application.status === "Retirada" && onReactivate ? (
                  <ReactivateApplicationButton
                    applicationId={application.id}
                    reactivatingId={reactivatingId}
                    onReactivate={onReactivate}
                  />
                ) : (
                  <WithdrawApplicationButton
                    application={application}
                    withdrawingId={withdrawingId}
                    onWithdraw={onWithdraw}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
