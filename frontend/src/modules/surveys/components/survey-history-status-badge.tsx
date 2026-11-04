import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { SURVEY_HISTORY_STATUS_CLASSES, SURVEY_HISTORY_STATUS_LABELS } from "../constants/survey-history.constants";
import type { SurveyHistoryStatusBadgeProps } from "../types/survey-history-component-props.types";

export function SurveyHistoryStatusBadge({ status }: SurveyHistoryStatusBadgeProps) {
  return (
    <Badge className={cn("h-7 rounded-full px-3 text-sm font-medium", SURVEY_HISTORY_STATUS_CLASSES[status])}>
      {SURVEY_HISTORY_STATUS_LABELS[status]}
    </Badge>
  );
}
