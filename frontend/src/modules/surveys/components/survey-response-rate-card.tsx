import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SURVEY_PARTICIPATION_TEXT } from "../constants/survey-participation.constants";
import type { SurveyResponseRateCardProps } from "../types/survey-response-rate-card-props.types";
import { formatIsoDisplayDate } from "../utils/survey-dates";

export function SurveyResponseRateCard({ participation, isSendingReminder, onSendReminder }: SurveyResponseRateCardProps) {
  const { responseRate, responsesReceived, totalAudience, pendingResponses, audienceLabel, lastReminderAt } = participation;
  const hasPending = pendingResponses > 0;

  return (
    <Card className="gap-4 shadow-xs" aria-label={SURVEY_PARTICIPATION_TEXT.responseRateLabel}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-text-secondary">{SURVEY_PARTICIPATION_TEXT.responseRateLabel}</p>
            <p className="font-tight text-4xl font-bold text-accent tabular-nums">{responseRate}%</p>
          </div>
          <p className="text-sm text-ink-soft">{SURVEY_PARTICIPATION_TEXT.respondedSummary(responsesReceived, totalAudience)}</p>
        </div>

        <Progress
          value={responseRate}
          aria-label={SURVEY_PARTICIPATION_TEXT.responseRateLabel}
          className="**:data-[slot=progress-indicator]:bg-primary **:data-[slot=progress-track]:h-2.5"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-secondary">{SURVEY_PARTICIPATION_TEXT.audience(audienceLabel)}</p>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button type="button" size="sm" onClick={onSendReminder} disabled={!hasPending || isSendingReminder} className="cursor-pointer gap-1.5 text-xs">
              {isSendingReminder ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Send className="size-3.5" aria-hidden="true" />}
              {isSendingReminder
                ? SURVEY_PARTICIPATION_TEXT.sendingReminder
                : hasPending
                  ? SURVEY_PARTICIPATION_TEXT.sendReminder(pendingResponses)
                  : SURVEY_PARTICIPATION_TEXT.noPending}
            </Button>
            <p className="text-xs text-text-secondary">
              {lastReminderAt
                ? SURVEY_PARTICIPATION_TEXT.lastReminder(formatIsoDisplayDate(lastReminderAt))
                : SURVEY_PARTICIPATION_TEXT.noReminder}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
