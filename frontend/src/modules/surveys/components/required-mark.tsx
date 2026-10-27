import { cn } from "cn";
import type { RequiredMarkProps } from "../types/survey-component-props.types";

export function RequiredMark({ className }: RequiredMarkProps) {
  return (
    <span aria-hidden="true" className={cn("text-danger", className)}>
      *
    </span>
  );
}
