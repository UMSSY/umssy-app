import { Label } from "@/components/ui/label";
import type { FormFieldProps } from "../types/form-field-props.types";
import { getFieldErrorId } from "../utils/get-field-error-props";

export function FormField({ id, label, isRequired = false, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[12.5px] font-semibold text-ink">
        {label}
        {isRequired ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={getFieldErrorId(id)} className="animate-in text-sm text-danger duration-150 fade-in-0 slide-in-from-top-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}
