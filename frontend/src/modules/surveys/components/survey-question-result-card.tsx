import { Badge } from "@/components/ui/badge";
import type { SurveyQuestionResultCardProps } from "../types/survey-component-props.types";
import { SurveyHorizontalBars } from "./survey-horizontal-bars";

export function SurveyQuestionResultCard({ question }: SurveyQuestionResultCardProps) {
  const maxVotes = Math.max(...question.options.map((o) => o.count), 0);
  const highestOption = maxVotes > 0 ? question.options.find((o) => o.count === maxVotes) : undefined;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-soft text-xs font-semibold text-text-secondary">
            {question.position}
          </span>
          <div>
            <h3 className="leading-snug font-medium text-ink">{question.statement}</h3>
            <p className="mt-1 text-xs text-text-secondary">
              {question.answeredCount} respuestas registradas
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs text-text-secondary">
          {question.type === "single_choice" ? "Opción única" : "Opción múltiple"}
        </Badge>
      </div>

      <div className="pt-2">
        <SurveyHorizontalBars options={question.options} highlightedId={highestOption?.id} />
      </div>
    </div>
  );
}
