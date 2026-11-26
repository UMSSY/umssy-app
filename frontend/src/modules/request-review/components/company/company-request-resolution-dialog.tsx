"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPANY_CORRECTION_REASONS,
  COMPANY_REJECTION_REASONS,
} from "../../constants/company-request.constants";
import type { CompanyResolutionDialogProps } from "../../types/company-resolution-dialog-props.types";
import { CompanyRequestEditSection } from "./company-request-edit-section";

export function CompanyRequestResolutionDialog({
  open,
  onOpenChange,
  item,
  cityName,
  ocrPercentage,
  canResolve,
  submitting,
  activeAction,
  onSelectAction,
  correctionCategory,
  onChangeCorrectionCategory,
  correctionDetails,
  onChangeCorrectionDetails,
  rejectionCategory,
  onChangeRejectionCategory,
  rejectionDetails,
  onChangeRejectionDetails,
  onApprove,
  onCorrection,
  onReject,
  isEditingFicha,
  isSavingEdit,
  isDataModifiedFromInitial,
  editForm,
  onChangeEditForm,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onResetInitialData,
}: CompanyResolutionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-editor-dialog w-full flex-col overflow-hidden p-0 sm:max-w-2xl md:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-base font-bold text-ink">
                Resolución de Solicitud
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                Expediente:{" "}
                <strong className="text-ink">{item.companyName}</strong> (
                {item.requestCode})
              </DialogDescription>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs font-semibold text-ink">
              <ShieldCheck
                className="size-3.5 text-emerald-600"
                aria-hidden="true"
              />
              <span>{ocrPercentage}% Afinidad OCR</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <CompanyRequestEditSection
            item={item}
            cityName={cityName}
            isEditing={isEditingFicha}
            isSavingEdit={isSavingEdit}
            isDataModifiedFromInitial={isDataModifiedFromInitial}
            editForm={editForm}
            onChangeForm={onChangeEditForm}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onResetInitialData={onResetInitialData}
          />

          {activeAction === "APPROVE" && (
            <div className="rounded-xl border border-border bg-surface p-4.5 text-xs shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Dictamen: Aprobación
                </span>
                <h4 className="text-sm font-bold text-ink">
                  Confirmación de Alta Oficial
                </h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                Al confirmar, se registrará formalmente la empresa en el sistema
                y se creará el usuario reclutador{" "}
                <strong className="text-ink">@{item.username}</strong>. Se
                enviará de inmediato el código de activación institucional a{" "}
                <strong className="text-ink">{item.email}</strong>.
              </p>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAction(null)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="institutional"
                  size="sm"
                  onClick={onApprove}
                  disabled={submitting}
                >
                  {submitting ? "Aprobando..." : "Confirmar aprobación"}
                </Button>
              </div>
            </div>
          )}

          {activeAction === "CORRECTION" && (
            <div className="space-y-3.5 rounded-xl border border-border bg-surface p-4.5 text-xs shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                  Dictamen: Subsanación
                </span>
                <h4 className="text-sm font-bold text-ink">
                  Solicitud de Observación Documental
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">
                La solicitud pasará a estado de observación y el representante
                podrá ingresar con su código{" "}
                <strong className="text-ink">{item.requestCode}</strong> para
                corregir los requisitos.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-ink">
                  Motivo principal de la observación:
                </Label>
                <RadioGroup
                  value={correctionCategory}
                  onValueChange={onChangeCorrectionCategory}
                  className="space-y-1.5"
                >
                  {COMPANY_CORRECTION_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface p-2 text-xs text-ink hover:bg-surface-soft"
                    >
                      <RadioGroupItem value={reason} />
                      <span>{reason}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-ink">
                  Detalle específico e instrucciones para la empresa *
                </Label>
                <Textarea
                  rows={3}
                  value={correctionDetails}
                  onChange={(e) => onChangeCorrectionDetails(e.target.value)}
                  placeholder="Describe con precisión qué debe corregir o adjuntar..."
                  className="text-xs"
                />
                <p className="text-[11px] text-text-secondary">
                  Mínimo 5 caracteres ({correctionDetails.trim().length}{" "}
                  ingresados).
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAction(null)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={onCorrection}
                  disabled={submitting || correctionDetails.trim().length < 5}
                >
                  {submitting ? "Enviando..." : "Enviar subsanación"}
                </Button>
              </div>
            </div>
          )}

          {activeAction === "REJECT" && (
            <div className="space-y-3.5 rounded-xl border border-border bg-surface p-4.5 text-xs shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  Dictamen: Rechazo
                </span>
                <h4 className="text-sm font-bold text-ink">
                  Fundamentación de Rechazo
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">
                Esta acción concluye el trámite de forma definitiva y enviará la
                notificación formal al correo{" "}
                <strong className="text-ink">{item.email}</strong>.
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-ink">
                  Causal institucional de rechazo:
                </Label>
                <RadioGroup
                  value={rejectionCategory}
                  onValueChange={onChangeRejectionCategory}
                  className="space-y-1.5"
                >
                  {COMPANY_REJECTION_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface p-2 text-xs text-ink hover:bg-surface-soft"
                    >
                      <RadioGroupItem value={reason} />
                      <span>{reason}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-ink">
                  Fundamentación oficial del rechazo *
                </Label>
                <Textarea
                  rows={3}
                  value={rejectionDetails}
                  onChange={(e) => onChangeRejectionDetails(e.target.value)}
                  placeholder="Detalla los motivos formales del dictamen..."
                  className="text-xs"
                />
                <p className="text-[11px] text-text-secondary">
                  Mínimo 5 caracteres ({rejectionDetails.trim().length}{" "}
                  ingresados).
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAction(null)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onReject}
                  disabled={submitting || rejectionDetails.trim().length < 5}
                >
                  {submitting ? "Rechazando..." : "Confirmar rechazo"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {canResolve && (
          <DialogFooter className="shrink-0 border-t border-border bg-surface p-4">
            {activeAction === null ? (
              <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="institutional"
                  onClick={() => onSelectAction("APPROVE")}
                  disabled={submitting || isSavingEdit}
                  className="w-full sm:flex-1"
                >
                  Aprobar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onSelectAction("CORRECTION")}
                  disabled={submitting || isSavingEdit}
                  className="w-full sm:flex-1"
                >
                  Solicitar subsanación
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onSelectAction("REJECT")}
                  disabled={submitting || isSavingEdit}
                  className="w-full sm:flex-1"
                >
                  Rechazar
                </Button>
              </div>
            ) : (
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-text-secondary">
                  Configurando dictamen seleccionado...
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAction(null)}
                  disabled={submitting}
                >
                  Volver a opciones de dictamen
                </Button>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
