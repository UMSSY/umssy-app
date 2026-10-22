import { SquarePlus } from "lucide-react";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SurveyEmptyState } from "../components/survey-empty-state";

export function CreateSurveyView() {
  return (
    <WorkspacePage title="Crear encuesta" description="Define las preguntas y el público de una nueva encuesta.">
      <SurveyEmptyState
        icon={SquarePlus}
        title="Formulario en desarrollo"
        description="Aquí podrás crear una encuesta, agregar sus preguntas y elegir a quién va dirigida."
      />
    </WorkspacePage>
  );
}
