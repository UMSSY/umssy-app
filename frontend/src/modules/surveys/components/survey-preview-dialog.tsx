"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import type { SurveyPreviewDialogProps } from "../types/survey-component-props.types";
import { formatDisplayDate } from "../utils/survey-dates";
import { PreviewQuestion } from "./preview-question";

export function SurveyPreviewDialog({ open, survey, careerTitle, onOpenChange }: SurveyPreviewDialogProps) {
  const title = (survey.title ?? "").trim() || SURVEY_TEXT.untitledSurvey;
  const description = (survey.description ?? "").trim();
  const details = [
    careerTitle,
    survey.academicPeriod,
    survey.opensAt && survey.closesAt
      ? `${formatDisplayDate(survey.opensAt)} - ${formatDisplayDate(survey.closesAt)}`
      : "",
  ].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[90vh] gap-3 overflow-y-auto bg-surface-soft p-4 sm:max-w-2xl sm:p-6">
        <p className="flex items-center gap-2 rounded-md bg-interaction px-3 py-2 text-xs text-accent">
          <Info aria-hidden="true" className="size-4 shrink-0" />
          {SURVEY_MESSAGES.previewNotice}
        </p>
        <div className="rounded-lg border border-t-8 border-border border-t-accent bg-surface p-5">
          <DialogTitle className="font-tight text-2xl font-semibold text-ink">{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-2 text-sm whitespace-pre-line text-ink-soft">{description}</DialogDescription>
          )}
          {details.length > 0 && <p className="mt-3 text-xs text-text-secondary">{details.join(" · ")}</p>}
        </div>
        {(survey.questions ?? []).map((question, index) => (
          <PreviewQuestion key={question.id} question={question} index={index} />
        ))}
        <div className="flex justify-end">
          <DialogClose render={<Button variant="outline" className="bg-surface" />}>{SURVEY_TEXT.close}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
