"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatDateTime } from "@/shared/utils/date.utils";
import { SURVEY_HISTORY_TEXT } from "../constants/survey-history.constants";
import type { SurveyHistoryDetailDialogProps } from "../types/survey-history-component-props.types";
import { SurveyCreatorCell } from "./survey-creator-cell";
import { SurveyHistoryStatusBadge } from "./survey-history-status-badge";

export function SurveyHistoryDetailDialog({ survey, onOpenChange }: SurveyHistoryDetailDialogProps) {
  return (
    <Dialog open={survey !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-4 bg-surface p-5 sm:max-w-lg sm:p-6">
        {survey && (
          <>
            <div className="rounded-lg border border-t-8 border-border border-t-accent bg-surface p-5">
              <DialogTitle className="font-tight text-xl font-semibold text-ink">{survey.title}</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-ink-soft">{survey.description}</DialogDescription>
            </div>

            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="mb-1 text-xs text-text-secondary">{SURVEY_HISTORY_TEXT.creator}</dt>
                <dd>
                  <SurveyCreatorCell fullName={survey.creator.fullName} email={survey.creator.email} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">{SURVEY_HISTORY_TEXT.academicPeriod}</dt>
                <dd className="font-medium text-ink">{survey.academicPeriod}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">{SURVEY_HISTORY_TEXT.career}</dt>
                <dd className="font-medium text-ink">{survey.careerTitle ?? SURVEY_HISTORY_TEXT.allCareers}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">{SURVEY_HISTORY_TEXT.createdAt}</dt>
                <dd className="font-medium text-ink tabular-nums">{formatDateTime(survey.createdAt)}</dd>
              </div>
              <div>
                <dt className="mb-1 text-xs text-text-secondary">{SURVEY_HISTORY_TEXT.status}</dt>
                <dd>
                  <SurveyHistoryStatusBadge status={survey.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">{SURVEY_HISTORY_TEXT.questions}</dt>
                <dd className="font-medium text-ink tabular-nums">{survey.questionCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">{SURVEY_HISTORY_TEXT.responses}</dt>
                <dd className="font-medium text-ink tabular-nums">{survey.responseCount}</dd>
              </div>
            </dl>

            <div className="flex justify-end">
              <DialogClose render={<Button variant="outline" className="bg-surface" />}>
                {SURVEY_HISTORY_TEXT.close}
              </DialogClose>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
