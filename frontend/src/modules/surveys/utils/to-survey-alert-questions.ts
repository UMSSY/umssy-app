import type { SurveyAlertQuestion } from "../types/survey-alert-question.types";
import type { SurveyQuestionStatistic } from "../types/survey-question-statistic.types";

export function toSurveyAlertQuestions(questions: SurveyQuestionStatistic[] | undefined): SurveyAlertQuestion[] {
  return [...(questions ?? [])]
    .sort((first, second) => first.position - second.position)
    .map((question) => ({ id: question.id, code: `P${question.position}`, text: question.statement }));
}
