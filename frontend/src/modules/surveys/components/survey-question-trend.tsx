import { cn } from "cn";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { SURVEY_TREND_LABELS } from "../constants/survey-statistics.constants";
import type { SurveyQuestionTrendProps } from "../types/survey-component-props.types";

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, neutral: Minus } as const;
const TREND_ICON_CLASSES = { up: "text-accent", down: "text-danger", neutral: "text-text-secondary" } as const;

// Zona inferior de cada card: la tendencia principal de la pregunta con su icono direccional.
export function SurveyQuestionTrend({ trend }: SurveyQuestionTrendProps) {
  const Icon = TREND_ICONS[trend.direction];

  return (
    <p className="mt-auto flex items-start gap-2 rounded-lg bg-surface-soft px-3 py-2.5 text-sm text-ink-soft">
      <Icon
        role="img"
        aria-label={SURVEY_TREND_LABELS[trend.direction]}
        className={cn("mt-0.5 size-4 shrink-0", TREND_ICON_CLASSES[trend.direction])}
      />
      <span>
        <span className="font-semibold text-ink">Tendencia:</span> {trend.text}
      </span>
    </p>
  );
}
