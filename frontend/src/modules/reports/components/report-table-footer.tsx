import { REPORT_PAGE_SIZE } from "../hooks/use-paginated-report";
import { RefreshButton } from "./refresh-button";
import { TablePagination } from "./table-pagination";

interface ReportTableFooterProps {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  refreshLabel?: string;
  emptyResultsMode?: "hide-pagination" | "hide-summary";
}

// Rango "Mostrando X-Y de Z" de la página actual, calculado sobre el total filtrado.
export function getVisibleRange(currentPage: number, totalItems: number) {
  const first = totalItems === 0 ? 0 : (currentPage - 1) * REPORT_PAGE_SIZE + 1;
  const last = Math.min(currentPage * REPORT_PAGE_SIZE, totalItems);

  return { first, last };
}

export function ReportTableFooter({
  currentPage,
  totalItems,
  totalPages,
  isLoading,
  onPageChange,
  onRefresh,
  refreshLabel,
  emptyResultsMode = "hide-pagination",
}: ReportTableFooterProps) {
  const { first, last } = getVisibleRange(currentPage, totalItems);
  // Sin resultados no hay páginas que recorrer: se oculta el paginador.
  const hasResults = isLoading || totalItems > 0;
  const showSummary = hasResults || emptyResultsMode === "hide-pagination";
  const showPagination = hasResults || emptyResultsMode === "hide-summary";

  return (
    <div className="mt-auto grid grid-cols-1 items-center gap-4 md:grid-cols-3">
      <p className="text-center text-sm text-text-secondary empty:hidden md:text-left md:empty:block">
        {showSummary && (isLoading ? "Cargando usuarios..." : `Mostrando ${first}-${last} de ${totalItems} usuarios`)}
      </p>
      <div className="flex justify-center">
        <RefreshButton label={refreshLabel} onClick={onRefresh} isRefreshing={isLoading} />
      </div>
      <div className="flex justify-center md:justify-end">
        {showPagination && (
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}
