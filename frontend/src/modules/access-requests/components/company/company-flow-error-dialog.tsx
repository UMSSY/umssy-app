'use client';

import {
  AlertCircle,
  AlertTriangle,
  Info,
  ServerCrash,
  WifiOff,
} from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CompanyFlowErrorDialogProps } from '../../types/company-flow-error-dialog-props.types';

const CATEGORY_SUBTITLES = {
  conflict: 'Validación de información del sistema',
  server: 'Estado del servicio',
  network: 'Conectividad',
  validation: 'Revisión de formulario',
} as const;

const FIELD_LABELS = {
  email: 'Correo electrónico de contacto',
  companyName: 'Nombre comercial / Razón social',
  activeRequest: 'Solicitud previa en curso',
} as const;

export function CompanyFlowErrorDialog({
  errorModal,
  onOpenChange,
}: CompanyFlowErrorDialogProps) {
  return (
    <Dialog open={errorModal.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full',
                errorModal.category === 'conflict' &&
                  'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
                errorModal.category === 'server' &&
                  'bg-destructive/15 text-destructive',
                errorModal.category === 'network' &&
                  'bg-muted text-muted-foreground',
                errorModal.category === 'validation' &&
                  'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
              )}
            >
              {errorModal.category === 'conflict' ? (
                <AlertTriangle className="size-5.5" />
              ) : errorModal.category === 'server' ? (
                <ServerCrash className="size-5.5" />
              ) : errorModal.category === 'network' ? (
                <WifiOff className="size-5.5" />
              ) : (
                <AlertCircle className="size-5.5" />
              )}
            </div>
            <div className="text-left">
              <DialogTitle className="text-base font-semibold text-foreground">
                {errorModal.title}
              </DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {CATEGORY_SUBTITLES[errorModal.category]}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Motivo del inconveniente
            </p>
            <p className="mt-1.5 text-sm font-medium text-foreground">
              {errorModal.message}
            </p>
            {errorModal.field ? (
              <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Campo observado:
                </span>
                <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 font-medium text-foreground">
                  {FIELD_LABELS[errorModal.field] ?? errorModal.field}
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5 rounded-lg border border-border/70 bg-surface-soft p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Info className="size-3.5 text-primary" />
              ¿Qué puedes hacer para continuar?
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {errorModal.recommendation}
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Entendido, revisar datos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
