"use client";

import type { RequestsPaginationProps } from "../types/request-review-props.types";

const BUTTON_CLASS_NAME =
  "rounded-[6px] border border-[#C9CFD8] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#0B1F2E] transition-colors hover:bg-[#F6F7F9] disabled:cursor-not-allowed disabled:opacity-50";

export function RequestsPagination({
  page,
  limit,
  total,
  isDisabled = false,
  onPageChange,
}: RequestsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, total);

  const canGoPrevious = page > 1 && !isDisabled;
  const canGoNext = page < totalPages && !isDisabled;

  return (
    <nav
      aria-label="Paginación de solicitudes"
      className="flex items-center justify-between border-t border-[#E3E7EC] px-4 py-3"
    >
      <p className="text-[13px] text-[#5B6470]" aria-live="polite">
        Mostrando {firstItem} a {lastItem} de {total} solicitudes
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={BUTTON_CLASS_NAME}
          disabled={!canGoPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className={BUTTON_CLASS_NAME}
          disabled={!canGoNext}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}