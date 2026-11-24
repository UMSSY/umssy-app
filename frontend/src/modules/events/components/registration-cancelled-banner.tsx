import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RegistrationCancelledBannerProps } from '../types/registration-cancelled-banner-props.types';

export function RegistrationCancelledBanner({
  onDismiss,
}: RegistrationCancelledBannerProps) {
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-ink"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <CheckCircle2
          className="size-4 shrink-0 text-success"
          aria-hidden="true"
        />
        <p className="font-medium text-ink">
          Tu inscripción ha sido cancelada correctamente.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Cerrar notificación"
        onClick={onDismiss}
        className="shrink-0 text-ink hover:bg-success/15"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}