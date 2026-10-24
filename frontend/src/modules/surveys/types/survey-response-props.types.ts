import type { SurveyResponseQuestion } from "./survey-response.types";

export interface SurveyResponseViewProps {
  surveyId: string;
}

export interface AnswerQuestionProps {
  question: SurveyResponseQuestion;
  value: string[];
  error?: string;
  onChange: (questionId: string, value: string[]) => void;
}
