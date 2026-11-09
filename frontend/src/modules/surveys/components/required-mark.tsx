import { cn } from "cn";
import type { RequiredMarkProps } from "../types/required-mark-props.types";

export function RequiredMark({ className }: RequiredMarkProps) {
  return (
    <span aria-hidden="true" className={cn("text-danger", className)}>
      *
    </span>
  );
}
