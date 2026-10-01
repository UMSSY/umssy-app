import React from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export function UsersReportPagination() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-1 select-none">
      {/* Indicador de registros en el extremo izquierdo */}
      <div className="text-[12.5px] text-text-secondary font-sans order-2 sm:order-1">
        Mostrando 0 registros
      </div>

      {/* Botón Actualizar en el centro */}
      <div className="order-1 sm:order-2">
        <button
          type="button"
          className="flex items-center gap-2 bg-ink hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-[13.5px] font-sans font-medium transition-all shadow-xs cursor-pointer border border-ink"
        >
          <RefreshCw className="w-3.5 h-3.5 text-white" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Controles de paginación numéricos en el extremo derecho */}
      <div className="flex items-center gap-1 order-3">
        {/* Botón Anterior */}
        <button
          type="button"
          disabled
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border bg-surface text-slate-400 disabled:opacity-40 transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Número 1 */}
        <button
          type="button"
          disabled
          className="w-8 h-8 flex items-center justify-center rounded-md text-[13px] font-sans font-medium border border-border bg-surface text-slate-400 opacity-60"
        >
          1
        </button>

        {/* Botón Siguiente */}
        <button
          type="button"
          disabled
          className="w-8 h-8 flex items-center justify-center rounded-md border border-border bg-surface text-slate-400 disabled:opacity-40 transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
