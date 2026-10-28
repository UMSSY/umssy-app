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
import { SURVEY_SUMMARY_LABELS, SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import type { PublishSurveyDialogProps } from "../types/survey-component-props.types";
import { formatDisplayDate } from "../utils/survey-dates";
import { SurveySummaryRow } from "./survey-summary-row";

export function PublishSurveyDialog({
  open,
  survey,
  careerTitle,
  isPublishing,
  onOpenChange,
  onConfirm,
}: PublishSurveyDialogProps) {
  const questions = survey.questions ?? [];
  const requiredCount = questions.filter(({ isRequired }) => isRequired).length;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPublishing) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className="data-[size=default]:max-w-md data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-ink">{SURVEY_MESSAGES.publishDialogTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-left text-text-secondary">
            {SURVEY_MESSAGES.publishDialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <dl className="rounded-lg border border-border bg-surface-soft px-3 py-1">
          <SurveySummaryRow label={SURVEY_SUMMARY_LABELS.survey}>{(survey.title ?? "").trim()}</SurveySummaryRow>
          <SurveySummaryRow label={SURVEY_SUMMARY_LABELS.career}>{careerTitle}</SurveySummaryRow>
          <SurveySummaryRow label={SURVEY_SUMMARY_LABELS.schedule}>
            {formatDisplayDate(survey.opensAt)} - {formatDisplayDate(survey.closesAt)}
          </SurveySummaryRow>
          <SurveySummaryRow label={SURVEY_SUMMARY_LABELS.questions}>{SURVEY_TEXT.questionsSummary(questions.length, requiredCount)}</SurveySummaryRow>
        </dl>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPublishing}>{SURVEY_TEXT.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPublishing} aria-busy={isPublishing}>
            {isPublishing ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {isPublishing ? SURVEY_TEXT.publishing : SURVEY_TEXT.confirmPublish}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
