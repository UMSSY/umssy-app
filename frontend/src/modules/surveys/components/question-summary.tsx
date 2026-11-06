import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_OPTIONS, SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { QuestionSummaryProps } from "../types/survey-component-props.types";

export function QuestionSummary({ question, index }: QuestionSummaryProps) {
  const typeOption = QUESTION_TYPE_OPTIONS.find(({ value }) => value === question.type) ?? QUESTION_TYPE_OPTIONS[0];
  const TypeIcon = typeOption.icon;
  const statement = (question.statement ?? "").trim();

  return (
    <>
      <p className="text-sm font-medium text-ink">
        {index + 1}. {statement || <span className="font-normal text-text-secondary">{SURVEY_TEXT.untitledQuestion}</span>}
        {question.isRequired && (
          <span className="ml-1 text-danger" aria-label={SURVEY_TEXT.required}>
            *
          </span>
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        <Badge variant="outline" className="h-6 gap-1.5 rounded-md bg-surface-soft px-2 font-semibold text-ink-soft">
          <TypeIcon aria-hidden="true" />
          {typeOption.label}
        </Badge>
        <span>{SURVEY_TEXT.optionsCount((question.options ?? []).length)}</span>
      </div>
    </>
  );
}
