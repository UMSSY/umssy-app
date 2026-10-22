import { ClipboardList } from "lucide-react";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SurveyEmptyState } from "../components/survey-empty-state";

export function SurveysView() {
  return (
    <WorkspacePage title="Encuestas" description="Crea y revisa las encuestas dirigidas a la comunidad UMSSY.">
      <SurveyEmptyState
        icon={ClipboardList}
        title="Todavía no hay encuestas"
        description="Esta sección está en desarrollo. Aquí se mostrarán las encuestas y sus resultados."
      />
    </WorkspacePage>
  );
}
