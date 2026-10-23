"use client";

import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SurveyStatisticsTable } from "../components/survey-statistics-table";
import { useSurveys } from "../hooks/use-surveys";

export function SurveyStatisticsView() {
  const { surveys, isLoading, hasError } = useSurveys();

  return (
    <WorkspacePage
      title="Estadísticas de encuestas"
      description="Consulta los resultados, la participación y las métricas de cada encuesta."
    >
      <SurveyStatisticsTable
        surveys={surveys}
        isLoading={isLoading}
        hasError={hasError}
      />
    </WorkspacePage>
  );
}
