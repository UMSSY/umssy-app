import { CheckCircle2, Clock, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SURVEY_STATUS_BADGE_CLASSES, SURVEY_STATUS_LABELS } from "../constants/survey-builder.constants";
import type { SurveyStatisticsSummaryProps } from "../types/survey-statistics-summary-props.types";
import { formatIsoDisplayDate } from "../utils/survey-dates";

export function SurveyStatisticsSummary({ statistics }: SurveyStatisticsSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-interaction text-accent">
          <Users className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-secondary">Respuestas Recibidas</p>
          <p className="text-2xl font-bold text-ink tabular-nums">{statistics.totalResponses}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-text-secondary">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-secondary">Preguntas Formuladas</p>
          <p className="text-2xl font-bold text-ink tabular-nums">{statistics.questions.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-text-secondary">
          <CheckCircle2 className="size-5 text-accent" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-secondary">Estado de Encuesta</p>
          <div className="mt-1">
            <Badge className={SURVEY_STATUS_BADGE_CLASSES[statistics.status]}>{SURVEY_STATUS_LABELS[statistics.status]}</Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-text-secondary">
          <Clock className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium text-text-secondary">Vigencia</p>
          <p className="mt-0.5 text-xs font-medium text-ink">
            {statistics.opensAt && statistics.closesAt
              ? `${formatIsoDisplayDate(statistics.opensAt)} - ${formatIsoDisplayDate(statistics.closesAt)}`
              : "Sin fechas definidas"}
          </p>
        </div>
      </div>
    </div>
  );
}
