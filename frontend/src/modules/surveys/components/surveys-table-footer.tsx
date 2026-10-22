"use client";

import { useId } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { TablePagination } from "@/modules/reports";
import { SURVEYS_PAGE_SIZE_OPTIONS } from "../constants/surveys.constants";
import type { SurveysTableFooterProps } from "../types/surveys-table-footer-props.types";

export function SurveysTableFooter({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: SurveysTableFooterProps) {
  const pageSizeId = useId();
  const firstVisibleItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <p className="text-sm text-text-secondary">
          {isLoading ? "Cargando encuestas..." : `Mostrando ${firstVisibleItem}-${lastVisibleItem} de ${totalItems} encuestas`}
        </p>
        <span className="flex items-center gap-2">
          <label htmlFor={pageSizeId} className="text-sm text-text-secondary">
            Filas por página
          </label>
          <NativeSelect
            id={pageSizeId}
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {SURVEYS_PAGE_SIZE_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {option}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </span>
      </div>
      {totalItems > 0 && <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />}
    </div>
  );
}
