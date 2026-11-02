import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APPLICANTS_TEXT } from "../constants/job-offers.constants";
import type { ApplicantsTableProps } from "../types/applicants-table-props.types";
import { formatBoliviaDate } from "../utils/format-bolivia-date";

export function ApplicantsTable({ applicants }: ApplicantsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Postulante</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Fecha de postulación</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map((applicant) => (
            <TableRow key={applicant.id}>
              <TableCell>
                <p className="font-semibold text-ink">{applicant.fullName}</p>
                <p className="text-xs text-text-secondary">
                  {applicant.headline || APPLICANTS_TEXT.noHeadline}
                </p>
              </TableCell>
              <TableCell>
                <a
                  href={`mailto:${applicant.email}`}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  {applicant.email}
                </a>
              </TableCell>
              <TableCell className="tabular-nums">{formatBoliviaDate(applicant.appliedAt)}</TableCell>
              <TableCell>
                <Badge variant="outline">{applicant.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
