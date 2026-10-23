import { TrendingUp } from "lucide-react";
import { SURVEY_QUESTION_TYPE_LABELS } from "../constants/survey-form.constants";
import type { SurveyQuestionResultCardProps } from "../types/survey-question-result-card-props.types";
import { buildQuestionTrend } from "../utils/build-question-trend";
import { getHighlightedOptionId } from "../utils/get-highlighted-option-id";
import { SurveyColumnBars } from "./survey-column-bars";
import { SurveyHorizontalBars } from "./survey-horizontal-bars";

// Una tarjeta por pregunta (HU4). Se genera con las preguntas y opciones reales de cada encuesta.
export function SurveyQuestionResultCard({ question }: SurveyQuestionResultCardProps) {
  const highlightedId = getHighlightedOptionId(question.options);
  const isMultiple = question.type === "MULTIPLE_CHOICE";
  const unit = isMultiple ? "selecciones" : "respuestas";
  const trend = buildQuestionTrend(question);
  const Chart = question.type === "DROPDOWN" ? SurveyColumnBars : SurveyHorizontalBars;

  return (
    <article aria-labelledby={`question-result-${question.id}`} className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <header className="flex items-start gap-3">
        <span className="shrink-0 rounded-md bg-ink px-2 py-0.5 text-xs font-bold text-surface">P{question.order}</span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 id={`question-result-${question.id}`} className="text-base font-semibold text-ink">
            {question.text}
          </h3>
          <p className="text-xs text-text-secondary">
            {SURVEY_QUESTION_TYPE_LABELS[question.type]} · {question.answeredBy} titulados respondieron
            {isMultiple && ` · porcentaje sobre ${question.totalSelections} selecciones`}
          </p>
        </div>
      </header>

      <Chart options={question.options} highlightedId={highlightedId} unit={unit} />

      {trend && (
        <p className="mt-auto flex gap-2 rounded-md bg-surface-soft p-3 text-sm text-ink-soft">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <span>
            <span className="font-semibold text-ink">Tendencia:</span> {trend}
          </span>
        </p>
      )}
    </article>
  );
}
