import { Badge } from "@/components/ui/badge";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapExtraValueProps } from "../types/heatmap-component-props.types";

export function HeatmapExtraValue({ value, config }: HeatmapExtraValueProps) {
  if (!value || (value.badgeText === undefined && value.count === undefined && value.percentage === undefined)) {
    return <span className="text-sm text-text-secondary">{HEATMAP_TEXT.emptyCell}</span>;
  }

  if (config.format === "badge") {
    return value.badgeText ? <Badge className="bg-interaction text-accent">{value.badgeText}</Badge> : <span className="text-sm text-text-secondary">{HEATMAP_TEXT.emptyCell}</span>;
  }

  const main = config.format === "percentage" ? `${value.percentage ?? 0}%` : String(value.count ?? 0);

  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-base font-bold text-ink tabular-nums">{main}</span>
      {value.subtext && <span className="text-xs text-text-secondary tabular-nums">{value.subtext}</span>}
    </div>
  );
}
