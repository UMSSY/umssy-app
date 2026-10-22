"use client";

import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { SURVEY_STATUS_LABELS } from "../constants/surveys.constants";
import type { SurveyStatusCellProps } from "../types/survey-status-cell-props.types";
import { getToggledSurveyStatus, isSurveyActive } from "../utils/survey-status";
import { SurveyStatusBadge } from "./survey-status-badge";

// Toggle "Activa / Inactiva" del historial. Un borrador todavía no se puede activar, así que muestra su estado.
export function SurveyStatusCell({ survey, pendingStatus, onToggle }: SurveyStatusCellProps) {
  const labelId = useId();
  const nextStatus = getToggledSurveyStatus(survey.status);

  if (!nextStatus) return <SurveyStatusBadge status={survey.status} />;

  const shownStatus = pendingStatus ?? survey.status;

  return (
    <span className="flex items-center gap-2">
      <Switch
        checked={isSurveyActive(shownStatus)}
        disabled={pendingStatus !== undefined}
        onCheckedChange={() => onToggle({ id: survey.id, status: nextStatus })}
        aria-labelledby={labelId}
        aria-description={survey.title}
      />
      <span id={labelId} className="text-sm text-ink-soft">
        {SURVEY_STATUS_LABELS[shownStatus]}
      </span>
    </span>
  );
}
