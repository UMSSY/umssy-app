import type { ProposalFieldProps } from '../types/proposal-field-props.types';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

export function ProposalField({ id, label, error, required = true, children }: ProposalFieldProps) {
  return (
    <Field className="min-w-0" data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="font-semibold text-ink">
        {label}{required && <span aria-hidden="true" className="text-ink">*</span>}
      </FieldLabel>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
