import type { ProposalFieldProps } from '../types/proposal-field-props.types';
import { Label } from '@/components/ui/label';

export function ProposalField({ id, label, error, required = true, children }: ProposalFieldProps) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="font-semibold text-ink">
        {label}{required && <span aria-hidden="true" className="text-ink">*</span>}
      </Label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
