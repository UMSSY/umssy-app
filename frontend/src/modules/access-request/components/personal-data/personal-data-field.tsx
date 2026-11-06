import { DateField } from "@/shared/components/date-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";
import { RequiredMark } from "./required-mark";
import type { PersonalDataFieldProps } from "../../types/personal-data-field-props.types";

export function PersonalDataField({
  id,
  label,
  help,
  icon,
  isRequired = false,
  error,
  className,
  onValueChange,
  ...inputProps
}: PersonalDataFieldProps) {
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 text-xs font-semibold text-ink">
        {label}
        {isRequired ? <RequiredMark /> : null}
      </Label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
            {icon}
          </span>
        ) : null}
        {inputProps.type === "date" ? (
        <DateField
          id={id}
          name={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={isRequired || undefined}
          className={`h-11 rounded-md border-border bg-surface text-base text-ink focus-visible:border-accent focus-visible:ring-interaction md:text-base ${
            icon ? "pl-10" : "px-3"
          }`}
          {...inputProps}
          value={String(inputProps.value ?? "")}
          onValueChange={onValueChange}
        />
        ) : (
        <Input
          id={id}
          name={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={isRequired || undefined}
          className={`h-11 rounded-md border-border bg-surface text-base text-ink focus-visible:border-accent focus-visible:ring-interaction md:text-base ${
            icon ? "pl-10" : "px-3"
          }`}
          {...inputProps}
        />
        )}
      </div>
      {help ? (
        <p id={helpId} className="mt-1.5 text-xs text-text-secondary">
          {help}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
