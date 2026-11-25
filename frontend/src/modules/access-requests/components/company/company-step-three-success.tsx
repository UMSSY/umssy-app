'use client';

import { Check, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CompanyStepThreeSuccessProps } from '../../types/company-step-three-success-props.types';

export function CompanyStepThreeSuccess({
  companyName,
  requestCode,
  copiedCode,
  onCopyCode,
}: CompanyStepThreeSuccessProps) {
  return (
    <div className="space-y-6 rounded-lg border border-border bg-surface p-8 text-center">
      <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-ink">
          ¡Solicitud empresarial enviada con éxito!
        </h3>
        <p className="mx-auto max-w-md text-sm text-text-secondary">
          Hemos recibido los datos de <strong>{companyName}</strong> y su carta
          de solicitud. Revisaremos la documentación en un plazo máximo de 48
          horas hábiles.
        </p>
      </div>

      <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface-soft p-5">
        <p className="text-xs font-medium tracking-wider text-text-secondary uppercase">
          Código de seguimiento
        </p>
        <div className="mt-2.5 flex items-center justify-center gap-3">
          <span className="rounded-md border border-border bg-surface px-3.5 py-1.5 font-mono text-lg font-bold tracking-wide text-accent select-all">
            {requestCode}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCopyCode(requestCode)}
            className="h-9 gap-1.5 px-3 font-medium"
          >
            {copiedCode ? (
              <>
                <Check className="size-4 text-emerald-600" />
                <span className="text-emerald-700">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>Copiar</span>
              </>
            )}
          </Button>
        </div>
        <p className="mt-2.5 text-xs text-text-secondary">
          Guarda este código para consultar el estado de tu solicitud y activar
          tu cuenta cuando sea aprobada.
        </p>
      </div>
    </div>
  );
}
