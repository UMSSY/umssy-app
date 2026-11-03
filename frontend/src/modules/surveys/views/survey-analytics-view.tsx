"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { ArrowLeft, BarChart3, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { ExportSuccessToast } from "@/modules/reports";
import { downloadFile } from "@/shared/utils/download-file";
import { SurveyAnalyticsHeader } from "../components/survey-analytics-header";
import { SurveyPeriodFilter } from "../components/survey-period-filter";
import { SurveyQuestionResultCard } from "../components/survey-question-result-card";
import { SurveyStatisticsSkeleton } from "../components/survey-statistics-skeleton";
import { SurveyStatisticsSummary } from "../components/survey-statistics-summary";
import { SURVEY_PDF_FEEDBACK_DURATION_MS, SURVEY_STATISTICS_TEXT } from "../constants/survey-statistics.constants";
import { SURVEYS_PATH } from "../constants/survey-routes.constants";
import { useSurveyStatistics } from "../hooks/use-survey-statistics";
import { surveysService } from "../services/surveys.service";
import type { SurveyAnalyticsViewProps } from "../types/survey-component-props.types";

export function SurveyAnalyticsView({ id }: SurveyAnalyticsViewProps) {
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const { statistics, availablePeriods, isLoading, isRefreshing, hasError, refetch } = useSurveyStatistics(id, period);
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
      // El PDF respeta el semestre elegido: lo que se exporta es lo que se ve.
      const { file, fileName } = await surveysService.exportSurveyPdf(id, period);
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

  const careerName = statistics?.career?.title ?? "Todas las carreras";
  const questionCount = statistics?.questions.length ?? 0;
  const title = statistics ? `Analíticas de ${statistics.title}` : SURVEY_STATISTICS_TEXT.pageTitle;
  const description = statistics
    ? `${questionCount === 1 ? "Resultados de 1 pregunta" : `Resultados de las ${questionCount} preguntas`}: ${careerName}`
    : SURVEY_STATISTICS_TEXT.loadingDescription;
  // Sin respuestas no hay nada que exportar.
  const canExportPdf = Boolean(statistics?.hasData) && !isGeneratingPdf;

  const renderResults = () => {
    if (isLoading) return <SurveyStatisticsSkeleton />;

    if (hasError || !statistics) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
          <p className="text-sm font-medium text-destructive">No se pudo encontrar la encuesta o cargar sus métricas.</p>
          <Link href={SURVEYS_PATH} className={buttonVariants({ variant: "outline", className: "mt-4 gap-2 text-xs" })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a encuestas
          </Link>
        </div>
      );
    }

    return (
      <>
        <SurveyStatisticsSummary statistics={statistics} />

        <section className="flex flex-col gap-4" aria-label="Resultados por pregunta">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <BarChart3 className="size-5 text-primary" aria-hidden="true" />
              Resultados por pregunta
            </h2>
            <span className="text-xs text-text-secondary">
              {questionCount} {questionCount === 1 ? "pregunta analizada" : "preguntas analizadas"}
            </span>
          </div>

          {!statistics.hasData && (
            <div role="status" className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
              <BarChart3 className="mb-2 size-9 stroke-[1.5] text-text-secondary/60" aria-hidden="true" />
              <p className="font-medium text-ink">
                {statistics.period
                  ? SURVEY_STATISTICS_TEXT.noResponsesInPeriod(statistics.period)
                  : SURVEY_STATISTICS_TEXT.noResponses}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {statistics.period ? SURVEY_STATISTICS_TEXT.noResponsesInPeriodHint : SURVEY_STATISTICS_TEXT.noResponsesHint}
              </p>
            </div>
          )}

          {/* Los cards se mantienen aunque no haya respuestas: preguntas y opciones quedan visibles en cero. */}
          <div className="grid grid-cols-1 gap-5">
            {statistics.questions.map((question) => (
              <SurveyQuestionResultCard key={question.id} question={question} />
            ))}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="min-w-0">
      <SurveyAnalyticsHeader
        title={title}
        description={description}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isRefreshing}
              className="cursor-pointer gap-1.5 text-xs text-ink-soft hover:text-ink"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} aria-hidden="true" />
              Actualizar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGeneratePdf}
              disabled={!canExportPdf}
              title={statistics && !statistics.hasData ? SURVEY_STATISTICS_TEXT.exportDisabled : undefined}
              className="cursor-pointer gap-1.5 text-xs font-semibold shadow-xs"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Exportando PDF...
                </>
              ) : (
                <>
                  <Download className="size-3.5" aria-hidden="true" />
                  Exportar PDF
                </>
              )}
            </Button>
          </>
        }
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={SURVEYS_PATH}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "-ml-2 gap-1.5 text-xs text-text-secondary hover:text-ink",
            })}
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Volver a encuestas
          </Link>
          {availablePeriods.length > 0 && <SurveyPeriodFilter periods={availablePeriods} value={period} onChange={setPeriod} />}
        </div>

        {renderResults()}
      </main>

      <ExportSuccessToast message={successMessage} />
    </div>
  );
}
