import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_MESSAGES } from "../constants/application.constants";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";
import { WithdrawApplicationButton } from "./withdraw-application-button";
import { ReactivateApplicationButton } from "./reactivate-application-button";

const dateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/La_Paz",
});

export function ApplicationsTable({
  applications,
  withdrawingId,
  onWithdraw,
  onReactivate,
  reactivatingId,
}: ApplicationsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vacante y empresa</TableHead>
            <TableHead>{APPLICATION_MESSAGES.affinity}</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>{APPLICATION_MESSAGES.status}</TableHead>
            <TableHead>{APPLICATION_MESSAGES.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              <TableCell>
                <p className="font-semibold text-ink">{application.vacancyTitle}</p>
                <p className="text-sm text-text-secondary">{application.companyName}</p>
              </TableCell>
              <TableCell className="text-text-secondary">
                {application.affinityPercentage}%
              </TableCell>
              <TableCell className="text-text-secondary">
                {dateFormatter.format(new Date(application.appliedDate))}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{application.status}</Badge>
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
