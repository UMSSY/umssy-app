import { cn } from "cn";
import type { OptionMarkerProps } from "../types/survey-component-props.types";

export function OptionMarker({ questionType, className }: OptionMarkerProps) {
  return (
    <span
      aria-hidden="true"
      data-marker={questionType === "multiple_choice" ? "square" : "circle"}
      className={cn(
        "size-4.5 shrink-0 border-2 border-border-strong",
        questionType === "multiple_choice" ? "rounded-[4px]" : "rounded-full",
        className,
      )}
    />
  );
}
