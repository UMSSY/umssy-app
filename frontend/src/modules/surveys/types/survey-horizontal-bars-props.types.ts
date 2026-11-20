import type { SurveyOptionStatistic } from "./survey-option-statistic.types";

export interface SurveyHorizontalBarsProps {
  options: SurveyOptionStatistic[];
  highlightedId?: string;
}
