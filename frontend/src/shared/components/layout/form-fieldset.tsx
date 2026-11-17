import { cn } from "cn";
import type { FormSectionProps } from "@/shared/types/form-section-props.types";

export function FormFieldset({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <fieldset
      className={cn(
        "min-w-0 border-0 border-b border-border pb-6 last:border-0 last:pb-0",
        className,
      )}
    >
      <legend className="sr-only">{title}</legend>

      <div
        aria-hidden="true"
        className="mb-5 rounded-lg border border-l-4 border-border/80 border-l-accent bg-surface-soft/85 px-4 py-2.5"
      >
        <h2 className="font-tight text-base font-bold tracking-tight text-accent">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>

      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}
