import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

export function ProposalField({ id, label, error, required = true, children }: {
  id: string; label: string; error?: string; required?: boolean; children: ReactNode;
}) {
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
