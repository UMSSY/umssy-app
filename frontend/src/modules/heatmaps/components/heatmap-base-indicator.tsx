import { Users } from "lucide-react";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapBaseIndicatorProps } from "../types/heatmap-base-indicator-props.types";
import { HeatmapHelpIcon } from "./heatmap-help-icon";

export function HeatmapBaseIndicator({ baseCount, baseLabel, help }: HeatmapBaseIndicatorProps) {
  if (help) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
        <span>{HEATMAP_TEXT.base(baseCount, baseLabel)}</span>
        <HeatmapHelpIcon text={help} />
      </p>
    );
  }

  return (
    <p className="inline-flex items-center gap-2 rounded-md bg-interaction px-3 py-1.5 text-sm font-medium text-accent">
      <Users className="size-4" aria-hidden="true" />
      {HEATMAP_TEXT.base(baseCount, baseLabel)}
    </p>
  );
}
