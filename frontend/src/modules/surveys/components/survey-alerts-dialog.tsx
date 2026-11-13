"use client";

import { BellRing } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { SURVEY_ALERTS_TEXT } from "../constants/survey-participation.constants";
import type { SurveyAlertsDialogProps } from "../types/survey-alerts-dialog-props.types";
import { SurveyAlertsForm } from "./survey-alerts-form";

export function SurveyAlertsDialog({ open, onOpenChange, questions, config, isLoading, isSaving, onSave }: SurveyAlertsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="gap-5 p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-ink">
            <BellRing className="size-5 text-accent" aria-hidden="true" />
            {SURVEY_ALERTS_TEXT.title}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">{SURVEY_ALERTS_TEXT.description}</DialogDescription>
        </DialogHeader>

        {isLoading || !config ? (
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
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
