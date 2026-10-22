import Link from "next/link";
import { cn } from "cn";
import { Eye, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getSurveyEditPath, getSurveyStatisticsPath } from "../constants/surveys.constants";
import type { SurveyRowActionProps, SurveyRowActionsProps } from "../types/survey-row-actions-props.types";
import { canEditSurvey, hasSurveyStatistics } from "../utils/survey-status";

const ACTION_CLASSES = "size-9 rounded-md border-border text-ink-soft hover:text-ink";

function RowAction({ href, label, icon: Icon }: SurveyRowActionProps) {
  const classes = cn(buttonVariants({ variant: "outline", size: "icon" }), ACTION_CLASSES);

  if (!href) {
    return (
      <span aria-disabled="true" aria-label={label} title={label} className={cn(classes, "cursor-not-allowed opacity-40")}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} title={label} className={classes}>
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}

// Ojo: estadísticas (solo si ya fue publicada). Lápiz: editar (solo borradores).
export function SurveyRowActions({ survey }: SurveyRowActionsProps) {
  const statisticsHref = hasSurveyStatistics(survey.status) ? getSurveyStatisticsPath(survey.id) : null;
  const editHref = canEditSurvey(survey.status) ? getSurveyEditPath(survey.id) : null;

  return (
    <span className="flex items-center gap-2">
      <RowAction
        href={statisticsHref}
        icon={Eye}
        label={statisticsHref ? `Ver estadísticas de ${survey.title}` : "Las estadísticas estarán disponibles al publicarla"}
      />
      <RowAction
        href={editHref}
        icon={Pencil}
        label={editHref ? `Editar ${survey.title}` : "Una encuesta publicada ya no se puede editar"}
      />
    </span>
  );
}
