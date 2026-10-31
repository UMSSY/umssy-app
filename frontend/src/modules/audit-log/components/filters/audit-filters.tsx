"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { AuditFiltersProps } from "../../types/audit-log-extras-props.types";
import { AuditFilterFields } from "./audit-filter-fields";
import { AuditSearchInput } from "./audit-search-input";

// Escritorio: barra con todos los filtros. Móvil: búsqueda visible y botón Filtros con un panel
export function AuditFilters({ values, responsibles, activeCount, periodError, onSearchChange, onClear, ...handlers }: AuditFiltersProps) {
  const fieldProps = { values, responsibles, periodError, ...handlers };

  return (
    <div role="search" aria-label="Filtros del registro de auditoría" className="rounded-lg border border-border bg-surface p-4">
      <div className="hidden flex-wrap items-end gap-3 md:flex">
        <div className="min-w-56 flex-1">
          <AuditSearchInput id="audit-search" value={values.searchInput} onChange={onSearchChange} />
        </div>
        <div className="grid flex-[2] grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(18rem,1.4fr)] items-start gap-3">
          <AuditFilterFields idPrefix="audit-desktop" {...fieldProps} />
        </div>
        {activeCount > 0 ? (
          <Button type="button" variant="brand" onClick={onClear}>
            Limpiar filtros
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        <AuditSearchInput id="audit-search-mobile" value={values.searchInput} onChange={onSearchChange} />
        <Sheet>
          <SheetTrigger render={<Button type="button" variant="outline" className="w-full border-border bg-surface text-ink" />}>
            <SlidersHorizontal aria-hidden="true" />
            {activeCount > 0 ? `Filtros (${activeCount})` : "Filtros"}
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] gap-4 overflow-y-auto rounded-t-lg p-4">
            <SheetHeader className="p-0">
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>{activeCount > 0 ? `${activeCount} filtros activos` : "Sin filtros activos"}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4">
              <AuditFilterFields idPrefix="audit-mobile" {...fieldProps} />
            </div>
            <SheetFooter className="flex-row gap-2 p-0">
              <Button type="button" variant="outline" onClick={onClear} disabled={activeCount === 0} className="flex-1 border-border bg-surface text-ink">
                Limpiar filtros
              </Button>
              <SheetClose render={<Button type="button" className="flex-1" />}>Ver resultados</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
