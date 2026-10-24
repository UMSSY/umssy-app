import type { SurveyAnswers, SurveyResponseQuestion } from "../types/survey-response.types";

export function findUnansweredQuestions(questions: SurveyResponseQuestion[], answers: SurveyAnswers): string[] {
  return questions
    .filter((question) => question.isRequired && (answers[question.id] ?? []).length === 0)
    .map((question) => question.id);
}
