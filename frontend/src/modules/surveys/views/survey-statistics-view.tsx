import { ChartNoAxesCombined } from "lucide-react";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SurveyEmptyState } from "../components/survey-empty-state";

export function SurveyStatisticsView() {
  return (
    <WorkspacePage title="Estadísticas de encuestas" description="Consulta los resultados y la participación de cada encuesta.">
      <SurveyEmptyState
        icon={ChartNoAxesCombined}
        title="Todavía no hay estadísticas"
        description="Cuando las encuestas reciban respuestas, aquí se mostrarán sus resultados."
      />
    </WorkspacePage>
  );
}
