import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapHelpIconProps } from "../types/heatmap-help-icon-props.types";

export function HeatmapHelpIcon({ text }: HeatmapHelpIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="cursor-help rounded-full text-text-secondary hover:text-accent"
            aria-label={`${HEATMAP_TEXT.helpLabel}: ${text}`}
          />
        }
      >
        <Info className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
