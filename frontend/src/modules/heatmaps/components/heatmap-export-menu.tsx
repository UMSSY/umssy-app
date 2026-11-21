"use client";

import { ExportFormatMenu } from "@/shared/components/export-format-menu";
import { HEATMAP_EXPORT_FORMAT_TEXTS, HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapExportMenuProps } from "../types/heatmap-export-menu-props.types";

export function HeatmapExportMenu({ onExport, disabled }: HeatmapExportMenuProps) {
  return (
    <ExportFormatMenu
      triggerLabel={HEATMAP_TEXT.export}
      formatTexts={HEATMAP_EXPORT_FORMAT_TEXTS}
      onSelectFormat={onExport}
      disabled={disabled}
    />
  );
}
