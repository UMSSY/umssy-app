"use client";

import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapExportMenuProps } from "../types/heatmap-component-props.types";

export function HeatmapExportMenu({ onExport, disabled }: HeatmapExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="brand" className="group" disabled={disabled} />}>
        {HEATMAP_TEXT.export}
        <ChevronDown className="size-4 transition-transform group-aria-expanded:rotate-180" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-md shadow-lg">
        <DropdownMenuItem onClick={() => onExport("pdf")} className="items-start gap-3 p-3 whitespace-normal">
          <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="flex flex-col gap-1">
            <span className="font-medium">{HEATMAP_TEXT.exportPdf}</span>
            <span className="text-xs font-normal text-muted-foreground">{HEATMAP_TEXT.exportPdfHint}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport("csv")} className="items-start gap-3 p-3 whitespace-normal">
          <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="flex flex-col gap-1">
            <span className="font-medium">{HEATMAP_TEXT.exportCsv}</span>
            <span className="text-xs font-normal text-muted-foreground">{HEATMAP_TEXT.exportCsvHint}</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
