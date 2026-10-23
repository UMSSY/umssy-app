import Link from "next/link";
import { cn } from "cn";
import { ChartNoAxesCombined } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SURVEY_ANALYTICS_MESSAGES } from "../constants/survey-analytics.constants";
import { SURVEYS_BASE_PATH } from "../constants/surveys.constants";
import { SurveyEmptyState } from "../components/survey-empty-state";

// Las estadísticas son por encuesta: esta página orienta al administrador hacia el historial para elegir una.
export function SurveyStatisticsView() {
  return (
    <WorkspacePage title="Estadísticas de encuestas" description="Consulta los resultados y la participación de cada encuesta.">
      <SurveyEmptyState icon={ChartNoAxesCombined} title="Elige una encuesta" description={SURVEY_ANALYTICS_MESSAGES.pickSurvey} />
      <div className="flex justify-center">
        <Link href={SURVEYS_BASE_PATH} className={cn(buttonVariants(), "bg-ink text-surface hover:bg-ink-soft")}>
          Ir al historial de encuestas
        </Link>
      </div>
    </WorkspacePage>
  );
}
