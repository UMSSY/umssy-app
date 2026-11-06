"use client";

import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { PreviewQuestionProps } from "../types/survey-component-props.types";
import { SurveyQuestionField } from "./survey-question-field";

export function PreviewQuestion({ question, index, isReadOnly = false }: PreviewQuestionProps) {
  const statement = (question.statement ?? "").trim() || SURVEY_TEXT.untitledQuestion;
  const options = (question.options ?? []).map((option, optionIndex) => ({
    id: option.id,
    label: (option.label ?? "").trim() || SURVEY_TEXT.optionPlaceholder(optionIndex + 1),
  }));

  return (
    <SurveyQuestionField
      idPrefix="preview"
      index={index}
      isReadOnly={isReadOnly}
      question={{ ...question, statement, options }}
    />
  );
}
