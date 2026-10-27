"use client";

import { useContext } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { useSurveyNotifications } from "../hooks/use-survey-notifications";

function PendingSurveysCount() {
  const { pendingCount } = useSurveyNotifications();

  if (pendingCount === 0) return null;

  return (
    <span
      aria-label={`${pendingCount} encuestas pendientes`}
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-danger text-xs font-bold text-surface"
    >
      {pendingCount}
    </span>
  );
}

export function PendingSurveysBadge() {
  const queryClient = useContext(QueryClientContext);
  return queryClient ? <PendingSurveysCount /> : null;
}
