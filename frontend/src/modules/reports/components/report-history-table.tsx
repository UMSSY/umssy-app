import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/shared/utils/date.utils";
import type { GeneratedReport, ReportType } from "../types/generated-report.types";
import { TableMessageRow, TableSkeletonRows } from "./table-state-rows";

interface ReportHistoryTableProps {
  reports: GeneratedReport[];
  isLoading: boolean;
  errorMessage?: string;
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  REGISTERED_USERS: "Lista de Usuarios",
  STUDENTS: "Estudiantes",
  DEGREE_HOLDERS: "Titulados",
  MENTORS: "Mentores",
  COMPANIES: "Empresas",
  ADMINS: "Administradores",
  REJECTED_USERS: "Rechazados",
};

const COLUMN_COUNT = 3;
const HEAD_CLASSES = "h-auto px-6 py-3 font-semibold text-text-secondary";
const CELL_CLASSES = "px-6 py-4 text-ink-soft";

export function ReportHistoryTable({ reports, isLoading, errorMessage }: ReportHistoryTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return <TableSkeletonRows columnCount={COLUMN_COUNT} />;
    }

    if (errorMessage) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message={errorMessage} />;
    }

    if (reports.length === 0) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message="Aún no se generaron reportes." />;
    }

    return reports.map((report) => (
      <TableRow key={report.id} className="border-border hover:bg-surface-soft">
        <TableCell className={`${CELL_CLASSES} whitespace-normal`}>
          <span className="flex items-center gap-3">
            <FileText className="size-5 shrink-0 text-ink" strokeWidth={1.5} aria-hidden="true" />
            <span className="break-all">{report.fileName}</span>
          </span>
        </TableCell>
        <TableCell className={CELL_CLASSES}>{REPORT_TYPE_LABELS[report.reportType]}</TableCell>
        <TableCell className={CELL_CLASSES}>{formatDateTime(report.generatedAt)}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="rounded-lg border border-border bg-surface">
      <Table className="min-w-160 text-left text-base">
        <TableHeader className="bg-surface-soft">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead scope="col" className={HEAD_CLASSES}>Nombre del Archivo/Reporte</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Tipo de Reporte</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Fecha y Hora de Generación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={isLoading}>{renderBody()}</TableBody>
      </Table>
    </div>
  );
}
