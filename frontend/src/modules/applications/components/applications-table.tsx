import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_MESSAGES, WITHDRAWABLE_STATUSES } from "../constants/application.constants";
import type { ApplicationsTableProps } from "../types/applications-table-props.types";

type SortField = "vacancyTitle" | "companyName" | "affinityPercentage" | "status";
type SortOrder = "asc" | "desc";

export function ApplicationsTable({ applications, withdrawingId, onWithdraw }: ApplicationsTableProps) {
  const [sortField, setSortField] = useState<SortField>("vacancyTitle");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Manejador para alternar el criterio y dirección de ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      return sortOrder === "asc"
        ? aStr.localeCompare(bStr, "es", { sensitivity: "base" })
        : bStr.localeCompare(aStr, "es", { sensitivity: "base" });
    });
  }, [applications, sortField, sortOrder]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return <span className="ml-1 text-xs">{sortOrder === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer transition-colors select-none hover:text-ink"
              onClick={() => handleSort("vacancyTitle")}
            >
              {APPLICATION_MESSAGES.vacancy} {renderSortIndicator("vacancyTitle")}
            </TableHead>
            <TableHead 
              className="cursor-pointer transition-colors select-none hover:text-ink"
              onClick={() => handleSort("companyName")}
            >
              {APPLICATION_MESSAGES.company} {renderSortIndicator("companyName")}
            </TableHead>
            <TableHead 
              className="cursor-pointer transition-colors select-none hover:text-ink"
              onClick={() => handleSort("affinityPercentage")}
            >
              {APPLICATION_MESSAGES.affinity} {renderSortIndicator("affinityPercentage")}
            </TableHead>
            <TableHead 
              className="cursor-pointer transition-colors select-none hover:text-ink"
              onClick={() => handleSort("status")}
            >
              {APPLICATION_MESSAGES.status} {renderSortIndicator("status")}
            </TableHead>
            <TableHead>{APPLICATION_MESSAGES.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedApplications.map((application) => (
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