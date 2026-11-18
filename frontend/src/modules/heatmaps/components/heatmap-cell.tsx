import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapCellProps } from "../types/heatmap-cell-props.types";
import { formatHeatmapPercentage } from "../utils/format-heatmap-percentage";
import { getContinuousHeatmapTone } from "../utils/get-continuous-heatmap-tone";
import { getHeatmapTone } from "../utils/get-heatmap-tone";

export function HeatmapCell({
  cell,
  column,
  skillName,
  cellFormat,
  cellUnit,
  toneMode = "steps",
  tooltipVariant = "sentence",
  percentageDecimals,
}: HeatmapCellProps) {
  const tone = toneMode === "continuous" ? getContinuousHeatmapTone(cell) : { className: getHeatmapTone(cell), style: undefined };
  const baseClass = "flex min-h-14 flex-col items-center justify-center rounded-md px-2 py-1.5 text-center";

  if (!cell || cell.isEmpty) {
    return (
      <div className={cn(baseClass, tone.className)} aria-label={`${skillName}, ${column.label}: ${HEATMAP_TEXT.legendEmpty}`}>
        <span className="text-sm font-semibold">{HEATMAP_TEXT.emptyCell}</span>
      </div>
    );
  }

  const count = cell.count ?? 0;
  const total = cell.total ?? 0;
  const percentage = cell.percentage ?? 0;
  const percentageText = formatHeatmapPercentage(percentage, percentageDecimals);
  const isTwoLine = tooltipVariant === "two-line";
  const tooltipTitle = HEATMAP_TEXT.cellTooltipTitle(skillName, column.label);
  const tooltipDetail = HEATMAP_TEXT.cellTooltipDetail(count, total, cellUnit, percentageText);
  const tooltip = isTwoLine ? `${tooltipTitle}. ${tooltipDetail}` : HEATMAP_TEXT.cellTooltip(count, total, cellUnit, column.label, skillName, percentage);
  const primary = cellFormat === "count-first" ? String(count) : percentageText;
  const secondary = cellFormat === "count-first" ? `(${percentageText})` : `${count} ${cellUnit}`;

  return (
    <Tooltip>
      <TooltipTrigger render={<div className={cn(baseClass, "cursor-default", tone.className)} style={tone.style} aria-label={tooltip} tabIndex={0} />}>
        <span className="text-base leading-tight font-bold tabular-nums">{primary}</span>
        <span className="text-xs leading-tight tabular-nums opacity-85">{secondary}</span>
      </TooltipTrigger>
      <TooltipContent>
        {isTwoLine ? (
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold">{tooltipTitle}</span>
            <span className="tabular-nums">{tooltipDetail}</span>
          </span>
        ) : (
          tooltip
        )}
      </TooltipContent>
    </Tooltip>
  );
}
