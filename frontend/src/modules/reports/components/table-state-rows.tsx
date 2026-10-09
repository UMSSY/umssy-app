import { FileSearchCorner } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { REPORT_PAGE_SIZE } from "../hooks/use-paginated-report";

// Una fila de carga por cada registro de la página, para evitar saltos de layout.
const SKELETON_ROWS = REPORT_PAGE_SIZE;
const STATE_CONTENT_CLASSES = "sticky left-0 w-[100cqw] whitespace-normal px-6";

interface TableSkeletonRowsProps {
  columnCount: number;
}

export function TableSkeletonRows({ columnCount }: TableSkeletonRowsProps) {
  return Array.from({ length: SKELETON_ROWS }, (_, index) => (
    <TableRow key={index} data-testid="skeleton-row" className="border-border hover:bg-transparent">
      {Array.from({ length: columnCount }, (_, cellIndex) => (
        <TableCell key={cellIndex} className="px-6 py-4">
          <Skeleton className="h-4 w-3/4 rounded bg-border" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

interface TableMessageRowProps {
  columnCount: number;
  message: string;
}

export function TableMessageRow({ columnCount, message }: TableMessageRowProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columnCount} className="p-0">
        <div className={`${STATE_CONTENT_CLASSES} py-10 text-center text-text-secondary`}>{message}</div>
      </TableCell>
    </TableRow>
  );
}

// Estado vacío con ícono para cuando una búsqueda no encuentra resultados.
export function TableNoResultsRow({ columnCount, message }: TableMessageRowProps) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columnCount} className="p-0">
        <div className={`${STATE_CONTENT_CLASSES} py-16`}>
          <div role="status" className="mx-auto flex max-w-56 flex-col items-center gap-4 text-center">
            <FileSearchCorner className="size-14 text-ink-soft" strokeWidth={1.25} aria-hidden="true" />
            <p className="text-base font-semibold text-ink">{message}</p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}