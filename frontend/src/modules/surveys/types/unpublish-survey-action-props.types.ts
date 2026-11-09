import type { SurveySummary } from "./survey-summary.types";

export interface UnpublishSurveyActionProps {
  survey: Pick<SurveySummary, "id" | "title" | "responseCount">;
  compact?: boolean;
  className?: string;
}
