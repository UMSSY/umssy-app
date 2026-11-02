import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_MESSAGES, WITHDRAWABLE_STATUSES } from "../constants/application.constants";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";

export function ApplicationsTable({ applications, withdrawingId, onWithdraw }: ApplicationsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{APPLICATION_MESSAGES.vacancy}</TableHead>
            <TableHead>{APPLICATION_MESSAGES.company}</TableHead>
            <TableHead>{APPLICATION_MESSAGES.affinity}</TableHead>
            <TableHead>{APPLICATION_MESSAGES.status}</TableHead>
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
