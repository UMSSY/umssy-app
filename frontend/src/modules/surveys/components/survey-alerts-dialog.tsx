"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { openOfflineRoute } from "@/shared/services/offline-navigation";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import { useUnsavedChangesGuard } from "../hooks/use-unsaved-changes-guard";
import type { SurveyAlertsDialogProps } from "../types/survey-alerts-dialog-props.types";
import { DiscardChangesDialog } from "./discard-changes-dialog";
import { SurveyAlertsForm } from "./survey-alerts-form";

export function SurveyAlertsDialog({ open, onOpenChange, questions, config, isLoading, hasError, isSaving, onSave }: SurveyAlertsDialogProps) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const { pendingHref, pendingAction, clearPendingHref, clearPendingAction } = useUnsavedChangesGuard(open && isDirty);

  const closeDialog = () => {
    setIsDirty(false);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSaving) return;
    if (!nextOpen && isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const handleDiscardOpenChange = (nextOpen: boolean) => {
    if (nextOpen) return;
    setIsDiscardDialogOpen(false);
    clearPendingHref();
    clearPendingAction();
  };

  const handleConfirmDiscard = () => {
    const target = pendingHref;
    setIsDiscardDialogOpen(false);
    clearPendingHref();
    clearPendingAction();
    closeDialog();
    if (pendingAction) {
      pendingAction();
      return;
    }
    if (!target) return;
    if (navigator.onLine === false) void openOfflineRoute(target);
    else router.push(target);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-ink">
            <BellRing className="size-5 text-accent" aria-hidden="true" />
            {SURVEY_ALERTS_TEXT.title}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">{SURVEY_ALERTS_TEXT.description}</DialogDescription>
        </DialogHeader>

        {hasError ? (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {SURVEY_ALERTS_TEXT.loadError}
          </p>
        ) : isLoading || !config ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <SurveyAlertsForm
            questions={questions}
            config={config}
            isSaving={isSaving}
            onCancel={closeDialog}
            onDirtyChange={setIsDirty}
            onSave={onSave}
          />
        )}

        <DiscardChangesDialog
          open={isDiscardDialogOpen || pendingHref !== null || pendingAction !== null}
          onOpenChange={handleDiscardOpenChange}
          onConfirm={handleConfirmDiscard}
          description={SURVEY_ALERTS_TEXT.discardDescription}
        />
      </DialogContent>
    </Dialog>
  );
}
