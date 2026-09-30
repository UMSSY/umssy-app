import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function getErrorId(id: string): string {
  return `${id}-error`;
}

export function FormField({ id, label, required = false, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-ink">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={getErrorId(id)} className="text-[12.5px] text-accent">
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="text-[12px] text-text-secondary">{hint}</p> : null}
    </div>
  );
}
