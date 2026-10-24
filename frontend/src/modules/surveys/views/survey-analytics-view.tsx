"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, Clock, Download, FileText, Loader2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportSuccessToast } from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { downloadFile } from "@/shared/utils/download-file";
import { SurveyQuestionResultCard } from "../components/survey-question-result-card";
import { SURVEY_STATUS_BADGE_CLASSES, SURVEY_STATUS_LABELS } from "../constants/survey-builder.constants";
import {
  SURVEY_PDF_FEEDBACK_DURATION_MS,
  SURVEY_STATISTICS_QUESTION_SKELETONS,
  SURVEY_STATISTICS_SUMMARY_SKELETONS,
} from "../constants/survey-statistics.constants";
import { SURVEYS_PATH } from "../constants/survey-routes.constants";
import { useSurveyStatistics } from "../hooks/use-survey-statistics";
import { surveysService } from "../services/surveys.service";
import type { SurveyAnalyticsViewProps } from "../types/survey-component-props.types";
import { formatIsoDisplayDate } from "../utils/survey-dates";

export function SurveyAnalyticsView({ id }: SurveyAnalyticsViewProps) {
  const { statistics, isLoading, hasError, refetch } = useSurveyStatistics(id);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(undefined), SURVEY_PDF_FEEDBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleGeneratePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const { file, fileName } = await surveysService.exportSurveyPdf(id);
      downloadFile(file, fileName);
      setSuccessMessage("PDF generado correctamente");
    } catch {
      toast.error("No se pudo generar el reporte en PDF. Inténtalo de nuevo.", {
        duration: SURVEY_PDF_FEEDBACK_DURATION_MS,
        closeButton: true,
        richColors: true,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <WorkspacePage title="Cargando métricas..." description="Obteniendo resultados de la encuesta...">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: SURVEY_STATISTICS_SUMMARY_SKELETONS }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: SURVEY_STATISTICS_QUESTION_SKELETONS }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </WorkspacePage>
    );
  }

  if (hasError || !statistics) {
    return (
      <WorkspacePage title="Error al cargar métricas" description="No se pudieron obtener las estadísticas de la encuesta.">
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
          <p className="text-sm font-medium text-destructive">No se pudo encontrar la encuesta o cargar sus métricas.</p>
          <Link
            href={SURVEYS_PATH}
            className={buttonVariants({ variant: "outline", className: "mt-4 gap-2 text-xs" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a encuestas
          </Link>
        </div>
      </WorkspacePage>
    );
  }

  const careerName = statistics.career?.title ?? "Todas las carreras";
  const period = statistics.academicPeriod ?? "Sin gestión";

  return (
    <WorkspacePage
      title={`Analíticas: ${statistics.title}`}
      description={`${careerName} · Gestión ${period} · ${statistics.questions.length} preguntas`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="cursor-pointer gap-1.5 text-xs font-semibold shadow-xs"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="size-3.5" aria-hidden="true" />
                Generar PDF
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="cursor-pointer gap-1.5 text-xs text-ink-soft hover:text-ink"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Actualizar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">

        <div>
          <Link
            href={SURVEYS_PATH}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "gap-1.5 text-xs text-text-secondary hover:text-ink -ml-2",
            })}
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Volver a encuestas
          </Link>
        </div>

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

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <BarChart3 className="size-5 text-primary" aria-hidden="true" />
              Resultados por pregunta
            </h2>
            <span className="text-xs text-text-secondary">
              {statistics.questions.length} {statistics.questions.length === 1 ? "pregunta analizada" : "preguntas analizadas"}
            </span>
          </div>

          {statistics.totalResponses === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 text-center text-text-secondary">
              <BarChart3 className="mb-2 size-10 stroke-[1.5] text-text-secondary/60" aria-hidden="true" />
              <p className="font-medium text-ink">Esta encuesta aún no ha recibido respuestas</p>
              <p className="mt-1 text-xs text-text-secondary">
                Cuando los titulados completen la encuesta, aquí se graficarán los porcentajes de cada opción.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {statistics.questions.map((question) => (
                <SurveyQuestionResultCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ExportSuccessToast message={successMessage} />
    </WorkspacePage>
  );
}
