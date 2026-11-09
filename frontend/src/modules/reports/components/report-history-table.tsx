import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/shared/utils/date.utils";
import { REPORT_TYPE_LABELS } from "../constants/generated-report.constants";
import { TABLE_CELL_CLASSES as CELL_CLASSES, TABLE_CONTAINER_CLASSES as CONTAINER_CLASSES } from "../constants/report-table.constants";
import type { ReportHistoryTableProps } from "../types/report-history-table-props.types";
import { TableMessageRow, TableNoResultsRow, TableSkeletonRows } from "./table-state-rows";

function renderDateTime(isoDate: string) {
  const [date, time] = formatDateTime(isoDate).split(" ");

  return (
    <>
      <span className="whitespace-nowrap">{date}</span>
      {time && (
        <>
          {" "}
          <span className="whitespace-nowrap">{time}</span>
        </>
      )}
    </>
  );
}

export function ReportHistoryTable({
  reports,
  isLoading,
  errorMessage,
  emptyMessage = "Aún no se generaron reportes.",
  searchTerm = "",
}: ReportHistoryTableProps) {
  const headClasses = `h-10 px-4 py-2 text-xs font-semibold text-text-secondary px-2 whitespace-normal md:px-4`;
  const cellClasses = `${CELL_CLASSES} px-2 py-3 whitespace-normal md:px-4 md:py-4`;

  const renderBody = () => {
    if (isLoading) {
      return <TableSkeletonRows columnCount={3} />;
    }

    if (errorMessage) {
      return <TableMessageRow columnCount={3} message={errorMessage} />;
    }

    if (reports.length === 0 && searchTerm) {
      return <TableNoResultsRow columnCount={3} message={"No se encontraron reportes que coincidan con la búsqueda"} />;
    }

    if (reports.length === 0) {
      return <TableMessageRow columnCount={3} message={emptyMessage} />;
    }

    return reports.map((report) => (
      <TableRow key={report.id} className="border-border hover:bg-surface-soft">
        <TableCell className={cellClasses}>
          <span className="flex items-center gap-3">
            <FileText className="hidden size-5 shrink-0 text-ink sm:block" strokeWidth={1.5} aria-hidden="true" />
            <span className="wrap-anywhere">{report.fileName}</span>
          </span>
        </TableCell>
        <TableCell className={`${cellClasses} md:whitespace-nowrap`}>{REPORT_TYPE_LABELS[report.reportType]}</TableCell>
        <TableCell className={cellClasses}>{renderDateTime(report.generatedAt)}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div className={`${CONTAINER_CLASSES} min-h-[31rem] md:min-h-[36rem]`}>
      <Table className="text-left text-xs sm:text-sm md:min-w-140 md:text-base">
        <TableHeader className="bg-surface-soft">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead scope="col" className={headClasses}>
              Nombre del Archivo/
              <wbr />
              Reporte
            </TableHead>
            <TableHead scope="col" className={headClasses}>Tipo de Reporte</TableHead>
            <TableHead scope="col" className={headClasses}>Fecha y Hora de Generación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={isLoading}>{renderBody()}</TableBody>
      </Table>
    </div>
  );
}
