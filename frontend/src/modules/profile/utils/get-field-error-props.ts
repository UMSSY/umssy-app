import type { FieldErrorProps } from "../types/field-error-props.types";

export function getFieldErrorId(fieldId: string): string {
  return `${fieldId}-error`;
}

// Links a form control with the error message rendered by FormField.
export function getFieldErrorProps(fieldId: string, error?: string): FieldErrorProps {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? getFieldErrorId(fieldId) : undefined,
  };
}
