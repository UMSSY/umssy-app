import React from "react";
import { Download, Settings, ChevronDown } from "lucide-react";

const roleOptions = [
  "Todos",
  "Estudiante",
  "Egresado",
  "Titulado",
  "Mentor",
  "Empresa",
  "Administrador",
];

export function UsersReportFilters() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
      {/* Selector de filtro por tipo de usuario */}
      <div className="flex flex-col gap-1.5 w-full sm:w-64">
        <label
          htmlFor="user-type-filter"
          className="text-[12px] font-semibold text-text-secondary"
        >
          Tipo de usuario
        </label>
        <div className="relative">
          <select
            id="user-type-filter"
            defaultValue="Todos"
            className="w-full appearance-none bg-surface border border-border rounded-lg px-3.5 py-2 text-[14px] text-ink font-sans focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors cursor-pointer shadow-xs"
          >
            {roleOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Botones de acción puramente visuales */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="flex items-center gap-2 bg-ink hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-[13.5px] font-sans font-medium transition-all shadow-xs cursor-pointer border border-ink"
        >
          <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center">
            <Download className="w-3.5 h-3.5 text-accent" />
          </div>
          <span>Exportar CSV</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-2 bg-ink hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-[13.5px] font-sans font-medium transition-all shadow-xs cursor-pointer border border-ink"
        >
          <Settings className="w-4 h-4 text-slate-300" />
          <span>Gestión</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
