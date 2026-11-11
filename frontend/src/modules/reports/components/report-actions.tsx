"use client";

import { useState } from "react";
import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReportActionsProps } from "../types/report-actions-props.types";
import type { ReportExportScope } from "../types/report-export.types";
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="brand" disabled={!hasResults || isExporting} aria-busy={isExporting} />
          }
        >
          {isExporting ? "Descargando..." : "Descargar"}
          <ChevronDown className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 rounded-md shadow-lg">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Alcance de la descarga</p>
          <DropdownMenuRadioGroup value={scope} onValueChange={(value) => setScope(value as ReportExportScope)}>
            <DropdownMenuRadioItem closeOnClick value="filtered" className="py-2">
              Todo el reporte filtrado
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem closeOnClick value="page" className="py-2">
              Solo la página actual
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Formato</p>
          <DropdownMenuItem onClick={() => onExport?.("pdf", scope)} className="items-start gap-3 p-3 whitespace-normal">
            <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex flex-col gap-1">
              <span className="font-medium">Exportar PDF</span>
              <span className="text-xs font-normal text-muted-foreground">Documento formal con logos de la UMSS</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport?.("csv", scope)} className="items-start gap-3 p-3 whitespace-normal">
            <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="flex flex-col gap-1">
              <span className="font-medium">Exportar CSV</span>
              <span className="text-xs font-normal text-muted-foreground">Datos planos para análisis</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ManagementMenu value={period} onChange={onPeriodChange} />
    </div>
  );
}
