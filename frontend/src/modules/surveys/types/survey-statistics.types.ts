import type { SurveyDisplayStatus } from "./survey-display-status.types";
import type { Career } from "./career.types";
import type { SurveyQuestionStatistic } from "./survey-question-statistic.types";

export interface SurveyStatistics {
  id: string;
  title: string;
  description: string | null;
  status: SurveyDisplayStatus;
  academicPeriod: string | null;
  career: Career | null;
  opensAt: string | null;
  closesAt: string | null;
  totalResponses: number;
  hasData: boolean;
  period: string | null;
  availablePeriods: string[];
  questions: SurveyQuestionStatistic[];
}
