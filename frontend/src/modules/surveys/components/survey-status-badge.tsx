import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { SURVEY_STATUS_BADGE_CLASSES, SURVEY_STATUS_LABELS } from "../constants/surveys.constants";
import type { SurveyStatusBadgeProps } from "../types/survey-status-badge-props.types";

export function SurveyStatusBadge({ status }: SurveyStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("h-6 px-2.5 text-xs font-semibold", SURVEY_STATUS_BADGE_CLASSES[status])}>
      {SURVEY_STATUS_LABELS[status]}
    </Badge>
  );
}
