import { cn } from "cn";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  SURVEY_PARTICIPATION_TEXT,
  SURVEY_RESPONSE_RATE_LEVEL_LABELS,
  SURVEY_RESPONSE_RATE_LEVEL_METER_CLASSES,
} from "../constants/survey-participation.constants";
import type { SurveyResponseRateCardProps } from "../types/survey-response-rate-card-props.types";
import { getResponseRateLevel } from "../utils/get-response-rate-level";
import { formatIsoDisplayDate } from "../utils/survey-dates";

export function SurveyResponseRateCard({ participation, isSendingReminder, onSendReminder }: SurveyResponseRateCardProps) {
  const { responseRate, respondedCount, eligibleCount, pendingCount, audienceLabel, lastReminderSentAt, canSendReminder } =
    participation;
  const level = getResponseRateLevel(responseRate);
  const levelLabel = SURVEY_RESPONSE_RATE_LEVEL_LABELS[level];
  const hasPending = pendingCount > 0;

  return (
    <Card className="gap-4 shadow-xs" aria-label={SURVEY_PARTICIPATION_TEXT.responseRateLabel}>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-text-secondary">{SURVEY_PARTICIPATION_TEXT.responseRateLabel}</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-tight text-4xl font-bold text-ink tabular-nums">{responseRate}%</p>
              <p className="text-sm text-ink-soft">{SURVEY_PARTICIPATION_TEXT.respondedSummary(respondedCount, eligibleCount)}</p>
              <p className="text-xs font-medium text-text-secondary">{levelLabel}</p>
            </div>
          </div>

          <Progress
            value={responseRate}
            data-level={level}
            aria-label={SURVEY_PARTICIPATION_TEXT.responseRateLabel}
            aria-valuetext={`${responseRate}% · ${levelLabel}`}
            className={cn("**:data-[slot=progress-track]:h-2.5", SURVEY_RESPONSE_RATE_LEVEL_METER_CLASSES[level])}
          />

          <p className="text-xs text-text-secondary">{SURVEY_PARTICIPATION_TEXT.audience(audienceLabel)}</p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <Button
            type="button"
            size="sm"
            onClick={onSendReminder}
            disabled={!canSendReminder || isSendingReminder}
            className="cursor-pointer gap-1.5 text-xs"
          >
            {isSendingReminder ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" aria-hidden="true" />
            )}
            {isSendingReminder
              ? SURVEY_PARTICIPATION_TEXT.sendingReminder
              : hasPending
                ? SURVEY_PARTICIPATION_TEXT.sendReminder(pendingCount)
                : SURVEY_PARTICIPATION_TEXT.noPending}
          </Button>
          <p className="text-xs text-text-secondary">
            {lastReminderSentAt
              ? SURVEY_PARTICIPATION_TEXT.lastReminder(formatIsoDisplayDate(lastReminderSentAt))
              : SURVEY_PARTICIPATION_TEXT.noReminder}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
