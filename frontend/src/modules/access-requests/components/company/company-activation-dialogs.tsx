'use client';

import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CompanyActivationDialogsProps } from '../../types/company-activation-dialogs-props.types';

export function CompanyActivationDialogs({
  officialData,
  isReportOpen,
  reportObservation,
  reportStatus,
  reportMessage,
  isConfirmModalOpen,
  isActivating,
  onReportOpenChange,
  onReportObservationChange,
  onSendReport,
  onConfirmOpenChange,
  onConfirmActivation,
}: CompanyActivationDialogsProps) {
  return (
    <>
      <Dialog open={isReportOpen} onOpenChange={onReportOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-tight text-lg font-bold text-ink">
              <AlertTriangle className="size-5 text-amber-600" />
              Reportar Inconsistencia en Datos
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Si detecta errores tipográficos o datos discrepantes con la
              documentación de su empresa, descríbalos a continuación. La
              administración recibirá su observación formalmente.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            <Label
              htmlFor="report-obs"
              className="text-xs font-semibold text-ink"
            >
              Detalle de la observación *
            </Label>
            <Textarea
              id="report-obs"
              rows={4}
              placeholder="Ej. El número de teléfono corporativo debe ser corregido a..."
              value={reportObservation}
              onChange={(e) => onReportObservationChange(e.target.value)}
              className="text-xs text-ink"
            />
            {reportMessage && (
              <p
                className={`text-xs font-medium ${
                  reportStatus === 'success'
                    ? 'text-emerald-600'
                    : 'text-destructive'
                }`}
              >
                {reportMessage}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="cancel"
              size="sm"
              onClick={() => onReportOpenChange(false)}
              disabled={reportStatus === 'sending'}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="institutional"
              size="sm"
              onClick={onSendReport}
              disabled={reportStatus === 'sending' || !reportObservation.trim()}
            >
              {reportStatus === 'sending' ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmModalOpen}
        onOpenChange={(open) => !isActivating && onConfirmOpenChange(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-tight text-lg font-bold text-ink">
              ¿Confirmar activación institucional?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se registrará formalmente la empresa{' '}
              <strong>{officialData?.companyName}</strong> y se habilitará el
              usuario <strong>@{officialData?.username}</strong> con el correo{' '}
              <strong>{officialData?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <p className="mt-2 text-xs text-muted-foreground">
            Esta acción creará formalmente su usuario en el sistema. Asegúrese de
            recordar la contraseña ingresada.
          </p>

          <DialogFooter className="mt-5 gap-2">
            <Button
              type="button"
              variant="cancel"
              onClick={() => onConfirmOpenChange(false)}
              disabled={isActivating}
            >
              Revisar Datos
            </Button>
            <Button
              type="button"
              variant="institutional"
              onClick={onConfirmActivation}
              disabled={isActivating}
              className="font-bold"
            >
              {isActivating ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Activando...
                </span>
              ) : (
                'Confirmar y Finalizar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
