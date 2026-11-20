import type { QuestionType } from "./question-type.types";
import type { SurveyOptionStatistic } from "./survey-option-statistic.types";
import type { SurveyQuestionTrend } from "./survey-question-trend.types";

export interface SurveyQuestionStatistic {
  id: string;
  position: number;
  statement: string;
  type: QuestionType;
  isRequired: boolean;
  answeredCount: number;
  totalSelections: number;
  options: SurveyOptionStatistic[];
  trend: SurveyQuestionTrend;
}
