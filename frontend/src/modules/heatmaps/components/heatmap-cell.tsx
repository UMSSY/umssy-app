import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapCellProps } from "../types/heatmap-component-props.types";
import { getHeatmapTone } from "../utils/get-heatmap-tone";

export function HeatmapCell({ cell, column, skillName, cellFormat, cellUnit }: HeatmapCellProps) {
  const tone = getHeatmapTone(cell);
  const baseClass = "flex min-h-14 flex-col items-center justify-center rounded-md px-2 py-1.5 text-center";

  if (!cell || cell.isEmpty) {
    return (
      <div className={cn(baseClass, tone)} aria-label={`${skillName}, ${column.label}: ${HEATMAP_TEXT.legendEmpty}`}>
        <span className="text-sm font-semibold">{HEATMAP_TEXT.emptyCell}</span>
      </div>
    );
  }

  const count = cell.count ?? 0;
  const percentage = cell.percentage ?? 0;
  const tooltip = HEATMAP_TEXT.cellTooltip(count, cell.total ?? 0, cellUnit, column.label, skillName, percentage);
  const primary = cellFormat === "count-first" ? String(count) : `${percentage}%`;
  const secondary = cellFormat === "count-first" ? `(${percentage}%)` : `${count} ${cellUnit}`;

  return (
    <Tooltip>
      <TooltipTrigger render={<div className={cn(baseClass, "cursor-default", tone)} aria-label={tooltip} tabIndex={0} />}>
        <span className="text-base leading-tight font-bold tabular-nums">{primary}</span>
        <span className="text-xs leading-tight tabular-nums opacity-85">{secondary}</span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
