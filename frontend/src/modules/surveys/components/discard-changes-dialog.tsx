"use client";

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
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import type { DiscardChangesDialogProps } from "../types/survey-component-props.types";

export function DiscardChangesDialog({ open, onOpenChange, onConfirm }: DiscardChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-ink">{SURVEY_MESSAGES.discardDialogTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-left">{SURVEY_MESSAGES.discardDialogDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{SURVEY_TEXT.keepEditing}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {SURVEY_TEXT.discard}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
