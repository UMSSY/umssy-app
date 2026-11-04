import { cn } from "cn";
import {
  SURVEY_TREND_ICON_CLASSES,
  SURVEY_TREND_ICONS,
  SURVEY_TREND_LABELS,
  SURVEY_TREND_PREFIX,
} from "../constants/survey-statistics.constants";
import type { SurveyQuestionTrendProps } from "../types/survey-component-props.types";

export function SurveyQuestionTrend({ trend }: SurveyQuestionTrendProps) {
  const Icon = SURVEY_TREND_ICONS[trend.direction];

  return (
    <p className="mt-auto flex items-start gap-2 rounded-lg bg-surface-soft px-3 py-2.5 text-sm text-ink-soft">
      <Icon
        role="img"
        aria-label={SURVEY_TREND_LABELS[trend.direction]}
        className={cn("mt-0.5 size-4 shrink-0", SURVEY_TREND_ICON_CLASSES[trend.direction])}
      />
      <span>
        <span className="font-semibold text-ink">{SURVEY_TREND_PREFIX}</span> {trend.text}
      </span>
    </p>
  );
}
