"use client";

import { useState } from "react";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { ExportFormatMenu } from "@/shared/components/export-format-menu";
import { REPORT_EXPORT_FORMAT_TEXTS } from "../constants/report-export.constants";
import type { ReportActionsProps } from "../types/report-actions-props.types";
import type { ReportExportScope } from "../types/report-export-scope.types";
import { ManagementMenu } from "./management-menu";

export function ReportActions({
  onExport,
  isExporting = false,
  hasResults = false,
  period,
  onPeriodChange,
}: ReportActionsProps) {
  const [scope, setScope] = useState<ReportExportScope>("filtered");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ExportFormatMenu
        triggerLabel={isExporting ? "Descargando..." : "Descargar"}
        formatTexts={REPORT_EXPORT_FORMAT_TEXTS}
        formatHeading="Formato"
        onSelectFormat={(format) => onExport?.(format, scope)}
        disabled={!hasResults}
        isLoading={isExporting}
        contentClassName="w-72"
      >
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Alcance de la descarga</p>
        <DropdownMenuRadioGroup value={scope} onValueChange={(value) => setScope(value as ReportExportScope)}>
          <DropdownMenuRadioItem closeOnClick value="filtered" className="py-2">
            Todo el reporte filtrado
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem closeOnClick value="page" className="py-2">
            Solo la página actual
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </ExportFormatMenu>
      <ManagementMenu value={period} onChange={onPeriodChange} />
    </div>
  );
}
