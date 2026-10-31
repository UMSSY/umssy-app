"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExportCsvButtonProps } from "../../types/audit-log-extras-props.types";

export function ExportCsvButton({ total, isExporting, disabled = false, onExport }: ExportCsvButtonProps) {
  return (
    <Button
      type="button"
      onClick={onExport}
      disabled={disabled || isExporting}
      aria-busy={isExporting}
      aria-label={`Exportar a CSV los ${total} eventos filtrados`}
    >
      {isExporting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
      <span className="hidden sm:inline">{isExporting ? "Exportando..." : "Exportar CSV"}</span>
      <span className="sm:hidden">{isExporting ? "..." : "CSV"}</span>
    </Button>
  );
}
