import type { ReactNode } from "react";

interface RequiredFieldLabelProps {
  htmlFor: string;
  children: ReactNode;
  // Los campos son obligatorios por defecto; el teléfono pasa false
  isRequired?: boolean;
}

export function RequiredFieldLabel({
  htmlFor,
  children,
  isRequired = true,
}: RequiredFieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
      {children}
      {isRequired && (
        <span className="ml-0.5 text-accent" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
