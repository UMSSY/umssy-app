import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_MESSAGES, APPLICATION_SORT_COLUMNS, WITHDRAWABLE_STATUSES } from "../constants/application.constants";
import type { ApplicationSort, ApplicationSortKey } from "../types/application-list.types";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";

function ariaSortFor(sort: ApplicationSort | null | undefined, key: ApplicationSortKey) {
  if (sort?.key !== key) return "none" as const;
  return sort.direction === "asc" ? ("ascending" as const) : ("descending" as const);
}

function SortIcon({ sort, columnKey }: { sort: ApplicationSort | null | undefined; columnKey: ApplicationSortKey }) {
  if (sort?.key !== columnKey) return <ArrowUpDown className="size-3.5" aria-hidden="true" />;
  return sort.direction === "asc" ? (
    <ArrowUp className="size-3.5" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden="true" />
  );
}

export function ApplicationsTable({ applications, withdrawingId, onWithdraw, sort, onSortChange }: ApplicationsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            {APPLICATION_SORT_COLUMNS.map((column) => (
              <TableHead key={column.key} aria-sort={onSortChange ? ariaSortFor(sort, column.key) : undefined}>
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
              <TableCell className="font-semibold text-ink">{application.vacancyTitle}</TableCell>
              <TableCell className="text-text-secondary">{application.companyName}</TableCell>
              <TableCell className="text-text-secondary">{application.affinityPercentage}%</TableCell>
              <TableCell>
                <Badge variant="outline">{application.status}</Badge>
              </TableCell>
              <TableCell>
                {WITHDRAWABLE_STATUSES.includes(application.status) ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={withdrawingId === application.id}
                    onClick={() => onWithdraw(application.id)}
                  >
                    {withdrawingId === application.id
                      ? APPLICATION_MESSAGES.withdrawing
                      : APPLICATION_MESSAGES.withdraw}
                  </Button>
                ) : (
                  <span className="text-xs text-text-secondary">{APPLICATION_MESSAGES.notAvailable}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
