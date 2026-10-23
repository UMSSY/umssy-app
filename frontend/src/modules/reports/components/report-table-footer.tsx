import type { ReportTableFooterProps } from "../types/report-table-footer-props.types";
import { RefreshButton } from "./refresh-button";
import { TablePagination } from "./table-pagination";

export function ReportTableFooter({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  isLoading,
  itemLabel,
  onPageChange,
  onRefresh,
}: ReportTableFooterProps) {
  const firstVisibleItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
      <p className="mr-auto text-sm text-text-secondary">
        {isLoading
          ? `Cargando ${itemLabel}...`
          : `Mostrando ${firstVisibleItem}-${lastVisibleItem} de ${totalItems} ${itemLabel}`}
      </p>
      <div className="flex justify-center">
        <RefreshButton onClick={onRefresh} isRefreshing={isLoading} />
      </div>
      <div className="flex justify-end">
        {totalItems > 0 && (
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}