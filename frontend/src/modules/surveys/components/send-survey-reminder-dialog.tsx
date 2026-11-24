"use client";

import { Loader2, Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SURVEY_PARTICIPATION_TEXT } from "../constants/survey-participation.constants";
import type { SendSurveyReminderDialogProps } from "../types/send-survey-reminder-dialog-props.types";

export function SendSurveyReminderDialog({
  open,
  pendingCount,
  audienceLabel,
  isSending,
  onOpenChange,
  onConfirm,
}: SendSurveyReminderDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSending) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className="data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-ink">{SURVEY_PARTICIPATION_TEXT.confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-left text-text-secondary">
            {SURVEY_PARTICIPATION_TEXT.confirmDescription(pendingCount, audienceLabel)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>{SURVEY_PARTICIPATION_TEXT.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSending} aria-busy={isSending}>
            {isSending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Send aria-hidden="true" />}
            {isSending ? SURVEY_PARTICIPATION_TEXT.sendingReminder : SURVEY_PARTICIPATION_TEXT.confirmAction}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
