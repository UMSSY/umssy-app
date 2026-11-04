import { RefreshButton, TablePagination } from "@/modules/reports";
import { SURVEY_HISTORY_REFRESH_BUTTON_CLASSES } from "../constants/survey-history.constants";
import type { SurveyHistoryTableFooterProps } from "../types/survey-history-component-props.types";

export function SurveyHistoryTableFooter({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  isLoading,
  itemLabel,
  onPageChange,
  onRefresh,
}: SurveyHistoryTableFooterProps) {
  const firstVisibleItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="grid grid-cols-1 items-center gap-4 border-t border-border pt-4 sm:grid-cols-[1fr_auto_1fr]">
      <p className="text-sm text-text-secondary">
        {isLoading
          ? `Cargando ${itemLabel}...`
          : `Mostrando ${firstVisibleItem}-${lastVisibleItem} de ${totalItems} ${itemLabel}`}
      </p>
      <div className="flex justify-center">
        <RefreshButton
          variant="default"
          onClick={onRefresh}
          isRefreshing={isLoading}
          className={SURVEY_HISTORY_REFRESH_BUTTON_CLASSES}
        />
      </div>
      <div className="flex justify-center sm:justify-end">
        {totalItems > 0 && (
          <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}
