import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";
import { formatApplicationDate } from "../utils/format-application-date";
import { ApplicationActions } from "./application-actions";
import { ApplicationStatusBadge } from "./application-status-badge";

const HEADER_CELL_CLASS = "first:rounded-l-lg last:rounded-r-lg";

const CARD_CELL_CLASS =
  "border-y border-border bg-surface transition-colors group-focus-within:border-availability-border group-hover:border-availability-border group-hover:bg-availability/30 first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r";

export function ApplicationsTable({
  applications,
  withdrawingId,
  onWithdraw,
  contactingId,
  onContact,
  onReactivate,
  reactivatingId,
}: ApplicationsTableProps) {
  return (
    <Table className="border-separate border-spacing-y-3">
      <TableHeader>
        <TableRow>
          <TableHead className={HEADER_CELL_CLASS}>{APPLICATION_MESSAGES.vacancyAndCompany}</TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-center")}>{APPLICATION_MESSAGES.affinity}</TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-center")}>{APPLICATION_MESSAGES.date}</TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-center")}>{APPLICATION_MESSAGES.status}</TableHead>
          <TableHead className={cn(HEADER_CELL_CLASS, "text-center")}>{APPLICATION_MESSAGES.actions}</TableHead>
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