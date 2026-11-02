"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination";
import { cn } from "cn";
import type { AuditPaginationProps } from "../../types/audit-log-component-props.types";
import { getPageNumbers } from "../../utils/get-page-numbers";

const PAGE_CLASS = "size-9 rounded-md border-border bg-surface text-sm font-semibold text-ink-soft hover:bg-surface-soft hover:text-ink";
const CURRENT_PAGE_CLASS = "size-9 rounded-md border-transparent bg-accent text-sm font-semibold text-surface hover:bg-accent";
const MOBILE_BUTTON_CLASS = "h-[34px] flex-1 rounded-lg border-border bg-surface px-3 text-sm font-semibold text-ink";

// Escritorio: páginas numeradas. Móvil: Anterior y Siguiente
export function AuditPagination({ from, to, total, page, totalPages, hasPrevious, hasNext, onPrevious, onNext, onPageChange }: AuditPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-sm text-text-secondary" aria-live="polite">
        Mostrando {from}-{to} de {total} eventos
      </p>

      <Pagination aria-label="Paginación del registro de auditoría" className="mx-0 hidden w-auto md:flex">
        <PaginationContent className="gap-2">
          <PaginationItem>
            <Button type="button" variant="outline" size="icon" onClick={onPrevious} disabled={!hasPrevious} aria-label="Página anterior" className={PAGE_CLASS}>
              <ChevronLeft aria-hidden="true" />
            </Button>
          </PaginationItem>
          {getPageNumbers(page, totalPages).map((item) =>
            typeof item === "number" ? (
              <PaginationItem key={item}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? "page" : undefined}
                  aria-label={`Página ${item}`}
                  className={cn(item === page ? CURRENT_PAGE_CLASS : PAGE_CLASS)}
                >
                  {item}
                </Button>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis className="size-9 text-ink-soft" />
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <Button type="button" variant="outline" size="icon" onClick={onNext} disabled={!hasNext} aria-label="Página siguiente" className={PAGE_CLASS}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <nav aria-label="Paginación del registro de auditoría en móvil" className="flex w-full items-center gap-2 md:hidden">
        <Button type="button" variant="outline" onClick={onPrevious} disabled={!hasPrevious} className={MOBILE_BUTTON_CLASS}>
          Anterior
        </Button>
        <span className="shrink-0 text-sm text-text-secondary">
          Página {page} de {totalPages}
        </span>
        <Button type="button" variant="outline" onClick={onNext} disabled={!hasNext} className={MOBILE_BUTTON_CLASS}>
          Siguiente
        </Button>
      </nav>
    </div>
  );
}
