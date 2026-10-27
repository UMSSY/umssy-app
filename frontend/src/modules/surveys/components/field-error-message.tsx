import { CircleAlert } from "lucide-react";
import { cn } from "cn";
import type { FieldErrorMessageProps } from "../types/survey-component-props.types";

export function FieldErrorMessage({ id, message, className }: FieldErrorMessageProps) {
  if (!message) return null;

  return (
    <p id={id} className={cn("mt-1.5 flex items-center gap-1.5 text-xs text-danger", className)}>
      <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}
